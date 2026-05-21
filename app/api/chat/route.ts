import { handleAuthenticatedChatCompletion } from "@/lib/chat-completions";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleAuthenticatedChatCompletion(request);
}
