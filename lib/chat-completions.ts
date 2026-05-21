import { createHash, randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type ChatCompletionRequest = {
  model?: string;
  messages?: unknown;
  stream?: boolean;
  api_key_id?: unknown;
  [key: string]: unknown;
};

type ApiKeyRow = {
  id: string;
  user_id: string;
  name?: string | null;
  key_prefix: string;
  created_at?: string;
  revoked: boolean;
};

type ProfileRow = {
  id: string;
  balance: number | string | null;
};

type ModelPricingRow = {
  name: string;
  upstream_model: string;
  supplier_name: string;
  input_price_per_1k: number | string;
  output_price_per_1k: number | string;
  enabled: boolean;
};

type SupplierRow = {
  name: string;
  base_url: string;
  api_key_encrypted: string | null;
  provider_type: string;
  enabled: boolean;
};

type UpstreamUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

type UpstreamResponse = {
  model?: string;
  usage?: UpstreamUsage;
  error?: {
    message?: string;
  };
  [key: string]: unknown;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RequestLimitError = {
  code: string;
  message: string;
};

type UsageLogStatus = "success" | "failed" | "blocked" | "rate_limited";

type RequestLogContext = {
  requestId: string;
  startedAt: number;
  ipHash: string | null;
  userAgentHash: string | null;
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const MAX_MESSAGES_JSON_LENGTH = 20_000;
const MAX_TOKENS_LIMIT = 4096;
const API_KEY_PREFIX_LENGTH = 16;
const UPSTREAM_TIMEOUT_MS = 45_000;
const GENERIC_SERVER_ERROR = "Internal server error";
const rateLimitBuckets = new Map<string, RateLimitBucket>();

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonResponse(body: unknown, init?: ResponseInit) {
  return Response.json(body, {
    ...init,
    headers: {
      ...corsHeaders,
      ...(init?.headers ?? {}),
    },
  });
}

function errorResponse(message: string, status: number, details?: unknown, requestId?: string) {
  return jsonResponse(
    {
      error: {
        message,
        details,
        request_id: requestId,
      },
    },
    { status }
  );
}

function serverErrorResponse(requestId?: string) {
  return errorResponse(GENERIC_SERVER_ERROR, 500, undefined, requestId);
}

function normalizeBaseUrl(url: string) {
  return url.trim().replace(/\/+$/u, "");
}

function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function createLogContext(request: Request): RequestLogContext {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ipValue =
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    forwardedFor ||
    "";
  const userAgent = request.headers.get("user-agent")?.trim() || "";

  return {
    requestId: randomUUID(),
    startedAt: Date.now(),
    ipHash: ipValue ? sha256Hex(ipValue) : null,
    userAgentHash: userAgent ? sha256Hex(userAgent) : null,
  };
}

function readLatencyMs(context: RequestLogContext) {
  return Math.max(0, Date.now() - context.startedAt);
}

function readApiKeyPrefix(value: string) {
  return value ? value.slice(0, API_KEY_PREFIX_LENGTH) : null;
}

function redactSensitiveText(value: string) {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/giu, "Bearer [REDACTED]")
    .replace(/\bsk_(?:live|test)_[A-Za-z0-9_-]{8,}\b/giu, "[REDACTED_API_KEY]")
    .replace(/\bsk-[A-Za-z0-9_-]{8,}\b/giu, "[REDACTED_API_KEY]");
}

function truncateErrorMessage(value: unknown) {
  if (typeof value === "string") {
    return redactSensitiveText(value).slice(0, 500);
  }

  if (value === undefined || value === null) {
    return null;
  }

  try {
    return redactSensitiveText(JSON.stringify(value)).slice(0, 500);
  } catch {
    return "Unknown error";
  }
}

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization");
  const match = authHeader?.match(/^Bearer\s+(.+)$/iu);

  return match?.[1]?.trim() ?? "";
}

function readFallbackPricePer1K() {
  const price = Number(process.env.API_PRICE_PER_1K_TOKENS ?? "0.01");

  return Number.isFinite(price) && price >= 0 ? price : 0.01;
}

function readModelPrice(value: number | string | null | undefined) {
  const price = Number(value);

  if (Number.isFinite(price) && price >= 0) {
    return price;
  }

  return readFallbackPricePer1K();
}

function checkRateLimit(bucketKey: string) {
  const now = Date.now();

  for (const [key, bucket] of rateLimitBuckets) {
    if (bucket.resetAt <= now) {
      rateLimitBuckets.delete(key);
    }
  }

  const existingBucket = rateLimitBuckets.get(bucketKey);

  if (!existingBucket || existingBucket.resetAt <= now) {
    rateLimitBuckets.set(bucketKey, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });

    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      retryAfterSeconds: RATE_LIMIT_WINDOW_MS / 1000,
    };
  }

  if (existingBucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((existingBucket.resetAt - now) / 1000),
    };
  }

  existingBucket.count += 1;

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - existingBucket.count,
    retryAfterSeconds: Math.ceil((existingBucket.resetAt - now) / 1000),
  };
}

