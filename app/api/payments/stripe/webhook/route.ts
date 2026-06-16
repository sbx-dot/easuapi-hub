import { handleStripeWebhook } from "@/lib/stripe-payments";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleStripeWebhook(request);
}
