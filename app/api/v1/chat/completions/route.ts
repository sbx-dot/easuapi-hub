import { corsHeaders, handleExternalChatCompletion } from "@/lib/chat-completions";

export const runtime = "nodejs";

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  return handleExternalChatCompletion(request);
}
