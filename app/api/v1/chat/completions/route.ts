import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type ChatCompletionRequest = {
  model?: string;
  messages?: unknown;
  stream?: boolean;
  [key: string]: unknown;
};

type ApiKeyRow = {
  id: string;
  user_id: string;
  revoked: boolean;
};

type ProfileRow = {
  id: string;
  balance: number | string | null;
};

type ModelPricingRow = {
  name: string;
  upstream_model: string;
  input_price_per_1k: number | string;
  output_price_per_1k: number | string;
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

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const MAX_MESSAGES_JSON_LENGTH = 20_000;
const MAX_TOKENS_LIMIT = 4096;
const rateLimitBuckets = new Map<string, RateLimitBucket>();

const corsHeaders = {
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

function errorResponse(message: string, status: number, details?: unknown) {
  return jsonResponse(
    {
      error: {
        message,
        details,
      },
    },
    { status }
  );
}

function normalizeBaseUrl(url: string) {
  return url.trim().replace(/\/+$/u, "");
}

function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
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

function checkRateLimit(keyHash: string) {
  const now = Date.now();

  for (const [bucketKey, bucket] of rateLimitBuckets) {
    if (bucket.resetAt <= now) {
      rateLimitBuckets.delete(bucketKey);
    }
  }

  const existingBucket = rateLimitBuckets.get(keyHash);

  if (!existingBucket || existingBucket.resetAt <= now) {
    rateLimitBuckets.set(keyHash, {
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

function validateRequestLimits(body: ChatCompletionRequest) {
  if (body.stream === true) {
    return "Streaming is not supported in this first version. Please omit stream or set stream=false.";
  }

  if (!Array.isArray(body.messages)) {
    return "messages must be an array";
  }

  const messagesLength = JSON.stringify(body.messages).length;

  if (messagesLength > MAX_MESSAGES_JSON_LENGTH) {
    return `messages is too large. Total serialized messages length must be <= ${MAX_MESSAGES_JSON_LENGTH} characters.`;
  }

  const maxTokens = body.max_tokens;

  if (
    maxTokens !== undefined &&
    (typeof maxTokens !== "number" || !Number.isFinite(maxTokens) || maxTokens > MAX_TOKENS_LIMIT)
  ) {
    return `max_tokens must be a number less than or equal to ${MAX_TOKENS_LIMIT}.`;
  }

  return "";
}

async function recordUsage({
  userId,
  model,
  promptTokens,
  completionTokens,
  cost,
  status,
  balance,
}: {
  userId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  cost: number;
  status: "success" | "failed";
  balance: number;
}) {
  const supabase = getSupabaseAdmin();

  if (status === "success" && cost > 0) {
    const { error: balanceError } = await supabase
      .from("profiles")
      .update({ balance: Math.max(0, balance - cost) })
      .eq("id", userId);

    if (balanceError) {
      throw new Error(`Failed to update balance: ${balanceError.message}`);
    }
  }

  const { error: usageError } = await supabase.from("usage_logs").insert({
    user_id: userId,
    model,
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    cost,
    status,
  });

  if (usageError) {
    throw new Error(`Failed to record usage: ${usageError.message}`);
  }
}

async function safeRecordFailedUsage(userId: string, model: string, balance: number) {
  try {
    await recordUsage({
      userId,
      model,
      promptTokens: 0,
      completionTokens: 0,
      cost: 0,
      status: "failed",
      balance,
    });
  } catch (error) {
    console.error("Failed to record failed usage", error);
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  const userApiKey = getBearerToken(request);

  if (!userApiKey) {
    return errorResponse("Missing Authorization header. Use: Authorization: Bearer YOUR_API_KEY", 401);
  }

  let body: ChatCompletionRequest;

  try {
    body = (await request.json()) as ChatCompletionRequest;
  } catch {
    return errorResponse("Invalid JSON request body", 400);
  }

  const requestLimitError = validateRequestLimits(body);

  if (requestLimitError) {
    return errorResponse(requestLimitError, 400);
  }

  const upstreamBaseUrl = process.env.UPSTREAM_BASE_URL?.trim();
  const upstreamApiKey = process.env.UPSTREAM_API_KEY?.trim();
  const defaultModel = process.env.UPSTREAM_DEFAULT_MODEL?.trim() || "deepseek-chat";
  const model = typeof body.model === "string" && body.model.trim() ? body.model.trim() : defaultModel;

  if (!upstreamBaseUrl || !upstreamApiKey) {
    return errorResponse("Server is missing UPSTREAM_BASE_URL or UPSTREAM_API_KEY", 500);
  }

  let apiKeyRow: ApiKeyRow;
  let balance: number;
  let modelPricing: ModelPricingRow | null = null;

  try {
    const supabase = getSupabaseAdmin();
    const keyHash = sha256Hex(userApiKey);

    const { data: keyData, error: keyError } = await supabase
      .from("api_keys")
      .select("id,user_id,revoked")
      .eq("key_hash", keyHash)
      .eq("revoked", false)
      .maybeSingle();

    if (keyError) {
      throw new Error(`API key lookup failed: ${keyError.message}`);
    }

    if (!keyData) {
      return errorResponse("Invalid API key", 401);
    }

    apiKeyRow = keyData as ApiKeyRow;

    const rateLimit = checkRateLimit(keyHash);

    if (!rateLimit.allowed) {
      return jsonResponse(
        {
          error: {
            message: "Rate limit exceeded. Each API Key can make at most 20 requests per minute.",
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
      return errorResponse("Insufficient balance", 402);
    }

    const { data: modelData, error: modelError } = await supabase
      .from("models")
      .select("name,upstream_model,input_price_per_1k,output_price_per_1k,enabled")
      .eq("name", model)
      .eq("enabled", true)
      .maybeSingle();

    if (modelError) {
      throw new Error(`Model pricing lookup failed: ${modelError.message}`);
    }

    if (!modelData) {
      return errorResponse("model not supported or disabled", 400);
    }

    modelPricing = modelData as ModelPricingRow;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed";
    return errorResponse(message, 500);
  }

  if (!modelPricing) {
    return errorResponse("model not supported or disabled", 400);
  }

  const upstreamPayload = {
    ...body,
    model: modelPricing.upstream_model,
    stream: false,
  };

  let upstreamJson: UpstreamResponse;
  let upstreamStatus: number;

  try {
    const upstreamResponse = await fetch(`${normalizeBaseUrl(upstreamBaseUrl)}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${upstreamApiKey}`,
      },
      body: JSON.stringify(upstreamPayload),
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
      await safeRecordFailedUsage(apiKeyRow.user_id, modelPricing.name, balance);

      return errorResponse(
        "Upstream request failed",
        upstreamStatus >= 400 ? upstreamStatus : 502,
        upstreamJson.error?.message ?? upstreamJson
      );
    }
  } catch (error) {
    await safeRecordFailedUsage(apiKeyRow.user_id, modelPricing.name, balance);

    const message = error instanceof Error ? error.message : "Upstream request failed";
    return errorResponse("Upstream request failed", 502, message);
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
          (
            (safePromptTokens / 1000) * inputPricePer1K +
            (safeCompletionTokens / 1000) * outputPricePer1K
          ).toFixed(6)
        )
      : 0;

  try {
    await recordUsage({
      userId: apiKeyRow.user_id,
      model: modelPricing.name,
      promptTokens: safePromptTokens,
      completionTokens: safeCompletionTokens,
      cost,
      status: "success",
      balance,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Usage recording failed";
    return errorResponse(message, 500);
  }

  return jsonResponse(upstreamJson, {
    status: upstreamStatus,
  });
}
