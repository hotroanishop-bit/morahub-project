import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const period = url.searchParams.get("period") || "7d";
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Revenue
    const transactions = await prisma.transaction.findMany({
      where: { status: "COMPLETED", createdAt: { gte: startDate } },
      select: { amount: true, createdAt: true },
    });

    const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

    // Daily revenue
    const dailyRevenue: { date: string; amount: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayTotal = transactions
        .filter(t => t.createdAt.toISOString().startsWith(dateStr))
        .reduce((sum, t) => sum + Number(t.amount), 0);
      dailyRevenue.push({ date: dateStr, amount: dayTotal });
    }

    // Previous period for comparison
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);
    const prevTransactions = await prisma.transaction.findMany({
      where: { status: "COMPLETED", createdAt: { gte: prevStartDate, lt: startDate } },
      select: { amount: true },
    });
    const prevRevenue = prevTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue * 100) : 0;

    // Users
    const totalUsers = await prisma.user.count();
    const newUsers = await prisma.user.count({ where: { createdAt: { gte: startDate } } });
    const activeUsers = await prisma.user.count({ where: { updatedAt: { gte: startDate } } });

    // Transactions
    const totalTransactions = await prisma.transaction.count({ where: { createdAt: { gte: startDate } } });
    const successTransactions = await prisma.transaction.count({ where: { status: "COMPLETED", createdAt: { gte: startDate } } });
    const failedTransactions = await prisma.transaction.count({ where: { status: "FAILED", createdAt: { gte: startDate } } });
    const pendingTransactions = await prisma.transaction.count({ where: { status: "PENDING", createdAt: { gte: startDate } } });

    // Top models (from UsageLog)
    const usageLogs = await prisma.usageLog.findMany({
      where: { createdAt: { gte: startDate } },
      select: { model: { select: { name: true } }, tokensIn: true, cost: true },
    });

    const modelStats: Record<string, { calls: number; revenue: number }> = {};
    usageLogs.forEach(log => {
      if (!modelStats[log.model.name]) modelStats[log.model.name] = { calls: 0, revenue: 0 };
      modelStats[log.model.name].calls++;
      modelStats[log.model.name].revenue += Number(log.cost || 0);
    });

    const topModels = Object.entries(modelStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Top users (from transactions)
    const userTransactions = await prisma.transaction.findMany({
      where: { status: "COMPLETED", createdAt: { gte: startDate } },
      select: { userId: true, amount: true },
    });

    const userStats: Record<string, { spend: number; calls: number }> = {};
    userTransactions.forEach(t => {
      if (!userStats[t.userId]) userStats[t.userId] = { spend: 0, calls: 0 };
      userStats[t.userId].spend += Number(t.amount);
      userStats[t.userId].calls++;
    });

    const topUsersRaw = Object.entries(userStats)
      .map(([userId, stats]) => ({ userId, ...stats }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 10);

    const topUsers = await Promise.all(
      topUsersRaw.map(async u => {
        const user = await prisma.user.findUnique({ where: { id: u.userId }, select: { name: true, email: true } });
        return { name: user?.name || "Unknown", email: user?.email || "", ...u };
      })
    );

    return NextResponse.json({
      revenue: { total: totalRevenue, change: revenueChange, daily: dailyRevenue },
      users: { total: totalUsers, new: newUsers, active: activeUsers },
      transactions: { total: totalTransactions, success: successTransactions, failed: failedTransactions, pending: pendingTransactions },
      topModels,
      topUsers,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
