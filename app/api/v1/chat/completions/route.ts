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

function readPricePer1K() {
  const price = Number(process.env.API_PRICE_PER_1K_TOKENS ?? "0.01");

  return Number.isFinite(price) && price >= 0 ? price : 0.01;
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
      .update({ balance: balance - cost })
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

  if (body.stream === true) {
    return errorResponse("Streaming is not supported in this first version. Please omit stream or set stream=false.", 400);
  }

  if (!Array.isArray(body.messages)) {
    return errorResponse("messages must be an array", 400);
  }

  const upstreamBaseUrl = process.env.UPSTREAM_BASE_URL?.trim();
  const upstreamApiKey = process.env.UPSTREAM_API_KEY?.trim();
  const defaultModel = process.env.UPSTREAM_DEFAULT_MODEL?.trim() || "gpt-4o-mini";
  const model = typeof body.model === "string" && body.model.trim() ? body.model.trim() : defaultModel;

  if (!upstreamBaseUrl || !upstreamApiKey) {
    return errorResponse("Server is missing UPSTREAM_BASE_URL or UPSTREAM_API_KEY", 500);
  }

  let apiKeyRow: ApiKeyRow;
  let balance: number;

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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed";
    return errorResponse(message, 500);
  }

  const upstreamPayload = {
    ...body,
    model,
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
      await recordUsage({
        userId: apiKeyRow.user_id,
        model,
        promptTokens: 0,
        completionTokens: 0,
        cost: 0,
        status: "failed",
        balance,
      });

      return errorResponse(
        "Upstream request failed",
        upstreamStatus >= 400 ? upstreamStatus : 502,
        upstreamJson.error?.message ?? upstreamJson
      );
    }
  } catch (error) {
    await recordUsage({
      userId: apiKeyRow.user_id,
      model,
      promptTokens: 0,
      completionTokens: 0,
      cost: 0,
      status: "failed",
      balance,
    });

    const message = error instanceof Error ? error.message : "Upstream request failed";
    return errorResponse("Upstream request failed", 502, message);
  }

  const usage = upstreamJson.usage;
  const promptTokens = Number(usage?.prompt_tokens ?? 0);
  const completionTokens = Number(usage?.completion_tokens ?? 0);
  const totalTokens = Number(usage?.total_tokens ?? promptTokens + completionTokens);
  const pricePer1K = readPricePer1K();
  const cost = totalTokens > 0 ? Number(((totalTokens / 1000) * pricePer1K).toFixed(6)) : 0;

  try {
    await recordUsage({
      userId: apiKeyRow.user_id,
      model: upstreamJson.model ?? model,
      promptTokens: Number.isFinite(promptTokens) ? promptTokens : 0,
      completionTokens: Number.isFinite(completionTokens) ? completionTokens : 0,
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
