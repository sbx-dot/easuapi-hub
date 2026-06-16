import { handleCreateStripeCheckoutSession } from "@/lib/stripe-payments";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleCreateStripeCheckoutSession(request);
}
