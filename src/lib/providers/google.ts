export interface GoogleMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export async function callGoogle(
  model: string,
  messages: { role: string; content: string }[],
  apiKey: string,
  options: { stream?: boolean; maxTokens?: number; temperature?: number } = {}
): Promise<Response> {
  const contents: GoogleMessage[] = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const systemInstruction = messages.find((m) => m.role === "system");

  const url = options.stream
    ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`
    : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body: any = {
    contents,
    generationConfig: {
      maxOutputTokens: options.maxTokens || 4096,
      temperature: options.temperature,
    },
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction.content }],
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return response;
}
