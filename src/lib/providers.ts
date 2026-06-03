// Provider configuration for AI models
// Maps model names to their provider API endpoints and keys

const PROVIDERS: Record<string, { baseUrl: string; apiKey: string; headers?: Record<string, string> }> = {
  OPENAI: {
    baseUrl: "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_API_KEY || "",
    headers: { "OpenAI-Beta": "assistants=v1" },
  },
  ANTHROPIC: {
    baseUrl: "https://api.anthropic.com/v1",
    apiKey: process.env.ANTHROPIC_API_KEY || "",
    headers: { "anthropic-version": "2023-06-01" },
  },
  GOOGLE: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    apiKey: process.env.GOOGLE_AI_API_KEY || "",
  },
  DEEPSEEK: {
    baseUrl: "https://api.deepseek.com/v1",
    apiKey: process.env.DEEPSEEK_API_KEY || "",
  },
  MISTRAL: {
    baseUrl: "https://api.mistral.ai/v1",
    apiKey: process.env.MISTRAL_API_KEY || "",
  },
  ALIBABA: {
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    apiKey: process.env.QWEN_API_KEY || "",
  },
  ZHIPU: {
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    apiKey: process.env.ZHIPU_API_KEY || "",
  },
  XAI: {
    baseUrl: "https://api.x.ai/v1",
    apiKey: process.env.XAI_API_KEY || "",
  },
};

// Model → Provider mapping
const MODEL_PROVIDER_MAP: Record<string, string> = {
  "gpt-4o": "OPENAI",
  "gpt-4o-mini": "OPENAI",
  "claude-3.5-sonnet": "ANTHROPIC",
  "claude-3-haiku": "ANTHROPIC",
  "gemini-pro": "GOOGLE",
  "deepseek-chat": "DEEPSEEK",
  "mistral-large": "MISTRAL",
  "qwen-max": "ALIBABA",
  "glm-4": "ZHIPU",
  "grok-2": "XAI",
};

export function getProviderForModel(modelName: string): { provider: string; config: typeof PROVIDERS[string] } | null {
  const providerName = MODEL_PROVIDER_MAP[modelName];
  if (!providerName) return null;
  const config = PROVIDERS[providerName];
  if (!config || !config.apiKey) return null;
  return { provider: providerName, config };
}

export async function proxyChatRequest(
  providerName: string,
  model: string,
  body: { messages: any[]; temperature?: number; max_tokens?: number; stream?: boolean },
  stream: boolean = false
): Promise<Response> {
  const config = PROVIDERS[providerName];
  if (!config) throw new Error(`Unknown provider: ${providerName}`);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`,
    ...config.headers,
  };

  // Anthropic uses x-api-key instead of Authorization
  if (providerName === "ANTHROPIC") {
    headers["x-api-key"] = config.apiKey;
    delete headers["Authorization"];
  }

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({ model, ...body, stream }),
  });

  return res;
}
