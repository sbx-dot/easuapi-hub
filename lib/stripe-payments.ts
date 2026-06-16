import { createHmac, timingSafeEqual } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readUsdToCnyRate } from "@/lib/paypal-payments";

type AuthResult =
  | {
      userId: string;
      email: string | null;
      response?: never;
    }
  | {
      response: Response;
      userId?: never;
      email?: never;
    };

type StripeCheckoutSession = {
  id?: string;
  url?: string | null;
  mode?: string | null;
  payment_status?: string | null;
  status?: string | null;
  amount_total?: number | null;
  currency?: string | null;
  client_reference_id?: string | null;
  payment_intent?: string | { id?: string } | null;
  metadata?: Record<string, string | undefined> | null;
  [key: string]: unknown;
};

type StripeEvent = {
  id?: string;
  type?: string;
  data?: {
    object?: StripeCheckoutSession;
  };
  [key: string]: unknown;
};

type LocalStripeOrder = {
  id: string;
  user_id: string;
  amount: number | string;
  amount_usd: number | string | null;
  amount_cny: number | string | null;
  exchange_rate: number | string | null;
  method: string | null;
  payment_method: string | null;
  status: string | null;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  currency: string | null;
  created_at: string;
  paid_at: string | null;
};

const STRIPE_API_BASE_URL = "https://api.stripe.com/v1";
const STRIPE_NOTE = "Stripe Checkout recharge";
const STRIPE_MIN_USD_CENTS = 50;
const WEBHOOK_TOLERANCE_SECONDS = 5 * 60;

function jsonResponse(body: unknown, init?: ResponseInit) {
  return Response.json(body, init);
}

function errorResponse(message: string, status = 400, details?: unknown) {
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

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization");
  const match = authHeader?.match(/^Bearer\s+(.+)$/iu);

  return match?.[1]?.trim() ?? "";
}

async function readJsonBody(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function requireAuthenticatedUser(request: Request): Promise<AuthResult> {
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
      email: data.user.email ?? null,
    };
  } catch (error) {
    console.error("Stripe auth lookup failed", error);

    return {
      response: errorResponse("认证失败，请稍后重试。", 500),
    };
  }
}

function readStripeSecretKey() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  return secretKey;
}

function readStripeWebhookSecret() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!webhookSecret) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET");
  }

  return webhookSecret;
}

function readAppUrl(request: Request) {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ??
    process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const requestOrigin = new URL(request.url).origin;

  return (configuredUrl || requestOrigin).replace(/\/+$/u, "");
}

function appendQueryValue(url: string, key: string, value: string) {
  const separator = url.includes("?") ? "&" : "?";

  return `${url}${separator}${encodeURIComponent(key)}=${value}`;
}

function appendQueryValueIfMissing(url: string, key: string, value: string) {
  if (new RegExp(`(?:\\?|&)${key}=`, "u").test(url)) {
    return url;
  }

  return appendQueryValue(url, key, value);
}

function buildStripeSuccessUrl(request: Request, orderId: string) {
  const configuredUrl = process.env.STRIPE_SUCCESS_URL?.trim();
  const baseUrl = configuredUrl || `${readAppUrl(request)}/api/payments/stripe/success`;
  const withSession = appendQueryValueIfMissing(baseUrl, "session_id", "{CHECKOUT_SESSION_ID}");

  return appendQueryValueIfMissing(withSession, "order_id", encodeURIComponent(orderId));
}

function buildStripeCancelUrl(request: Request, orderId: string) {
  const configuredUrl = process.env.STRIPE_CANCEL_URL?.trim();
  const baseUrl = configuredUrl || `${readAppUrl(request)}/api/payments/stripe/cancel`;

  return appendQueryValueIfMissing(baseUrl, "order_id", encodeURIComponent(orderId));
}

function readPositiveAmount(value: unknown) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const roundedAmount = Number(amount.toFixed(2));

  if (roundedAmount !== amount) {
    return null;
  }

  return roundedAmount;
}

function convertUsdToCny(amountUsd: number, exchangeRate: number) {
  return Number((amountUsd * exchangeRate).toFixed(2));
}

function convertCnyToUsdCents(amountCny: number, exchangeRate: number) {
  return Math.max(Math.round((amountCny / exchangeRate) * 100), 1);
}

