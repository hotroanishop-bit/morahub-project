import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [activeKeys, totalUsage, recentUsage, todayUsage, pendingTxs] = await Promise.all([
      prisma.apiKey.count({ where: { userId: user.id, isActive: true } }),
      prisma.usageLog.count({ where: { userId: user.id } }),
      prisma.usageLog.findMany({
        where: { userId: user.id },
        include: { model: { select: { displayName: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.usageLog.findMany({
        where: { userId: user.id, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        select: { tokensIn: true, tokensOut: true, cost: true },
      }),
      prisma.transaction.findMany({
        where: { userId: user.id, status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const todayTokensIn = todayUsage.reduce((s, u) => s + u.tokensIn, 0);
    const todayTokensOut = todayUsage.reduce((s, u) => s + u.tokensOut, 0);
    const todayCost = todayUsage.reduce((s, u) => s + Number(u.cost), 0);
    const todayCalls = todayUsage.length;

    return NextResponse.json({
      credits: Number(user.creditBalance),
      activeKeys,
      totalUsage,
      todayTokensIn,
      todayTokensOut,
      todayCost,
      todayCalls,
      recentUsage,
      pendingTxs,
      plan: (user as any).plan,
      user: { name: user.name, email: user.email, role: user.role, creditBalance: Number(user.creditBalance) },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
