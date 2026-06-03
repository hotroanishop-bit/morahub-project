import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const keyId = searchParams.get("keyId");

  if (keyId) {
    // Usage for a specific key
    const key = await prisma.apiKey.findFirst({
      where: { id: keyId, userId: session.user.id },
    });

    if (!key) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    const [totalUsage, byDay, byModel] = await Promise.all([
      prisma.usageLog.aggregate({
        where: { apiKeyId: keyId },
        _sum: { tokensIn: true, tokensOut: true, cost: true },
        _count: true,
      }),
      prisma.usageLog.groupBy({
        by: ["createdAt"],
        where: { apiKeyId: keyId },
        _sum: { tokensIn: true, tokensOut: true, cost: true },
        _count: true,
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.usageLog.groupBy({
        by: ["modelId"],
        where: { apiKeyId: keyId },
        _sum: { tokensIn: true, tokensOut: true, cost: true },
        _count: true,
      }),
    ]);

    // Resolve model names
    const modelIds = byModel.map(m => m.modelId);
    const models = await prisma.aiModel.findMany({
      where: { id: { in: modelIds } },
      select: { id: true, name: true, displayName: true },
    });
    const modelMap = Object.fromEntries(models.map(m => [m.id, m]));

    return NextResponse.json({
      key: {
        id: key.id,
        name: key.name,
        totalCalls: key.totalCalls,
        totalTokens: key.totalTokens,
        lastUsedAt: key.lastUsedAt,
        lastModel: key.lastModel,
      },
      usage: {
        totalCalls: totalUsage._count || 0,
        totalTokensIn: Number(totalUsage._sum.tokensIn || 0),
        totalTokensOut: Number(totalUsage._sum.tokensOut || 0),
        totalCost: Number(totalUsage._sum.cost || 0),
      },
      byDay: byDay.map(d => ({
        date: d.createdAt.toISOString().split("T")[0],
        calls: d._count,
        tokensIn: Number(d._sum.tokensIn || 0),
        tokensOut: Number(d._sum.tokensOut || 0),
        cost: Number(d._sum.cost || 0),
      })),
      byModel: byModel.map(m => ({
        model: modelMap[m.modelId]?.displayName || m.modelId,
        calls: m._count,
        tokensIn: Number(m._sum.tokensIn || 0),
        tokensOut: Number(m._sum.tokensOut || 0),
        cost: Number(m._sum.cost || 0),
      })),
    });
  }

  // All keys usage summary
  const keys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
      key: true,
      isActive: true,
      totalCalls: true,
      totalTokens: true,
      lastUsedAt: true,
      lastModel: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Get recent usage per key
  const keyIds = keys.map(k => k.id);
  const usageAgg = await prisma.usageLog.groupBy({
    by: ["apiKeyId"],
    where: { apiKeyId: { in: keyIds } },
    _sum: { cost: true },
    _count: true,
  });

  const usageMap = Object.fromEntries(
    usageAgg.map(u => [u.apiKeyId, { calls: u._count, cost: Number(u._sum.cost || 0) }])
  );

  return NextResponse.json({
    keys: keys.map(k => ({
      ...k,
      recentCalls: usageMap[k.id]?.calls || 0,
      recentCost: usageMap[k.id]?.cost || 0,
    })),
  });
}
