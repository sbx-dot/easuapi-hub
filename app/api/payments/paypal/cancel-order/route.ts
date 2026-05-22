import { handleCancelPayPalOrder } from "@/lib/paypal-payments";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleCancelPayPalOrder(request);
}
