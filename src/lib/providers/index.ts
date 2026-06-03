import { callOpenAI, callOpenAIStream } from "./openai";
import { callAnthropic } from "./anthropic";
import { callGoogle } from "./google";

export type ProviderName = "OPENAI" | "ANTHROPIC" | "GOOGLE" | "DEEPSEEK" | "MISTRAL" | "ALIBABA" | "ZHIPU" | "XAI";

interface ProviderConfig {
  apiKeyEnv: string;
  baseUrl?: string;
  chatEndpoint: string;
  headers: (apiKey: string) => Record<string, string>;
  transformRequest?: (body: any) => any;
  transformResponse?: (body: any) => any;
}

const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  OPENAI: {
    apiKeyEnv: "OPENAI_API_KEY",
    chatEndpoint: "https://api.openai.com/v1/chat/completions",
    headers: (key) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    }),
  },
  ANTHROPIC: {
    apiKeyEnv: "ANTHROPIC_API_KEY",
    chatEndpoint: "https://api.anthropic.com/v1/messages",
    headers: (key) => ({
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    }),
    transformRequest: (body) => {
      const systemMsg = body.messages?.find((m: any) => m.role === "system");
      const messages = body.messages?.filter((m: any) => m.role !== "system") || [];
      const result: any = {
        model: body.model,
        messages,
        max_tokens: body.max_tokens || 4096,
        stream: body.stream ?? false,
      };
      if (systemMsg) result.system = systemMsg.content;
      if (body.temperature !== undefined) result.temperature = body.temperature;
      return result;
    },
    transformResponse: (body) => ({
      id: body.id,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: body.model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: body.content?.[0]?.text || "",
          },
          finish_reason: body.stop_reason === "end_turn" ? "stop" : body.stop_reason,
        },
      ],
      usage: {
        prompt_tokens: body.usage?.input_tokens || 0,
        completion_tokens: body.usage?.output_tokens || 0,
        total_tokens:
          (body.usage?.input_tokens || 0) + (body.usage?.output_tokens || 0),
      },
    }),
  },
  DEEPSEEK: {
    apiKeyEnv: "DEEPSEEK_API_KEY",
    chatEndpoint: "https://api.deepseek.com/v1/chat/completions",
    headers: (key) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    }),
  },
  MISTRAL: {
    apiKeyEnv: "MISTRAL_API_KEY",
    chatEndpoint: "https://api.mistral.ai/v1/chat/completions",
    headers: (key) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    }),
  },
  ALIBABA: {
    apiKeyEnv: "ALIBABA_API_KEY",
    chatEndpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    headers: (key) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    }),
  },
  ZHIPU: {
    apiKeyEnv: "ZHIPU_API_KEY",
    chatEndpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    headers: (key) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    }),
  },
  XAI: {
    apiKeyEnv: "XAI_API_KEY",
    chatEndpoint: "https://api.x.ai/v1/chat/completions",
    headers: (key) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    }),
  },
  GOOGLE: {
    apiKeyEnv: "GOOGLE_AI_KEY",
    chatEndpoint: "https://generativelanguage.googleapis.com/v1beta/",
    headers: () => ({
      "Content-Type": "application/json",
    }),
  },
};

export function getProviderForModel(modelName: string): { provider: string; config: ProviderConfig } | null {
  const providerMap: Record<string, string> = {
    "gpt-": "OPENAI",
    "claude-": "ANTHROPIC",
    "gemini-": "GOOGLE",
    "deepseek-": "DEEPSEEK",
    "mistral-": "MISTRAL",
    "qwen-": "ALIBABA",
    "glm-": "ZHIPU",
    "grok-": "XAI",
  };

  for (const [prefix, provider] of Object.entries(providerMap)) {
    if (modelName.startsWith(prefix)) {
      return { provider, config: PROVIDER_CONFIGS[provider] };
    }
  }

  return null;
}

export async function proxyChatRequest(
  provider: string,
  modelName: string,
  body: any,
  stream: boolean = false
): Promise<Response> {
  const config = PROVIDER_CONFIGS[provider];
  if (!config) {
    return new Response(JSON.stringify({ error: { message: `Unknown provider: ${provider}`, type: "invalid_request_error" } }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env[config.apiKeyEnv];
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: {
          message: `API key not configured for provider: ${provider}`,
          type: "server_error",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let requestBody = { ...body, model: modelName, stream };

  // Handle Google separately
  if (provider === "GOOGLE") {
    return proxyGoogleRequest(modelName, body, apiKey, stream);
  }

  if (config.transformRequest) {
    requestBody = config.transformRequest(requestBody);
  }

  try {
    const response = await fetch(config.chatEndpoint, {
      method: "POST",
      headers: config.headers(apiKey),
      body: JSON.stringify(requestBody),
    });

    if (stream && response.ok) {
      return new Response(response.body, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    if (!response.ok) {
      const error = await response.text();
      return new Response(
        JSON.stringify({
          error: {
            message: `Provider error: ${error}`,
            type: "provider_error",
          },
        }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    let data = await response.json();
    if (config.transformResponse) {
      data = config.transformResponse(data);
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: { message: `Provider request failed: ${error.message}`, type: "server_error" },
      }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}

async function proxyGoogleRequest(
  modelName: string,
  body: any,
  apiKey: string,
  stream: boolean
): Promise<Response> {
  const contents = body.messages
    ?.filter((m: any) => m.role !== "system")
    .map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })) || [];

  const systemInstruction = body.messages?.find((m: any) => m.role === "system");

  const googleBody: any = {
    contents,
    generationConfig: {
      maxOutputTokens: body.max_tokens || 4096,
      temperature: body.temperature,
    },
  };

  if (systemInstruction) {
    googleBody.systemInstruction = { parts: [{ text: systemInstruction.content }] };
  }

  const endpoint = stream
    ? `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?key=${apiKey}`
    : `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(googleBody),
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(
        JSON.stringify({ error: { message: `Google API error: ${error}`, type: "provider_error" } }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    if (stream) {
      return new Response(response.body, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const usage = data.usageMetadata || {};

    const openaiFormat = {
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: modelName,
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: text },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: usage.promptTokenCount || 0,
        completion_tokens: usage.candidatesTokenCount || 0,
        total_tokens: usage.totalTokenCount || 0,
      },
    };

    return new Response(JSON.stringify(openaiFormat), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: { message: `Google request failed: ${error.message}`, type: "server_error" } }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}

export { PROVIDER_CONFIGS };
