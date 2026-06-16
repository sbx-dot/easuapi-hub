import { handleStripeSuccessPage } from "@/lib/stripe-payments";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return handleStripeSuccessPage(request);
}