function resolveStripeRechargeAmounts(amountCnyInput: unknown) {
  const requestedAmountCny = readPositiveAmount(amountCnyInput);

  if (!requestedAmountCny || requestedAmountCny > 50000) {
    return null;
  }

  const exchangeRate = readUsdToCnyRate();
  const amountUsdCents = convertCnyToUsdCents(requestedAmountCny, exchangeRate);

  if (amountUsdCents < STRIPE_MIN_USD_CENTS) {
    return null;
  }

  const amountUsd = Number((amountUsdCents / 100).toFixed(2));
  const amountCny = convertUsdToCny(amountUsd, exchangeRate);

  if (amountCny <= 0 || amountCny > 50000) {
    return null;
  }

  return {
    requestedAmountCny,
    amountUsd,
    amountUsdCents,
    amountCny,
    exchangeRate,
  };
}

function encodeStripeForm(values: Record<string, string | number | undefined | null>) {
  const form = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null) {
      form.append(key, String(value));
    }
  }

  return form;
}

function getStripePaymentIntentId(session: StripeCheckoutSession) {
  if (typeof session.payment_intent === "string") {
    return session.payment_intent;
  }

  return session.payment_intent?.id ?? "";
}

async function logStripePaymentEvent(params: {
  orderId?: string | null;
  userId?: string | null;
  providerEventId?: string | null;
  eventType: string;
  status: string;
  amount?: number | null;
  currency?: string | null;
  providerResponse?: unknown;
}) {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("payment_logs").upsert(
      {
        order_id: params.orderId ?? null,
        user_id: params.userId ?? null,
        provider: "stripe",
        provider_event_id: params.providerEventId ?? null,
        event_type: params.eventType,
        status: params.status,
        amount: params.amount ?? null,
        currency: params.currency ?? "usd",
        provider_response: params.providerResponse ?? null,
      },
      {
        onConflict: "provider_event_id",
      }
    );
  } catch (error) {
    console.error("Failed to write Stripe payment log", error);
  }
}

async function markStripeOrderFailed(orderId: string, providerResponse?: unknown) {
  try {
    const supabase = getSupabaseAdmin();
    await supabase
      .from("orders")
      .update({
        status: "failed",
        provider_response: providerResponse ?? null,
      })
      .eq("id", orderId)
      .neq("status", "paid");
  } catch (error) {
    console.error("Failed to mark Stripe order as failed", error);
  }
}

function verifyStripeSignature(payload: string, signatureHeader: string, webhookSecret: string) {
  const parts = signatureHeader.split(",");
  const timestampPart = parts.find((part) => part.startsWith("t="));
  const signatureParts = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3));
  const timestamp = Number(timestampPart?.slice(2));

  if (!Number.isFinite(timestamp) || signatureParts.length === 0) {
    throw new Error("Invalid Stripe signature header");
  }

  const age = Math.abs(Math.floor(Date.now() / 1000) - timestamp);

  if (age > WEBHOOK_TOLERANCE_SECONDS) {
    throw new Error("Stripe webhook timestamp is outside tolerance");
  }

  const expectedSignature = createHmac("sha256", webhookSecret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  const matched = signatureParts.some((signature) => {
    const signatureBuffer = Buffer.from(signature, "hex");

    return signatureBuffer.length === expectedBuffer.length && timingSafeEqual(signatureBuffer, expectedBuffer);
  });

  if (!matched) {
    throw new Error("Stripe webhook signature verification failed");
  }
}

function renderStripePage(title: string, body: string, status = 200) {
  return new Response(
    `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #020617; color: #e2e8f0; font-family: Arial, sans-serif; }
      main { width: min(720px, calc(100vw - 32px)); border: 1px solid rgba(103, 232, 249, .25); border-radius: 12px; background: rgba(15, 23, 42, .92); padding: 28px; box-shadow: 0 24px 80px rgba(0,0,0,.35); }
      h1 { margin: 0 0 12px; color: #fff; font-size: 28px; }
      p { line-height: 1.8; }
      dl { display: grid; grid-template-columns: 120px 1fr; gap: 10px 14px; margin: 20px 0; }
      dt { color: #94a3b8; }
      dd { margin: 0; word-break: break-all; }
      a { display: inline-flex; margin-top: 14px; color: #020617; background: #fff; border-radius: 10px; padding: 10px 14px; text-decoration: none; font-weight: 700; }
      code { color: #67e8f9; }
    </style>
  </head>
  <body>
    <main>${body}</main>
  </body>
</html>`,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    }
  );
}

