export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AnthropicRequest {
  model: string;
  messages: AnthropicMessage[];
  max_tokens: number;
  stream?: boolean;
  system?: string;
  temperature?: number;
}

export async function callAnthropic(
  model: string,
  messages: { role: string; content: string }[],
  apiKey: string,
  options: { stream?: boolean; maxTokens?: number; temperature?: number } = {}
): Promise<Response> {
  const systemMsg = messages.find((m) => m.role === "system");
  const chatMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  const body: any = {
    model,
    messages: chatMessages,
    max_tokens: options.maxTokens || 4096,
    stream: options.stream ?? false,
  };

  if (systemMsg) body.system = systemMsg.content;
  if (options.temperature !== undefined) body.temperature = options.temperature;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  return response;
}
