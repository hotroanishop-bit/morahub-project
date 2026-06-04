import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const period = url.searchParams.get("period") || "30d";
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

    // Users
    const totalUsers = await prisma.user.count();
    const newUsers = await prisma.user.count({ where: { createdAt: { gte: startDate } } });
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);
    const prevUsers = await prisma.user.count({ where: { createdAt: { gte: prevStartDate, lt: startDate } } });
    const churned = Math.max(0, prevUsers - newUsers);
    const retention = totalUsers > 0 ? ((totalUsers - churned) / totalUsers * 100) : 100;

    // API Stats
    const usageLogs = await prisma.usageLog.findMany({
      where: { createdAt: { gte: startDate } },
      select: { tokensIn: true, createdAt: true },
    });
    const totalCalls = usageLogs.length;
    const errorCalls = await prisma.usageLog.count({ where: { status: "error", createdAt: { gte: startDate } } });
    const errorRate = totalCalls > 0 ? (errorCalls / totalCalls * 100) : 0;

    // Simple predictions (linear trend)
    const recentDays = Math.min(7, days);
    const recentStart = new Date();
    recentStart.setDate(recentStart.getDate() - recentDays);
    const recentRevenue = transactions
      .filter(t => t.createdAt >= recentStart)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const avgDailyRevenue = recentRevenue / recentDays;
    const predictedRevenue = avgDailyRevenue * 30;

    const recentNewUsers = await prisma.user.count({ where: { createdAt: { gte: recentStart } } });
    const avgDailyUsers = recentNewUsers / recentDays;
    const predictedUsers = Math.round(avgDailyUsers * 30);

    return NextResponse.json({
      revenue: { total: totalRevenue, target: totalRevenue * 1.2, daily: dailyRevenue },
      users: { total: totalUsers, new: newUsers, churned, retention: Math.round(retention) },
      api: { totalCalls, avgLatency: 0, errorRate: Math.round(errorRate * 10) / 10 },
      predictions: { nextMonthRevenue: Math.round(predictedRevenue), nextMonthUsers: predictedUsers, confidence: 75 },
    });
  } catch (error) {
    console.error("BI error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
