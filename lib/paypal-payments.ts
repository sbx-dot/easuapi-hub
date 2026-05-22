import { getSupabaseAdmin } from "@/lib/supabase-admin";

type PayPalLink = {
  href?: string;
  rel?: string;
};

type PayPalOrderResponse = {
  id?: string;
  status?: string;
  links?: PayPalLink[];
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{
        id?: string;
        status?: string;
        amount?: {
          currency_code?: string;
          value?: string;
        };
      }>;
    };
  }>;
  [key: string]: unknown;
};

type LocalOrderRow = {
  id: string;
  user_id: string;
  amount: number | string;
  method: string | null;
  status: string | null;
  paypal_order_id: string | null;
  paypal_capture_id: string | null;
};

const PAYPAL_NOTE = "PayPal Sandbox recharge";

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
    console.error("PayPal auth lookup failed", error);

    return {
      response: errorResponse("认证失败，请稍后重试。", 500),
    };
  }
}

function readPayPalBaseUrl() {
  const mode = process.env.PAYPAL_MODE?.trim().toLowerCase();

  return mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

function readPayPalCredentials() {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error("Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET");
  }

  return {
    clientId,
    clientSecret,
  };
}

function readSiteUrl(request: Request) {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const requestOrigin = new URL(request.url).origin;

  return (configuredUrl || requestOrigin).replace(/\/+$/u, "");
}

function readPositiveAmount(value: unknown) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return Number(amount.toFixed(2));
}

function formatUsdAmount(amount: number | string) {
  const normalized = Number(amount);

  if (!Number.isFinite(normalized) || normalized <= 0) {
    throw new Error("Invalid order amount");
  }

  return normalized.toFixed(2);
}

async function getPayPalAccessToken() {
  const { clientId, clientSecret } = readPayPalCredentials();
  const baseUrl = readPayPalBaseUrl();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = (await response.json().catch(() => null)) as { access_token?: string } | null;

  if (!response.ok || !data?.access_token) {
    throw new Error("Failed to get PayPal access token");
  }

  return data.access_token;
}

function findApproveUrl(order: PayPalOrderResponse) {
  return order.links?.find((link) => link.rel === "approve")?.href ?? "";
}

function readCapture(order: PayPalOrderResponse) {
  return order.purchase_units?.flatMap((unit) => unit.payments?.captures ?? [])[0] ?? null;
}

async function markOrderFailed(orderId: string) {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("orders").update({ status: "failed" }).eq("id", orderId).neq("status", "paid");
  } catch (error) {
    console.error("Failed to mark PayPal order as failed", error);
  }
}