export function estimateStripeCnyFromRechargeAmount(amountCnyInput: unknown) {
  const amounts = resolveStripeRechargeAmounts(amountCnyInput);

  if (!amounts) {
    return null;
  }

  return {
    amount_usd: amounts.amountUsd,
    amount_cny: amounts.amountCny,
    exchange_rate: amounts.exchangeRate,
    currency: "usd",
  };
}

export async function handleCreateStripeCheckoutSession(request: Request) {
  const auth = await requireAuthenticatedUser(request);

  if (auth.response) {
    return auth.response;
  }

  const body = await readJsonBody(request);

  if (!body) {
    return errorResponse("Invalid JSON request body", 400);
  }

  const amounts = resolveStripeRechargeAmounts(body.amount_cny ?? body.amount);

  if (!amounts) {
    return errorResponse("充值金额无效，Stripe 折算后的美元金额需至少 $0.50，且到账金额不超过 50000 CNY。", 400);
  }

  const supabase = getSupabaseAdmin();
  const { data: localOrder, error: insertError } = await supabase
    .from("orders")
    .insert({
      user_id: auth.userId,
      amount: amounts.amountCny,
      amount_usd: amounts.amountUsd,
      amount_cny: amounts.amountCny,
      exchange_rate: amounts.exchangeRate,
      currency: "usd",
      status: "pending",
      method: "stripe",
      payment_method: "stripe",
      note: STRIPE_NOTE,
    })
    .select("id,user_id,amount,amount_usd,amount_cny,exchange_rate,method,payment_method,status,stripe_session_id,stripe_payment_intent_id,currency,created_at,paid_at")
    .single();

  if (insertError || !localOrder) {
    console.error("Failed to create local Stripe order", insertError);

    return errorResponse("本地 Stripe 订单创建失败。", 500);
  }

  const order = localOrder as LocalStripeOrder;
  const successUrl = buildStripeSuccessUrl(request, order.id);
  const cancelUrl = buildStripeCancelUrl(request, order.id);
  const metadata = {
    order_id: order.id,
    user_id: auth.userId,
    payment_method: "stripe",
    amount_usd: amounts.amountUsd.toFixed(2),
    amount_cny: amounts.amountCny.toFixed(2),
    requested_amount_cny: amounts.requestedAmountCny.toFixed(2),
    exchange_rate: amounts.exchangeRate.toFixed(4),
  };

  try {
    const response = await fetch(`${STRIPE_API_BASE_URL}/checkout/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${readStripeSecretKey()}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: encodeStripeForm({
        mode: "payment",
        client_reference_id: order.id,
        customer_email: auth.email,
        success_url: successUrl,
        cancel_url: cancelUrl,
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][unit_amount]": amounts.amountUsdCents,
        "line_items[0][price_data][product_data][name]": "eelapi balance recharge",
        "line_items[0][price_data][product_data][description]": `Credit CNY ${amounts.amountCny.toFixed(2)} at 1 USD = ${amounts.exchangeRate.toFixed(4)} CNY`,
        "line_items[0][quantity]": 1,
        "metadata[order_id]": metadata.order_id,
        "metadata[user_id]": metadata.user_id,
        "metadata[payment_method]": metadata.payment_method,
        "metadata[amount_usd]": metadata.amount_usd,
        "metadata[amount_cny]": metadata.amount_cny,
        "metadata[requested_amount_cny]": metadata.requested_amount_cny,
        "metadata[exchange_rate]": metadata.exchange_rate,
        "payment_intent_data[metadata][order_id]": metadata.order_id,
        "payment_intent_data[metadata][user_id]": metadata.user_id,
        "payment_intent_data[metadata][payment_method]": metadata.payment_method,
      }),
    });
    const checkoutSession = (await response.json().catch(() => null)) as StripeCheckoutSession | null;
    const stripeSessionId = checkoutSession?.id;
    const checkoutUrl = checkoutSession?.url;
    const stripePaymentIntentId = checkoutSession ? getStripePaymentIntentId(checkoutSession) : "";

    if (!response.ok || !stripeSessionId || !checkoutUrl) {
      await markStripeOrderFailed(order.id, checkoutSession);
      await logStripePaymentEvent({
        orderId: order.id,
        userId: auth.userId,
        providerEventId: stripeSessionId ? `checkout_session.failed:${stripeSessionId}` : `checkout_session.failed:${order.id}`,
        eventType: "checkout.session.create_failed",
        status: "failed",
        amount: amounts.amountUsd,
        currency: "usd",
        providerResponse: checkoutSession,
      });

      return errorResponse("Stripe Checkout Session 创建失败。", 502, checkoutSession);
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        stripe_session_id: stripeSessionId,
        stripe_payment_intent_id: stripePaymentIntentId || null,
        provider_response: checkoutSession,
      })
      .eq("id", order.id)
      .eq("user_id", auth.userId);

    if (updateError) {
      await markStripeOrderFailed(order.id, checkoutSession);
      console.error("Failed to attach Stripe session id", updateError);

      return errorResponse("Stripe 订单保存失败。", 500);
    }

    await supabase.from("recharge_records").upsert(
      {
        order_id: order.id,
        user_id: auth.userId,
        amount: amounts.amountCny,
        amount_usd: amounts.amountUsd,
        amount_cny: amounts.amountCny,
        currency: "usd",
        payment_method: "stripe",
        status: "pending",
        provider_reference: stripeSessionId,
        meta: {
          stripe_session_id: stripeSessionId,
          stripe_payment_intent_id: stripePaymentIntentId || null,
          exchange_rate: amounts.exchangeRate,
        },
      },
      {
        onConflict: "order_id",
      }
    );
    await logStripePaymentEvent({
      orderId: order.id,
      userId: auth.userId,
      providerEventId: `checkout_session.created:${stripeSessionId}`,
      eventType: "checkout.session.created",
      status: "pending",
      amount: amounts.amountUsd,
      currency: "usd",
      providerResponse: checkoutSession,
    });

    return jsonResponse({
      order_id: order.id,
      checkout_url: checkoutUrl,
      stripe_session_id: stripeSessionId,
      stripe_payment_intent_id: stripePaymentIntentId || null,
      amount_usd: amounts.amountUsd,
      amount_cny: amounts.amountCny,
      requested_amount_cny: amounts.requestedAmountCny,
      exchange_rate: amounts.exchangeRate,
      currency: "usd",
    });
  } catch (error) {
    await markStripeOrderFailed(order.id);
    console.error("Stripe Checkout Session create failed", error);

    return errorResponse("Stripe Checkout Session 创建失败。", 502);
  }
}

export async function handleStripeWebhook(request: Request) {
  const signatureHeader = request.headers.get("stripe-signature");
  const payload = await request.text();

  if (!signatureHeader) {
    return errorResponse("Missing Stripe signature", 400);
  }

  try {
    verifyStripeSignature(payload, signatureHeader, readStripeWebhookSecret());
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);

    return errorResponse("Invalid Stripe signature", 400);
  }

  let event: StripeEvent;

  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    return errorResponse("Invalid Stripe webhook payload", 400);
  }

  if (!event.id || !event.type) {
    return errorResponse("Invalid Stripe webhook event", 400);
  }

  if (event.type !== "checkout.session.completed") {
    await logStripePaymentEvent({
      providerEventId: event.id,
      eventType: event.type,
      status: "ignored",
      providerResponse: event,
    });

    return jsonResponse({ received: true, ignored: true });
  }

  const session = event.data?.object;
  const stripeSessionId = session?.id ?? "";
  const stripePaymentIntentId = session ? getStripePaymentIntentId(session) : "";
  const orderId = session?.metadata?.order_id ?? session?.client_reference_id ?? "";
  const userId = session?.metadata?.user_id ?? null;
  const amountUsd = Number(session?.metadata?.amount_usd ?? 0);
  const expectedAmountTotal = Number.isFinite(amountUsd) ? Math.round(amountUsd * 100) : 0;

  if (!stripeSessionId || !orderId) {
    await logStripePaymentEvent({
      providerEventId: event.id,
      eventType: event.type,
      status: "failed",
      providerResponse: event,
    });

    return errorResponse("Stripe session missing order metadata", 400);
  }

  if (
    session?.mode !== "payment" ||
    session.payment_status !== "paid" ||
    session.currency?.toLowerCase() !== "usd" ||
    !session.amount_total ||
    session.amount_total !== expectedAmountTotal
  ) {
    await logStripePaymentEvent({
      orderId,
      userId,
      providerEventId: event.id,
      eventType: event.type,
      status: "failed",
      amount: amountUsd || null,
      currency: session?.currency ?? "usd",
      providerResponse: event,
    });

    return errorResponse("Stripe checkout session is not a paid USD payment for the expected amount", 400);
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc("complete_stripe_recharge_order", {
      target_stripe_session_id: stripeSessionId,
      target_stripe_payment_intent_id: stripePaymentIntentId || null,
      target_webhook_event_id: event.id,
      target_provider_response: event,
    });

    if (error) {
      throw error;
    }

    const completedOrder = Array.isArray(data) ? data[0] : data;

    return jsonResponse({
      received: true,
      order: completedOrder ?? null,
    });
  } catch (error) {
    console.error("Stripe webhook completion failed", error);
    await logStripePaymentEvent({
      orderId,
      userId,
      providerEventId: event.id,
      eventType: event.type,
      status: "failed",
      amount: amountUsd || null,
      currency: "usd",
      providerResponse: event,
    });

    return errorResponse("Stripe order completion failed", 500);
  }
}

export async function handleStripeSuccessPage(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id")?.trim() ?? "";
  const orderId = url.searchParams.get("order_id")?.trim() ?? "";

  let order: LocalStripeOrder | null = null;

  if (sessionId || orderId) {
    try {
      const supabase = getSupabaseAdmin();
      let query = supabase
        .from("orders")
        .select("id,user_id,amount,amount_usd,amount_cny,exchange_rate,method,payment_method,status,stripe_session_id,stripe_payment_intent_id,currency,created_at,paid_at");

      if (sessionId) {
        query = query.eq("stripe_session_id", sessionId);
      } else {
        query = query.eq("id", orderId);
      }

      const { data } = await query.maybeSingle();
      order = (data as LocalStripeOrder | null) ?? null;
    } catch (error) {
      console.error("Failed to load Stripe success order", error);
    }
  }

  const body = `
      <h1>Stripe 支付已完成，正在确认入账</h1>
      <p>页面回跳只用于展示结果，余额入账以 Stripe webhook 验签后的 <code>checkout.session.completed</code> 为准。</p>
      <dl>
        <dt>订单号</dt><dd>${order?.id ?? (orderId || "待同步")}</dd>
        <dt>支付方式</dt><dd>Stripe</dd>
        <dt>支付金额</dt><dd>$${Number(order?.amount_usd ?? 0).toFixed(2)} USD</dd>
        <dt>到账金额</dt><dd>￥${Number(order?.amount_cny ?? order?.amount ?? 0).toFixed(2)} CNY</dd>
        <dt>订单状态</dt><dd>${order?.status ?? "正在等待 webhook"}</dd>
        <dt>支付时间</dt><dd>${order?.paid_at ?? "webhook 确认后更新"}</dd>
      </dl>
      <p>如果这里仍显示 pending，请稍等几秒后回到充值记录刷新。</p>
      <a href="${readAppUrl(request)}/?tab=orders">返回充值记录</a>`;

  return renderStripePage("Stripe 支付确认中", body);
}

export async function handleStripeCancelPage(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("order_id")?.trim() ?? "";

  const body = `
      <h1>Stripe 支付已取消</h1>
      <p>这笔 Checkout 没有完成支付，不会给账户余额入账。你可以返回充值中心重新选择金额并发起支付。</p>
      <dl>
        <dt>订单号</dt><dd>${orderId || "未返回"}</dd>
        <dt>支付方式</dt><dd>Stripe</dd>
        <dt>订单状态</dt><dd>未支付</dd>
      </dl>
      <a href="${readAppUrl(request)}/?tab=recharge">返回充值中心</a>`;

  return renderStripePage("Stripe 支付已取消", body);
}
