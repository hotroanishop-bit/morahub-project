import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

function toCSV(headers: string[], rows: any[][]): string {
  const csvHeaders = headers.join(",");
  const csvRows = rows.map(row => row.map(cell => {
    const str = String(cell ?? "");
    return str.includes(",") || str.includes('"') || str.includes("\n") 
      ? `"${str.replace(/"/g, '""')}"` 
      : str;
  }).join(","));
  return [csvHeaders, ...csvRows].join("\n");
}

function csvResponse(csv: string, filename: string) {
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "transactions";
    const period = url.searchParams.get("period") || "30d";

    // Calculate date range
    let startDate = new Date();
    if (period === "7d") startDate.setDate(startDate.getDate() - 7);
    else if (period === "30d") startDate.setDate(startDate.getDate() - 30);
    else if (period === "90d") startDate.setDate(startDate.getDate() - 90);
    else startDate = new Date("2020-01-01");

    if (type === "transactions") {
      const txns = await prisma.transaction.findMany({
        where: { userId: user.id, createdAt: { gte: startDate } },
        orderBy: { createdAt: "desc" },
      });

      const headers = ["Mã", "Số tiền", "Nội dung", "Trạng thái", "Ngày tạo"];
      const rows = txns.map(t => [
        t.reference,
        Number(t.amount),
        t.note || "",
        t.status,
        t.createdAt.toLocaleString("vi-VN"),
      ]);

      return csvResponse(toCSV(headers, rows), `giao-dich-${period}.csv`);
    }

    if (type === "usage") {
      const logs = await prisma.usageLog.findMany({
        where: { userId: user.id, createdAt: { gte: startDate } },
        include: { model: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      });

      const headers = ["Model", "Tokens In", "Tokens Out", "Chi phí (đ)", "Trạng thái", "Thời gian"];
      const rows = logs.map(l => [
        l.model?.name || l.modelId,
        l.tokensIn,
        l.tokensOut,
        Number(l.cost),
        l.status,
        l.createdAt.toLocaleString("vi-VN"),
      ]);

      return csvResponse(toCSV(headers, rows), `su-dung-api-${period}.csv`);
    }

    if (type === "billing") {
      // Group by date
      const logs = await prisma.usageLog.findMany({
        where: { userId: user.id, createdAt: { gte: startDate } },
        select: { cost: true, createdAt: true },
      });

      const byDate: Record<string, number> = {};
      logs.forEach(l => {
        const date = l.createdAt.toISOString().split("T")[0];
        byDate[date] = (byDate[date] || 0) + Number(l.cost || 0);
      });

      const headers = ["Ngày", "Tổng chi phí (đ)"];
      const rows = Object.entries(byDate)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, cost]) => [date, Math.round(cost)]);

      return csvResponse(toCSV(headers, rows), `hoa-don-${period}.csv`);
    }

    if (type === "activity") {
      const logs = await prisma.requestLog.findMany({
        where: { userId: user.id, createdAt: { gte: startDate } },
        orderBy: { createdAt: "desc" },
        take: 1000,
      });

      const headers = ["Endpoint", "Method", "Status", "IP", "Thời gian"];
      const rows = logs.map(l => [
        l.endpoint,
        l.method,
        l.statusCode || "",
        l.ip || "",
        l.createdAt.toLocaleString("vi-VN"),
      ]);

      return csvResponse(toCSV(headers, rows), `hoat-dong-${period}.csv`);
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
