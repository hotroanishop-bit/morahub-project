import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "30d";
  const exportCsv = searchParams.get("export") === "csv";

  const now = new Date();
  let fromDate: Date;
  if (period === "7d") fromDate = new Date(now.getTime() - 7 * 86400000);
  else if (period === "90d") fromDate = new Date(now.getTime() - 90 * 86400000);
  else if (period === "12m") fromDate = new Date(now.getTime() - 365 * 86400000);
  else fromDate = new Date(now.getTime() - 30 * 86400000);

  // Revenue by day
  const txs = await prisma.transaction.findMany({
    where: { status: "COMPLETED", createdAt: { gte: fromDate } },
    select: { amount: true, createdAt: true, paymentMethod: true },
    orderBy: { createdAt: "asc" },
  });

  // Top models by revenue
  const modelUsage = await prisma.usageLog.groupBy({
    by: ["modelId"],
    where: { createdAt: { gte: fromDate } },
    _sum: { cost: true },
    _count: true,
    orderBy: { _sum: { cost: "desc" } },
    take: 10,
  });

  const modelIds = modelUsage.map(m => m.modelId);
  const models = await prisma.aiModel.findMany({
    where: { id: { in: modelIds } },
    select: { id: true, name: true, displayName: true, provider: true },
  });
  const modelMap = Object.fromEntries(models.map(m => [m.id, m]));

  // Top users by spend
  const topUsers = await prisma.usageLog.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: fromDate } },
    _sum: { cost: true },
    _count: true,
    orderBy: { _sum: { cost: "desc" } },
    take: 10,
  });

  const userIds = topUsers.map(u => u.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  // Aggregate
  const totalRevenue = txs.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalApiCost = modelUsage.reduce((sum, m) => sum + Number(m._sum.cost || 0), 0);
  const profit = totalRevenue - totalApiCost;

  // By day
  const dayMap = new Map<string, number>();
  for (const tx of txs) {
    const day = tx.createdAt.toISOString().split("T")[0];
    dayMap.set(day, (dayMap.get(day) || 0) + Number(tx.amount));
  }

  // Fill missing days
  const byDay: { date: string; revenue: number }[] = [];
  const days = Math.ceil((now.getTime() - fromDate.getTime()) / 86400000);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const key = d.toISOString().split("T")[0];
    byDay.push({ date: key, revenue: dayMap.get(key) || 0 });
  }

  // By payment method
  const byMethod = txs.reduce((acc, t) => {
    acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + Number(t.amount);
    return acc;
  }, {} as Record<string, number>);

  const result = {
    summary: { totalRevenue, totalApiCost, profit, totalTransactions: txs.length },
    byDay,
    byMethod,
    topModels: modelUsage.map(m => ({
      ...modelMap[m.modelId],
      revenue: Number(m._sum.cost || 0),
      calls: m._count,
    })),
    topUsers: topUsers.map(u => ({
      ...userMap[u.userId],
      spend: Number(u._sum.cost || 0),
      calls: u._count,
    })),
  };

  // CSV export
  if (exportCsv) {
    const csvRows = ["Date,Revenue"];
    for (const d of byDay) csvRows.push(`${d.date},${d.revenue}`);
    csvRows.push("");
    csvRows.push("Model,Calls,Revenue");
    for (const m of result.topModels) csvRows.push(`${m.displayName || m.name},${m.calls},${m.revenue}`);
    csvRows.push("");
    csvRows.push("User,Email,Calls,Spend");
    for (const u of result.topUsers) csvRows.push(`${u.name || ""},${u.email},${u.calls},${u.spend}`);

    return new NextResponse(csvRows.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="morahub-revenue-${period}.csv"`,
      },
    });
  }

  return NextResponse.json(result);
}
