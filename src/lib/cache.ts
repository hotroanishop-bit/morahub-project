import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * Generate cache key from request body
 */
function getCacheKey(model: string, messages: any[], temperature: number): string {
  const hash = crypto.createHash("md5")
    .update(JSON.stringify({ model, messages: messages.map(m => ({ role: m.role, content: m.content })), temperature }))
    .digest("hex");
  return hash;
}

/**
 * Get cached response if available (within 5 minutes, same model+messages)
 */
export async function getCachedResponse(model: string, messages: any[], temperature: number): Promise<any | null> {
  try {
    const cacheKey = getCacheKey(model, messages, temperature);
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

    const cached = await prisma.requestLog.findFirst({
      where: {
        model,
        cached: true,
        statusCode: 200,
        createdAt: { gte: fiveMinAgo },
        requestBody: { contains: cacheKey.slice(0, 16) },
      },
      orderBy: { createdAt: "desc" },
    });

    if (cached?.responseBody) {
      return JSON.parse(cached.responseBody);
    }
  } catch {}
  return null;
}

/**
 * Mark a request log as cacheable
 */
export async function markCacheable(logId: string) {
  try {
    await prisma.requestLog.update({
      where: { id: logId },
      data: { cached: true },
    });
  } catch {}
}
