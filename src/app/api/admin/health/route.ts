import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const last24h = new Date(now.getTime() - 86400000);
  const last1h = new Date(now.getTime() - 3600000);

  // Overall stats
  const [totalCalls, errorCalls, avgLatency] = await Promise.all([
    prisma.usageLog.count({ where: { createdAt: { gte: last24h } } }),
    prisma.usageLog.count({ where: { createdAt: { gte: last24h }, status: "error" } }),
    prisma.usageLog.aggregate({ where: { createdAt: { gte: last24h } }, _avg: { latency: true } }),
  ]);

  // Per-model stats
  const modelStats = await prisma.usageLog.groupBy({
    by: ["modelId"],
    where: { createdAt: { gte: last24h } },
    _count: true,
    _avg: { latency: true },
    orderBy: { _count: { modelId: "desc" } },
  });

  const modelIds = modelStats.map(m => m.modelId);
  const models = await prisma.aiModel.findMany({
    where: { id: { in: modelIds } },
    select: { id: true, name: true, displayName: true, provider: true, isActive: true },
  });
  const modelMap = Object.fromEntries(models.map(m => [m.id, m]));

  // Error counts per model
  const modelErrors = await prisma.usageLog.groupBy({
    by: ["modelId"],
    where: { createdAt: { gte: last24h }, status: "error" },
    _count: true,
  });
  const errorMap = Object.fromEntries(modelErrors.map(e => [e.modelId, e._count]));

  // Error breakdown
  const errors = await prisma.usageLog.groupBy({
    by: ["errorMsg"],
    where: { createdAt: { gte: last24h }, status: "error", errorMsg: { not: null } },
    _count: true,
    orderBy: { _count: { modelId: "desc" } },
    take: 10,
  });

  // Requests per hour (last 24h)
  const hourlyCalls: { hour: string; calls: number; errors: number }[] = [];
  for (let i = 23; i >= 0; i--) {
    const hStart = new Date(now.getTime() - (i + 1) * 3600000);
    const hEnd = new Date(now.getTime() - i * 3600000);
    const [calls, errs] = await Promise.all([
      prisma.usageLog.count({ where: { createdAt: { gte: hStart, lt: hEnd } } }),
      prisma.usageLog.count({ where: { createdAt: { gte: hStart, lt: hEnd }, status: "error" } }),
    ]);
    hourlyCalls.push({
      hour: hEnd.toISOString().split("T")[1].slice(0, 5),
      calls,
      errors: errs,
    });
  }

  // Active users last 1h
  const activeUsers = await prisma.usageLog.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: last1h } },
    _count: true,
  });

  return NextResponse.json({
    summary: {
      totalCalls24h: totalCalls,
      errorCalls24h: errorCalls,
      successRate: totalCalls > 0 ? ((totalCalls - errorCalls) / totalCalls * 100).toFixed(1) : "100",
      avgLatency: Number(avgLatency._avg.latency || 0).toFixed(0),
      activeUsers: activeUsers.length,
    },
    byModel: modelStats.map(m => ({
      ...modelMap[m.modelId],
      calls: m._count,
      avgLatency: Number(m._avg.latency || 0).toFixed(0),
      errors: errorMap[m.modelId] || 0,
      errorRate: m._count > 0 ? (((errorMap[m.modelId] || 0) / m._count) * 100).toFixed(1) : "0",
    })),
    errors: errors.map(e => ({ message: e.errorMsg, count: e._count })),
    hourlyCalls,
  });
}
