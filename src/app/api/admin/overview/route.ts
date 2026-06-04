import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [
      totalUsers,
      totalRevenue,
      totalTransactions,
      openTickets,
      activeApiKeys,
      totalApiCalls,
      pendingTransactions,
      lowBalanceUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.transaction.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
      prisma.transaction.count(),
      prisma.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      prisma.apiKey.count({ where: { isActive: true } }),
      prisma.usageLog.count(),
      prisma.transaction.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { creditBalance: { lt: 10000 }, status: "ACTIVE" } }),
    ]);

    const alerts = [];
    if (pendingTransactions > 5) alerts.push({ type: "warning", message: `${pendingTransactions} giao dịch đang chờ xử lý` });
    if (lowBalanceUsers > 0) alerts.push({ type: "info", message: `${lowBalanceUsers} user có số dư < 10K` });
    if (openTickets > 10) alerts.push({ type: "warning", message: `${openTickets} ticket chưa xử lý` });

    return NextResponse.json({
      stats: {
        totalUsers,
        totalRevenue: Number(totalRevenue._sum.amount || 0),
        totalTransactions,
        openTickets,
        activeApiKeys,
        totalApiCalls,
      },
      alerts,
    });
  } catch (error) {
    console.error("Admin overview error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
