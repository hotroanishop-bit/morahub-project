export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function callOpenAI(
  request: ChatRequest,
  apiKey: string
): Promise<Response> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: request.model,
      messages: request.messages,
      stream: request.stream ?? false,
      temperature: request.temperature,
      max_tokens: request.max_tokens,
      top_p: request.top_p,
    }),
  });

  return response;
}

export async function callOpenAIStream(
  request: ChatRequest,
  apiKey: string
): Promise<Response> {
  return callOpenAI({ ...request, stream: true }, apiKey);
}