function validateRequestLimits(body: ChatCompletionRequest): RequestLimitError | null {
  if (body.stream === true) {
    return {
      code: "stream_not_supported",
      message: "Streaming is not supported in this first version. Please omit stream or set stream=false.",
    };
  }

  if (!Array.isArray(body.messages)) {
    return {
      code: "invalid_messages",
      message: "messages must be an array",
    };
  }

  const messagesLength = JSON.stringify(body.messages).length;

  if (messagesLength > MAX_MESSAGES_JSON_LENGTH) {
    return {
      code: "messages_too_long",
      message: `messages is too large. Total serialized messages length must be <= ${MAX_MESSAGES_JSON_LENGTH} characters.`,
    };
  }

  const maxTokens = body.max_tokens;

  if (
    maxTokens !== undefined &&
    (typeof maxTokens !== "number" || !Number.isFinite(maxTokens) || maxTokens > MAX_TOKENS_LIMIT)
  ) {
    return {
      code: "max_tokens_exceeded",
      message: `max_tokens must be a number less than or equal to ${MAX_TOKENS_LIMIT}.`,
    };
  }

  return null;
}

async function recordUsageEvent({
  userId,
  apiKeyId,
  apiKeyPrefix,
  model,
  supplierName,
  promptTokens,
  completionTokens,
  cost,
  status,
  balance,
  httpStatus,
  errorCode,
  errorMessage,
  context,
}: {
  userId?: string | null;
  apiKeyId?: string | null;
  apiKeyPrefix?: string | null;
  model: string;
  supplierName?: string | null;
  promptTokens: number;
  completionTokens: number;
  cost: number;
  status: UsageLogStatus;
  balance?: number;
  httpStatus?: number | null;
  errorCode?: string | null;
  errorMessage?: unknown;
  context: RequestLogContext;
}) {
  const supabase = getSupabaseAdmin();

  if (status === "success" && cost > 0 && userId) {
    const { error: balanceError } = await supabase
      .from("profiles")
      .update({ balance: Math.max(0, Number(balance ?? 0) - cost) })
      .eq("id", userId);

    if (balanceError) {
      throw new Error(`Failed to update balance: ${balanceError.message}`);
    }
  }

  const { error: usageError } = await supabase.from("usage_logs").insert({
    user_id: userId ?? null,
    api_key_id: apiKeyId ?? null,
    api_key_prefix: apiKeyPrefix ?? null,
    model: model || "unknown",
    supplier_name: supplierName ?? null,
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    cost,
    status,
    error_code: errorCode ?? null,
    error_message: truncateErrorMessage(errorMessage),
    http_status: httpStatus ?? (status === "success" ? 200 : null),
    request_id: context.requestId,
    latency_ms: readLatencyMs(context),
    ip_hash: context.ipHash,
    user_agent_hash: context.userAgentHash,
  });

  if (usageError) {
    throw new Error(`Failed to record usage: ${usageError.message}`);
  }
}

async function safeRecordErrorUsage({
  userId,
  apiKeyId,
  apiKeyPrefix,
  model,
  supplierName,
  status,
  httpStatus,
  errorCode,
  errorMessage,
  context,
}: {
  userId?: string | null;
  apiKeyId?: string | null;
  apiKeyPrefix?: string | null;
  model?: string | null;
  supplierName?: string | null;
  status: Exclude<UsageLogStatus, "success">;
  httpStatus: number;
  errorCode: string;
  errorMessage: unknown;
  context: RequestLogContext;
}) {
  try {
    await recordUsageEvent({
      userId,
      apiKeyId,
      apiKeyPrefix,
      model: model || "unknown",
      supplierName,
      promptTokens: 0,
      completionTokens: 0,
      cost: 0,
      status,
      httpStatus,
      errorCode,
      errorMessage,
      context,
    });
  } catch (error) {
    console.error("Failed to record error usage", error);
  }
}

