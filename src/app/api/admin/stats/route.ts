import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [totalUsers, activeUsers, totalModels, activeModels, totalKeys, activeKeys, pendingTxs, completedTxs, totalRevenue, recentTxs] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.user.count({ where: { status: "ACTIVE" } }).catch(() => 0),
      prisma.aiModel.count().catch(() => 0),
      prisma.aiModel.count({ where: { isActive: true } }).catch(() => 0),
      prisma.apiKey.count().catch(() => 0),
      prisma.apiKey.count({ where: { isActive: true } }).catch(() => 0),
      prisma.transaction.count({ where: { status: "PENDING" } }).catch(() => 0),
      prisma.transaction.count({ where: { status: "COMPLETED" } }).catch(() => 0),
      prisma.transaction.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }).catch(() => ({ _sum: { amount: 0 } })),
      prisma.transaction.findMany({ include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 10 }).catch(() => []),
    ]);

    return NextResponse.json({
      totalUsers,
      activeUsers,
      totalModels,
      activeModels,
      totalKeys,
      activeKeys,
      totalUsage: 0,
      pendingTxs,
      completedTxs,
      totalRevenue: totalRevenue._sum.amount || 0,
      recentTxs,
      usageByDay: [],
      usageByModel: [],
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
