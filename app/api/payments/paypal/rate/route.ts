import { estimateUsdToCny } from "@/lib/paypal-payments";

export const runtime = "nodejs";

export async function GET() {
  return Response.json(estimateUsdToCny(1));
}