async function readJsonBody(request: Request) {
  try {
    return {
      body: (await request.json()) as ChatCompletionRequest,
    };
  } catch {
    return {
      response: errorResponse("Invalid JSON request body", 400),
    };
  }
}

async function requireAuthenticatedUser(request: Request) {
  const accessToken = getBearerToken(request);

  if (!accessToken) {
    return {
      response: errorResponse("请先登录。", 401),
    };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      return {
        response: errorResponse("登录已过期，请重新登录。", 401),
      };
    }

    return {
      userId: data.user.id,
    };
  } catch (error) {
    console.error("Authenticated user lookup failed", error);

    return {
      response: serverErrorResponse(),
    };
  }
}

async function applyRateLimit(apiKeyRow: ApiKeyRow, bucketKey: string, model: string, context: RequestLogContext) {
  const rateLimit = checkRateLimit(bucketKey);

  if (rateLimit.allowed) {
    return null;
  }

  await safeRecordErrorUsage({
    userId: apiKeyRow.user_id,
    apiKeyId: apiKeyRow.id,
    apiKeyPrefix: apiKeyRow.key_prefix,
    model,
    status: "rate_limited",
    httpStatus: 429,
    errorCode: "rate_limited",
    errorMessage: "Rate limit exceeded. Each API Key can make at most 20 requests per minute.",
    context,
  });

  return jsonResponse(
    {
      error: {
        message: "Rate limit exceeded. Each API Key can make at most 20 requests per minute.",
        request_id: context.requestId,
      },
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(rateLimit.retryAfterSeconds),
        "X-RateLimit-Limit": String(RATE_LIMIT_MAX_REQUESTS),
        "X-RateLimit-Remaining": "0",
      },
    }
  );
}

