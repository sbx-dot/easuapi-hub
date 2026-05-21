import { listAuthenticatedChatApiKeys } from "@/lib/chat-completions";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return listAuthenticatedChatApiKeys(request);
}