export async function handleCreatePayPalOrder(request: Request) {
  const auth = await requireAuthenticatedUser(request);

  if (auth.response) {
    return auth.response;
  }

  const body = await readJsonBody(request);

  if (!body) {
    return errorResponse("Invalid JSON request body", 400);
  }

  const amount = readPositiveAmount(body.amount);

  if (!amount) {
    return errorResponse("amount must be greater than 0", 400);
  }

  const supabase = getSupabaseAdmin();
  const siteUrl = readSiteUrl(request);
  const amountValue = formatUsdAmount(amount);
  const { data: localOrder, error: insertError } = await supabase
    .from("orders")
    .insert({
      user_id: auth.userId,
      amount,
      status: "pending",
      method: "paypal",
      note: PAYPAL_NOTE,
    })
    .select("id,user_id,amount,method,status,paypal_order_id,paypal_capture_id")
    .single();

  if (insertError || !localOrder) {
    console.error("Failed to create local PayPal order", insertError);

    return errorResponse("本地订单创建失败。", 500);
  }

  const order = localOrder as LocalOrderRow;

  try {
    const accessToken = await getPayPalAccessToken();
    const paypalResponse = await fetch(`${readPayPalBaseUrl()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": order.id,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: order.id,
            amount: {
              currency_code: "USD",
              value: amountValue,
            },
          },
        ],
        application_context: {
          return_url: `${siteUrl}?paypal=success`,
          cancel_url: `${siteUrl}?paypal=cancel`,
          user_action: "PAY_NOW",
        },
      }),
    });
    const paypalOrder = (await paypalResponse.json().catch(() => null)) as PayPalOrderResponse | null;
    const paypalOrderId = paypalOrder?.id;
    const approveUrl = paypalOrder ? findApproveUrl(paypalOrder) : "";

    if (!paypalResponse.ok || !paypalOrderId || !approveUrl) {
      await markOrderFailed(order.id);

      return errorResponse("PayPal 订单创建失败。", 502, paypalOrder);
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        paypal_order_id: paypalOrderId,
      })
      .eq("id", order.id)
      .eq("user_id", auth.userId);

    if (updateError) {
      await markOrderFailed(order.id);
      console.error("Failed to attach PayPal order id", updateError);

      return errorResponse("PayPal 订单保存失败。", 500);
    }

    return jsonResponse({
      order_id: order.id,
      paypal_order_id: paypalOrderId,
      approve_url: approveUrl,
    });
  } catch (error) {
    await markOrderFailed(order.id);
    console.error("PayPal create order failed", error);

    return errorResponse("PayPal 订单创建失败。", 502);
  }
}

export async function handleCapturePayPalOrder(request: Request) {
  const auth = await requireAuthenticatedUser(request);

  if (auth.response) {
    return auth.response;
  }

  const body = await readJsonBody(request);
  const paypalOrderId = typeof body?.paypal_order_id === "string" ? body.paypal_order_id.trim() : "";

  if (!paypalOrderId) {
    return errorResponse("paypal_order_id is required", 400);
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("id,user_id,amount,method,status,paypal_order_id,paypal_capture_id")
    .eq("paypal_order_id", paypalOrderId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load PayPal order", error);

    return errorResponse("订单读取失败。", 500);
  }

  if (!data) {
    return errorResponse("订单不存在。", 404);
  }

  const order = data as LocalOrderRow;

  if (order.user_id !== auth.userId) {
    return errorResponse("不能操作其他用户的订单。", 403);
  }

  if (order.method !== "paypal") {
    return errorResponse("订单不是 PayPal 订单。", 400);
  }

  if (order.status === "paid") {
    return jsonResponse({
      success: true,
      already_paid: true,
      order_id: order.id,
      paypal_order_id: paypalOrderId,
      paypal_capture_id: order.paypal_capture_id,
    });
  }

  if (["failed", "canceled", "rejected"].includes(order.status ?? "")) {
    return errorResponse("订单当前状态不允许确认到账。", 409);
  }

  try {
    const accessToken = await getPayPalAccessToken();
    const paypalResponse = await fetch(`${readPayPalBaseUrl()}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": order.id,
      },
      body: "{}",
    });
    const paypalOrder = (await paypalResponse.json().catch(() => null)) as PayPalOrderResponse | null;

    if (!paypalResponse.ok || paypalOrder?.status !== "COMPLETED") {
      await markOrderFailed(order.id);

      return errorResponse("PayPal 支付未完成。", 502, paypalOrder);
    }

    const capture = readCapture(paypalOrder);
    const captureId = capture?.id;
    const capturedCurrency = capture?.amount?.currency_code;
    const capturedAmount = capture?.amount?.value;
    const expectedAmount = formatUsdAmount(order.amount);
    const capturedAmountNumber = Number(capturedAmount);

    if (
      !captureId ||
      capturedCurrency !== "USD" ||
      !Number.isFinite(capturedAmountNumber) ||
      capturedAmountNumber.toFixed(2) !== expectedAmount
    ) {
      await markOrderFailed(order.id);

      return errorResponse("PayPal capture 金额校验失败。", 502, paypalOrder);
    }

    const { data: completedRows, error: completeError } = await supabase.rpc("complete_paypal_recharge_order", {
      target_paypal_order_id: paypalOrderId,
      target_paypal_capture_id: captureId,
    });

    if (completeError) {
      console.error("Failed to complete PayPal recharge order", completeError);

      return errorResponse("PayPal 订单入账失败。", 500);
    }

    const completedOrder = Array.isArray(completedRows) ? completedRows[0] : completedRows;

    return jsonResponse({
      success: true,
      order_id: order.id,
      paypal_order_id: paypalOrderId,
      paypal_capture_id: captureId,
      order: completedOrder ?? null,
    });
  } catch (error) {
    console.error("PayPal capture order failed", error);

    return errorResponse("PayPal 订单确认失败。", 502);
  }
}

export async function handleCancelPayPalOrder(request: Request) {
  const auth = await requireAuthenticatedUser(request);

  if (auth.response) {
    return auth.response;
  }

  const body = await readJsonBody(request);
  const paypalOrderId = typeof body?.paypal_order_id === "string" ? body.paypal_order_id.trim() : "";

  if (!paypalOrderId) {
    return errorResponse("paypal_order_id is required", 400);
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("orders")
      .select("id,user_id,method,status,paypal_order_id")
      .eq("paypal_order_id", paypalOrderId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return errorResponse("订单不存在。", 404);
    }

    const order = data as Pick<LocalOrderRow, "id" | "user_id" | "method" | "status" | "paypal_order_id">;

    if (order.user_id !== auth.userId) {
      return errorResponse("不能操作其他用户的订单。", 403);
    }

    if (order.method !== "paypal") {
      return errorResponse("订单不是 PayPal 订单。", 400);
    }

    if (order.status === "paid") {
      return jsonResponse({
        success: true,
        already_paid: true,
        order_id: order.id,
      });
    }

    if (order.status === "pending") {
      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: "canceled" })
        .eq("id", order.id)
        .eq("user_id", auth.userId)
        .eq("status", "pending");

      if (updateError) {
        throw updateError;
      }
    }

    return jsonResponse({
      success: true,
      order_id: order.id,
    });
  } catch (error) {
    console.error("PayPal cancel order failed", error);

    return errorResponse("PayPal 订单取消状态更新失败。", 500);
  }
}
