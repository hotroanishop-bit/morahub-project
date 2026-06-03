import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { dispatchWebhook } from "@/lib/webhook";
import { disableExpiredKeys } from "@/lib/key-utils";

const CKEY_API_URL = "https://ckey.vn/v1/chat/completions";

export function getProviderForModel(model: string): string {
  const modelLower = model.toLowerCase();
  if (modelLower.includes("gpt")) return "openai";
  if (modelLower.includes("claude")) return "anthropic";
  if (modelLower.includes("gemini")) return "google";
  if (modelLower.includes("deepseek")) return "deepseek";
  if (modelLower.includes("mistral")) return "mistral";
  if (modelLower.includes("qwen")) return "alibaba";
  if (modelLower.includes("glm")) return "zhipu";
  if (modelLower.includes("grok")) return "xai";
  if (modelLower.includes("minimax")) return "minimax";
  return "openai";
}

export async function handleChatCompletions(req: NextRequest) {
  try {
    // Periodically disable expired keys
    disableExpiredKeys().catch(console.error);

    const body = await req.json();
    const { model, messages, max_tokens, temperature, stream } = body;

    if (!model || !messages) {
      return Response.json({ error: "model and messages required" }, { status: 400 });
    }

    // Get API key from request header
    const apiKey = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!apiKey) {
      return Response.json({ error: "API key required" }, { status: 401 });
    }

    // Verify API key exists and is active
    const dbKey = await prisma.apiKey.findFirst({
      where: { key: apiKey, isActive: true },
    });

    if (!dbKey) {
      return Response.json({ error: "Invalid API key" }, { status: 401 });
    }

    // Check expiration
    if (dbKey.expiresAt && new Date(dbKey.expiresAt) < new Date()) {
      return Response.json({ error: "API key expired" }, { status: 401 });
    }

    // Check IP whitelist
    if (dbKey.allowedIPs) {
      const allowedIPs = JSON.parse(dbKey.allowedIPs);
      const clientIP = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
      if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
        return Response.json({ error: "IP not allowed" }, { status: 403 });
      }
    }

    // Check domain whitelist
    if (dbKey.allowedDomains) {
      const allowedDomains = JSON.parse(dbKey.allowedDomains);
      const referer = req.headers.get("referer") || "";
      if (allowedDomains.length > 0 && !allowedDomains.some((d: string) => referer.includes(d))) {
        return Response.json({ error: "Domain not allowed" }, { status: 403 });
      }
    }

    // Check rate limit
    if (dbKey.rateLimit) {
      const recentCalls = await prisma.usageLog.count({
        where: {
          apiKeyId: dbKey.id,
          createdAt: { gte: new Date(Date.now() - 60000) },
        },
      });
      if (recentCalls >= dbKey.rateLimit) {
        return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
      }
    }

    // Check usage limits (maxCalls / maxTokens)
    if (dbKey.maxCalls && dbKey.totalCalls >= dbKey.maxCalls) {
      return Response.json({ error: "API key call limit reached" }, { status: 429 });
    }
    if (dbKey.maxTokens && dbKey.totalTokens >= dbKey.maxTokens) {
      return Response.json({ error: "API key token limit reached" }, { status: 429 });
    }

    // Check plan-based daily limits
    const user = await prisma.user.findUnique({ where: { id: dbKey.userId }, include: { plan: true } });
    if (user?.plan && (user.plan.dailyCalls > 0 || user.plan.dailyTokens > 0)) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayUsage = await prisma.usageLog.aggregate({
        where: { userId: dbKey.userId, createdAt: { gte: todayStart } },
        _sum: { tokensIn: true, tokensOut: true },
        _count: true,
      });
      if (user.plan.dailyCalls > 0 && (todayUsage._count || 0) >= user.plan.dailyCalls) {
        return Response.json({ error: "Daily call limit reached for your plan" }, { status: 429 });
      }
      const todayTokens = Number(todayUsage._sum.tokensIn || 0) + Number(todayUsage._sum.tokensOut || 0);
      if (user.plan.dailyTokens > 0 && todayTokens >= user.plan.dailyTokens) {
        return Response.json({ error: "Daily token limit reached for your plan" }, { status: 429 });
      }
    }

    // Get user and check credit balance
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    if (!user || Number(user.creditBalance) <= 0) {
      // Notify low credit (throttled - only once per hour via webhook)
      dispatchWebhook("credit.depleted", dbKey.userId, { balance: Number(user?.creditBalance || 0) }).catch(console.error);
      return Response.json({ error: "Insufficient credits" }, { status: 402 });
    }

    // Get model info for pricing
    const modelInfo = await prisma.aiModel.findFirst({
      where: { name: model, isActive: true },
    });

    if (!modelInfo) {
      return Response.json({ error: "Model not available" }, { status: 400 });
    }

    // Get ckey API key from settings
    const siteSettings = await prisma.siteSettings.findFirst();
    const ckeyKey = siteSettings?.ckeyApiKey || process.env.CKEY_API_KEY || apiKey;

    // Check cache for non-streaming requests
    if (!stream) {
      const { getCachedResponse } = await import("@/lib/cache");
      const cached = await getCachedResponse(model, messages, temperature ?? 0.7);
      if (cached) {
        // Return cached response with zero cost
        return Response.json(cached);
      }
    }

    // Proxy to ckey.vn
    const startTime = Date.now();
    let upstreamResponse = await fetch(CKEY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ckeyKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: max_tokens || 4096,
        temperature: temperature ?? 0.7,
        stream: stream || false,
      }),
    });

    // Model fallback: if primary fails and fallback is set, try fallback
    if (!upstreamResponse.ok && modelInfo.fallbackModel) {
      console.log(`Model ${model} failed (${upstreamResponse.status}), trying fallback: ${modelInfo.fallbackModel}`);
      upstreamResponse = await fetch(CKEY_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ckeyKey}`,
        },
        body: JSON.stringify({
          model: modelInfo.fallbackModel,
          messages,
          max_tokens: max_tokens || 4096,
          temperature: temperature ?? 0.7,
          stream: stream || false,
        }),
      }).catch(() => upstreamResponse); // If fallback also fails, keep original response
    }

    // Handle streaming response
    if (stream) {
      // Pipe the SSE stream through, but also capture for logging
      const decoder = new TextDecoder();
      let buffer = "";
      let tokensIn = 0;
      let tokensOut = 0;

      const transformStream = new TransformStream({
        transform(chunk, controller) {
          controller.enqueue(chunk);
          // Try to parse usage from the stream's [DONE] or final chunk
          const text = decoder.decode(chunk, { stream: true });
          buffer += text;
        },
        flush() {
          // Parse accumulated buffer for usage stats
          const lines = buffer.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const parsed = JSON.parse(line.slice(6));
                if (parsed.usage) {
                  tokensIn = parsed.usage.prompt_tokens || 0;
                  tokensOut = parsed.usage.completion_tokens || 0;
                }
              } catch {}
            }
          }
          // Log usage (fire and forget)
          const latency = Date.now() - startTime;
          const cost = (tokensIn * Number(modelInfo.pricePer1kIn) / 1000) + (tokensOut * Number(modelInfo.pricePer1kOut) / 1000);

          prisma.usageLog.create({
            data: {
              userId: dbKey.userId,
              apiKeyId: dbKey.id,
              modelId: modelInfo.id,
              tokensIn,
              tokensOut,
              cost,
              latency,
              status: "success",
            },
          }).catch(console.error);

          prisma.apiKey.update({
            where: { id: dbKey.id },
            data: {
              totalCalls: { increment: 1 },
              totalTokens: { increment: tokensIn + tokensOut },
              lastModel: model,
              lastUsedAt: new Date(),
            },
          }).catch(console.error);

          prisma.user.update({
            where: { id: dbKey.userId },
            data: { creditBalance: { decrement: cost } },
          }).catch(console.error);

          // Dispatch webhook
          dispatchWebhook("usage.created", dbKey.userId, {
            model,
            tokensIn,
            tokensOut,
            cost,
            latency,
          }).catch(console.error);
        },
      });

      return new Response(upstreamResponse.body!.pipeThrough(transformStream), {
        status: upstreamResponse.status,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // Non-streaming: parse JSON response
    const data = await upstreamResponse.json();
    const latency = Date.now() - startTime;

    // Calculate cost
    const tokensIn = data.usage?.prompt_tokens || 0;
    const tokensOut = data.usage?.completion_tokens || 0;
    const cost = (tokensIn * Number(modelInfo.pricePer1kIn) / 1000) + (tokensOut * Number(modelInfo.pricePer1kOut) / 1000);

    // Log usage
    await prisma.usageLog.create({
      data: {
        userId: dbKey.userId,
        apiKeyId: dbKey.id,
        modelId: modelInfo.id,
        tokensIn,
        tokensOut,
        cost,
        latency,
        status: data.error ? "error" : "success",
        errorMsg: data.error?.message || null,
      },
    });

    // Log request details
    const ua = req.headers.get("user-agent") || "";
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";
    prisma.requestLog.create({
      data: {
        userId: dbKey.userId,
        apiKeyId: dbKey.id,
        model,
        endpoint: "/v1/chat/completions",
        method: "POST",
        requestBody: JSON.stringify({ model, messages, max_tokens, temperature, stream: !!stream }),
        responseBody: JSON.stringify(data).slice(0, 10000),
        statusCode: upstreamResponse.status,
        latency,
        tokensIn,
        tokensOut,
        cost,
        ip: ip.slice(0, 45),
        userAgent: ua.slice(0, 200),
      },
    }).catch(console.error);

    // Update key stats
    await prisma.apiKey.update({
      where: { id: dbKey.id },
      data: {
        totalCalls: { increment: 1 },
        totalTokens: { increment: tokensIn + tokensOut },
        lastModel: model,
        lastUsedAt: new Date(),
      },
    });

    // Deduct credits
    await prisma.user.update({
      where: { id: dbKey.userId },
      data: { creditBalance: { decrement: cost } },
    });

    // Dispatch webhook
    await dispatchWebhook("usage.created", dbKey.userId, {
      model,
      tokensIn,
      tokensOut,
      cost,
      latency,
    });

    return Response.json(data);
  } catch (error) {
    console.error("Chat completions error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
