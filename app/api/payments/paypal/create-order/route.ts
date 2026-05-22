import { handleCreatePayPalOrder } from "@/lib/paypal-payments";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleCreatePayPalOrder(request);
}
