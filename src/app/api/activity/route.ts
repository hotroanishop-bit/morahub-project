import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "all";
    const limit = parseInt(url.searchParams.get("limit") || "50");

    // Build where clause
    const where: any = { userId: user.id };
    if (type !== "all") {
      where.action = { contains: type };
    }

    // Get from RequestLog
    const logs = await prisma.requestLog.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        endpoint: true,
        method: true,
        statusCode: true,
        ip: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100),
    });

    // Get from CreditLog (deposits)
    const credits = await prisma.creditLog.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        amount: true,
        reason: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Merge and format
    const activities = [
      ...logs.map(l => ({
        id: l.id,
        type: l.endpoint.includes("login") ? "login" : l.endpoint.includes("deposit") || l.endpoint.includes("top-up") ? "deposit" : "api_call",
        action: `${l.method} ${l.endpoint}`,
        details: l.statusCode ? `Status: ${l.statusCode}` : "",
        ip: l.ip || "",
        createdAt: l.createdAt.toISOString(),
      })),
      ...credits.map(c => ({
        id: c.id,
        type: "deposit",
        action: c.amount > 0 ? "Nạp tiền" : "Trừ tiền",
        details: `${Number(c.amount) > 0 ? "+" : ""}${Number(c.amount).toLocaleString("vi-VN")}đ - ${c.reason || ""}`,
        ip: "",
        createdAt: c.createdAt.toISOString(),
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);

    return NextResponse.json({ activities });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
