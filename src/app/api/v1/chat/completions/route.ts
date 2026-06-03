import { NextRequest } from "next/server";
import { handleChatCompletions } from "@/lib/chat-handler";

export async function POST(req: NextRequest) {
  return handleChatCompletions(req);
}