async function processChatCompletion({
  body,
  apiKeyRow,
  suppliedKeyPrefix,
  context,
}: {
  body: ChatCompletionRequest;
  apiKeyRow: ApiKeyRow;
  suppliedKeyPrefix?: string | null;
  context: RequestLogContext;
}) {
  const fallbackUpstreamApiKey = process.env.UPSTREAM_API_KEY?.trim();
  const defaultModel = process.env.UPSTREAM_DEFAULT_MODEL?.trim() || "deepseek-chat";
  let balance = 0;
  let modelPricing: ModelPricingRow | null = null;
  let supplier: SupplierRow | null = null;
  const model = typeof body.model === "string" && body.model.trim() ? body.model.trim() : defaultModel;

  try {
    const supabase = getSupabaseAdmin();
    const requestLimitError = validateRequestLimits(body);

    if (requestLimitError) {
      await safeRecordErrorUsage({
        userId: apiKeyRow.user_id,
        apiKeyId: apiKeyRow.id,
        apiKeyPrefix: apiKeyRow.key_prefix,
        model,
        status: "blocked",
        httpStatus: 400,
        errorCode: requestLimitError.code,
        errorMessage: requestLimitError.message,
        context,
      });

      return errorResponse(requestLimitError.message, 400, undefined, context.requestId);
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id,balance")
      .eq("id", apiKeyRow.user_id)
      .maybeSingle();

    if (profileError) {
      throw new Error(`Profile lookup failed: ${profileError.message}`);
    }

    const profile = profileData as ProfileRow | null;
    balance = Number(profile?.balance ?? 0);

    if (!profile || balance <= 0) {
      await safeRecordErrorUsage({
        userId: apiKeyRow.user_id,
        apiKeyId: apiKeyRow.id,
        apiKeyPrefix: apiKeyRow.key_prefix,
        model,
        status: "blocked",
        httpStatus: 402,
        errorCode: "insufficient_balance",
        errorMessage: "Insufficient balance",
        context,
      });

      return errorResponse("Insufficient balance", 402, undefined, context.requestId);
    }

    const { data: modelData, error: modelError } = await supabase
      .from("models")
      .select("name,upstream_model,supplier_name,input_price_per_1k,output_price_per_1k,enabled")
      .eq("name", model)
      .eq("enabled", true)
      .maybeSingle();

    if (modelError) {
      throw new Error(`Model pricing lookup failed: ${modelError.message}`);
    }

    if (!modelData) {
      await safeRecordErrorUsage({
        userId: apiKeyRow.user_id,
        apiKeyId: apiKeyRow.id,
        apiKeyPrefix: apiKeyRow.key_prefix,
        model,
        status: "blocked",
        httpStatus: 400,
        errorCode: "model_not_available",
        errorMessage: "model not supported or disabled",
        context,
      });

      return errorResponse("model not supported or disabled", 400, undefined, context.requestId);
    }

    modelPricing = modelData as ModelPricingRow;

    const { data: supplierData, error: supplierError } = await supabase
      .from("suppliers")
      .select("name,base_url,api_key_encrypted,provider_type,enabled")
      .eq("name", modelPricing.supplier_name)
      .maybeSingle();

    if (supplierError) {
      throw new Error(`Supplier lookup failed: ${supplierError.message}`);
    }

    if (!supplierData) {
      await safeRecordErrorUsage({
        userId: apiKeyRow.user_id,
        apiKeyId: apiKeyRow.id,
        apiKeyPrefix: apiKeyRow.key_prefix,
        model: modelPricing.name,
        supplierName: modelPricing.supplier_name,
        status: "blocked",
        httpStatus: 400,
        errorCode: "supplier_not_configured",
        errorMessage: `Supplier ${modelPricing.supplier_name} is not configured`,
        context,
      });

      return errorResponse(`Supplier ${modelPricing.supplier_name} is not configured`, 400, undefined, context.requestId);
    }

    supplier = supplierData as SupplierRow;

    if (!supplier.enabled) {
      await safeRecordErrorUsage({
        userId: apiKeyRow.user_id,
        apiKeyId: apiKeyRow.id,
        apiKeyPrefix: apiKeyRow.key_prefix,
        model: modelPricing.name,
        supplierName: supplier.name,
        status: "blocked",
        httpStatus: 400,
        errorCode: "supplier_disabled",
        errorMessage: `Supplier ${supplier.name} is disabled. Please contact the administrator.`,
        context,
      });

      return errorResponse(
        `Supplier ${supplier.name} is disabled. Please contact the administrator.`,
        400,
        undefined,
        context.requestId
      );
    }

    if (supplier.provider_type.trim().toLowerCase() !== "openai-compatible") {
      await safeRecordErrorUsage({
        userId: apiKeyRow.user_id,
        apiKeyId: apiKeyRow.id,
        apiKeyPrefix: apiKeyRow.key_prefix,
        model: modelPricing.name,
        supplierName: supplier.name,
        status: "blocked",
        httpStatus: 400,
        errorCode: "supplier_provider_unsupported",
        errorMessage: `Supplier ${supplier.name} provider_type is not supported`,
        context,
      });

      return errorResponse(`Supplier ${supplier.name} provider_type is not supported`, 400, undefined, context.requestId);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed";
    console.error("Chat completion setup failed", error);
    await safeRecordErrorUsage({
      userId: apiKeyRow.user_id,
      apiKeyId: apiKeyRow.id,
      apiKeyPrefix: apiKeyRow.key_prefix ?? suppliedKeyPrefix,
      model,
      supplierName: supplier?.name ?? modelPricing?.supplier_name,
      status: "failed",
      httpStatus: 500,
      errorCode: "internal_error",
      errorMessage: message,
      context,
    });

    return serverErrorResponse(context.requestId);
  }

  if (!modelPricing) {
    return errorResponse("model not supported or disabled", 400, undefined, context.requestId);
  }

  if (!supplier) {
    return errorResponse(`Supplier ${modelPricing.supplier_name} is not configured`, 400, undefined, context.requestId);
  }

  const upstreamApiKey = supplier.api_key_encrypted?.trim() || fallbackUpstreamApiKey;

  if (!upstreamApiKey) {
    await safeRecordErrorUsage({
      userId: apiKeyRow.user_id,
      apiKeyId: apiKeyRow.id,
      apiKeyPrefix: apiKeyRow.key_prefix ?? suppliedKeyPrefix,
      model: modelPricing.name,
      supplierName: supplier.name,
      status: "failed",
      httpStatus: 500,
      errorCode: "supplier_api_key_missing",
      errorMessage: `Supplier ${supplier.name} API key is not configured`,
      context,
    });

    return serverErrorResponse(context.requestId);
  }

  const upstreamPayload = {
    ...body,
    model: modelPricing.upstream_model,
    stream: false,
  };
  delete upstreamPayload.api_key_id;

  let upstreamJson: UpstreamResponse;
  let upstreamStatus: number;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstreamResponse = await fetch(`${normalizeBaseUrl(supplier.base_url)}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${upstreamApiKey}`,
      },
      body: JSON.stringify(upstreamPayload),
      signal: controller.signal,
    });

    upstreamStatus = upstreamResponse.status;
    const upstreamText = await upstreamResponse.text();

    try {
      upstreamJson = JSON.parse(upstreamText) as UpstreamResponse;
    } catch {
      upstreamJson = {
        error: {
          message: upstreamText.slice(0, 1000) || "Upstream returned a non-JSON response",
        },
      };
    }

    if (!upstreamResponse.ok) {
      await safeRecordErrorUsage({
        userId: apiKeyRow.user_id,
        apiKeyId: apiKeyRow.id,
        apiKeyPrefix: apiKeyRow.key_prefix ?? suppliedKeyPrefix,
        model: modelPricing.name,
        supplierName: supplier.name,
        status: "failed",
        httpStatus: upstreamStatus >= 400 ? upstreamStatus : 502,
        errorCode: "upstream_error",
        errorMessage: upstreamJson.error?.message ?? upstreamJson,
        context,
      });

      return errorResponse(
        "Upstream request failed",
        upstreamStatus >= 400 ? upstreamStatus : 502,
        undefined,
        context.requestId
      );
    }
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "AbortError";
    const message = isTimeout
      ? `Upstream request timed out after ${UPSTREAM_TIMEOUT_MS / 1000}s`
      : error instanceof Error
        ? error.message
        : "Upstream request failed";

    await safeRecordErrorUsage({
      userId: apiKeyRow.user_id,
      apiKeyId: apiKeyRow.id,
      apiKeyPrefix: apiKeyRow.key_prefix ?? suppliedKeyPrefix,
      model: modelPricing.name,
      supplierName: supplier.name,
      status: "failed",
      httpStatus: isTimeout ? 504 : 502,
      errorCode: isTimeout ? "upstream_timeout" : "upstream_error",
      errorMessage: message,
      context,
    });

    return errorResponse("Upstream request failed", isTimeout ? 504 : 502, isTimeout ? message : undefined, context.requestId);
  } finally {
    clearTimeout(timeout);
  }

  const usage = upstreamJson.usage;
  const promptTokens = Number(usage?.prompt_tokens ?? 0);
  const completionTokens = Number(usage?.completion_tokens ?? 0);
  const safePromptTokens = Number.isFinite(promptTokens) ? promptTokens : 0;
  const safeCompletionTokens = Number.isFinite(completionTokens) ? completionTokens : 0;
  const inputPricePer1K = readModelPrice(modelPricing.input_price_per_1k);
  const outputPricePer1K = readModelPrice(modelPricing.output_price_per_1k);
  const cost =
    safePromptTokens > 0 || safeCompletionTokens > 0
      ? Number(
          ((safePromptTokens / 1000) * inputPricePer1K + (safeCompletionTokens / 1000) * outputPricePer1K).toFixed(6)
        )
      : 0;

  try {
    await recordUsageEvent({
      userId: apiKeyRow.user_id,
      apiKeyId: apiKeyRow.id,
      apiKeyPrefix: apiKeyRow.key_prefix ?? suppliedKeyPrefix,
      model: modelPricing.name,
      supplierName: supplier.name,
      promptTokens: safePromptTokens,
      completionTokens: safeCompletionTokens,
      cost,
      status: "success",
      httpStatus: upstreamStatus,
      balance,
      context,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Usage recording failed";
    console.error("Usage recording failed", error);
    await safeRecordErrorUsage({
      userId: apiKeyRow.user_id,
      apiKeyId: apiKeyRow.id,
      apiKeyPrefix: apiKeyRow.key_prefix ?? suppliedKeyPrefix,
      model: modelPricing.name,
      supplierName: supplier.name,
      status: "failed",
      httpStatus: 500,
      errorCode: "usage_recording_failed",
      errorMessage: message,
      context,
    });

    return serverErrorResponse(context.requestId);
  }

  return jsonResponse(upstreamJson, {
    status: upstreamStatus,
    headers: {
      "X-Request-Id": context.requestId,
    },
  });
}

export async function listAuthenticatedChatApiKeys(request: Request) {
  const auth = await requireAuthenticatedUser(request);

  if (auth.response) {
    return auth.response;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("api_keys")
      .select("id,name,key_prefix,created_at")
      .eq("user_id", auth.userId)
      .eq("revoked", false)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return jsonResponse({
      api_keys: data ?? [],
    });
  } catch (error) {
    console.error("Failed to load authenticated API keys", error);

    return serverErrorResponse();
  }
}

export async function handleAuthenticatedChatCompletion(request: Request) {
  const context = createLogContext(request);
  const auth = await requireAuthenticatedUser(request);

  if (auth.response) {
    return auth.response;
  }

  const bodyResult = await readJsonBody(request);

  if (bodyResult.response) {
    return errorResponse("Invalid JSON request body", 400, undefined, context.requestId);
  }

  const body = bodyResult.body ?? {};
  const requestedApiKeyId = typeof body.api_key_id === "string" && body.api_key_id.trim() ? body.api_key_id.trim() : "";

  try {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("api_keys")
      .select("id,user_id,key_prefix,revoked")
      .eq("user_id", auth.userId)
      .eq("revoked", false);

    if (requestedApiKeyId) {
      query = query.eq("id", requestedApiKeyId);
    } else {
      query = query.order("created_at", { ascending: false }).limit(1);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return errorResponse(
        requestedApiKeyId ? "API Key 不可用，请重新选择或创建一个。" : "你还没有 API Key，请先到 API Key 页面创建一个。",
        400,
        undefined,
        context.requestId
      );
    }

    const apiKeyRow = data as ApiKeyRow;
    const model = typeof body.model === "string" && body.model.trim() ? body.model.trim() : "deepseek-chat";
    const rateLimitResponse = await applyRateLimit(apiKeyRow, `internal:${apiKeyRow.id}`, model, context);

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    return processChatCompletion({
      body,
      apiKeyRow,
      context,
    });
  } catch (error) {
    console.error("Authenticated chat failed", error);

    return serverErrorResponse(context.requestId);
  }
}

export async function handleExternalChatCompletion(request: Request) {
  const context = createLogContext(request);
  const userApiKey = getBearerToken(request);
  const suppliedKeyPrefix = readApiKeyPrefix(userApiKey);
  const defaultModel = process.env.UPSTREAM_DEFAULT_MODEL?.trim() || "deepseek-chat";

  if (!userApiKey) {
    await safeRecordErrorUsage({
      model: defaultModel,
      status: "blocked",
      httpStatus: 401,
      errorCode: "missing_api_key",
      errorMessage: "Missing Authorization header",
      context,
    });

    return errorResponse(
      "Missing Authorization header. Use: Authorization: Bearer YOUR_API_KEY",
      401,
      undefined,
      context.requestId
    );
  }

  let apiKeyRow: ApiKeyRow | null = null;

  try {
    const supabase = getSupabaseAdmin();
    const keyHash = sha256Hex(userApiKey);
    const { data: keyData, error: keyError } = await supabase
      .from("api_keys")
      .select("id,user_id,key_prefix,revoked")
      .eq("key_hash", keyHash)
      .eq("revoked", false)
      .maybeSingle();

    if (keyError) {
      throw new Error(`API key lookup failed: ${keyError.message}`);
    }

    if (!keyData) {
      await safeRecordErrorUsage({
        apiKeyPrefix: suppliedKeyPrefix,
        model: defaultModel,
        status: "blocked",
        httpStatus: 401,
        errorCode: "invalid_api_key",
        errorMessage: "Invalid API key",
        context,
      });

      return errorResponse("Invalid API key", 401, undefined, context.requestId);
    }

    apiKeyRow = keyData as ApiKeyRow;

    const rateLimitResponse = await applyRateLimit(apiKeyRow, `external:${keyHash}`, defaultModel, context);

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    let body: ChatCompletionRequest = {};

    try {
      body = (await request.json()) as ChatCompletionRequest;
    } catch {
      await safeRecordErrorUsage({
        userId: apiKeyRow.user_id,
        apiKeyId: apiKeyRow.id,
        apiKeyPrefix: apiKeyRow.key_prefix,
        model: defaultModel,
        status: "blocked",
        httpStatus: 400,
        errorCode: "invalid_json",
        errorMessage: "Invalid JSON request body",
        context,
      });

      return errorResponse("Invalid JSON request body", 400, undefined, context.requestId);
    }

    return processChatCompletion({
      body,
      apiKeyRow,
      suppliedKeyPrefix,
      context,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed";
    console.error("External chat authentication failed", error);
    await safeRecordErrorUsage({
      userId: apiKeyRow?.user_id,
      apiKeyId: apiKeyRow?.id,
      apiKeyPrefix: apiKeyRow?.key_prefix ?? suppliedKeyPrefix,
      model: defaultModel,
      status: "failed",
      httpStatus: 500,
      errorCode: "internal_error",
      errorMessage: message,
      context,
    });

    return serverErrorResponse(context.requestId);
  }
}
