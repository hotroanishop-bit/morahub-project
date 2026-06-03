import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "7d";

  const now = new Date();
  let fromDate: Date;
  if (period === "24h") fromDate = new Date(now.getTime() - 86400000);
  else if (period === "30d") fromDate = new Date(now.getTime() - 30 * 86400000);
  else fromDate = new Date(now.getTime() - 7 * 86400000);

  // Per-model detailed stats
  const modelLogs = await prisma.usageLog.groupBy({
    by: ["modelId"],
    where: { createdAt: { gte: fromDate } },
    _count: true,
    _sum: { tokensIn: true, tokensOut: true, cost: true },
    _avg: { latency: true },
    orderBy: { _count: { modelId: "desc" } },
  });

  const modelIds = modelLogs.map(m => m.modelId);
  const models = await prisma.aiModel.findMany({
    where: { id: { in: modelIds } },
    select: { id: true, name: true, displayName: true, provider: true, pricePer1kIn: true, pricePer1kOut: true, isActive: true },
  });
  const modelMap = Object.fromEntries(models.map(m => [m.id, m]));

  // Error counts per model
  const modelErrors = await prisma.usageLog.groupBy({
    by: ["modelId"],
    where: { createdAt: { gte: fromDate }, status: "error" },
    _count: true,
  });
  const errorMap = Object.fromEntries(modelErrors.map(e => [e.modelId, e._count]));

  // Latency percentiles (approximate via aggregation)
  const modelLatency = await prisma.usageLog.groupBy({
    by: ["modelId"],
    where: { createdAt: { gte: fromDate } },
    _avg: { latency: true },
    orderBy: { _avg: { latency: "desc" } },
    take: 10,
  });

  // Total stats
  const totalTokens = modelLogs.reduce((sum, m) => sum + Number(m._sum.tokensIn || 0) + Number(m._sum.tokensOut || 0), 0);
  const totalCost = modelLogs.reduce((sum, m) => sum + Number(m._sum.cost || 0), 0);
  const totalCalls = modelLogs.reduce((sum, m) => sum + m._count, 0);

  return NextResponse.json({
    summary: { totalCalls, totalTokens, totalCost },
    models: modelLogs.map(m => {
      const model = modelMap[m.modelId];
      const tokensIn = Number(m._sum.tokensIn || 0);
      const tokensOut = Number(m._sum.tokensOut || 0);
      return {
        ...model,
        calls: m._count,
        tokensIn,
        tokensOut,
        totalTokens: tokensIn + tokensOut,
        revenue: Number(m._sum.cost || 0),
        avgLatency: Number(m._avg.latency || 0).toFixed(0),
        errors: errorMap[m.modelId] || 0,
        errorRate: m._count > 0 ? (((errorMap[m.modelId] || 0) / m._count) * 100).toFixed(1) : "0",
      };
    }),
    slowest: modelLatency.map(m => ({
      model: modelMap[m.modelId]?.displayName || m.modelId,
      avgLatency: Number(m._avg.latency || 0).toFixed(0),
    })),
  });
}
