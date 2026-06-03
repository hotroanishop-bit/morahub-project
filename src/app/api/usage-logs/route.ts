import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "7d";

  // Calculate date range
  const now = new Date();
  let fromDate: Date;
  if (period === "24h") {
    fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  } else if (period === "30d") {
    fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else {
    fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  const where = {
    userId: session.user.id,
    createdAt: { gte: fromDate },
  };

  // Get all logs for aggregation
  const logs = await prisma.usageLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { model: { select: { name: true, displayName: true } } },
  });

  const totalRequests = logs.length;
  const totalTokens = logs.reduce((sum, l) => sum + l.tokensIn + l.tokensOut, 0);
  const successCount = logs.filter(l => l.status === "success").length;
  const successRate = totalRequests > 0 ? (successCount / totalRequests) * 100 : 100;
  const avgLatency = logs.length > 0 ? logs.reduce((sum, l) => sum + l.latency, 0) / logs.length : 0;

  // Group by day
  const dayMap = new Map<string, { requests: number; tokens: number }>();
  for (const log of logs) {
    const day = log.createdAt.toISOString().split("T")[0];
    const existing = dayMap.get(day) || { requests: 0, tokens: 0 };
    existing.requests++;
    existing.tokens += log.tokensIn + log.tokensOut;
    dayMap.set(day, existing);
  }

  // Fill missing days
  const byDay: { date: string; requests: number; tokens: number }[] = [];
  const days = period === "24h" ? 1 : period === "30d" ? 30 : 7;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split("T")[0];
    const data = dayMap.get(key) || { requests: 0, tokens: 0 };
    byDay.push({ date: key, ...data });
  }

  // Group by model
  const modelMap = new Map<string, { model: string; requests: number; tokens: number }>();
  for (const log of logs) {
    const modelName = log.model?.displayName || log.modelId;
    const existing = modelMap.get(modelName) || { model: modelName, requests: 0, tokens: 0 };
    existing.requests++;
    existing.tokens += log.tokensIn + log.tokensOut;
    modelMap.set(modelName, existing);
  }
  const byModel = Array.from(modelMap.values()).sort((a, b) => b.requests - a.requests);

  return NextResponse.json({
    totalRequests,
    totalTokens,
    successRate,
    avgLatency,
    byDay,
    byModel,
  });
}
