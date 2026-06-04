import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "all";
    const search = url.searchParams.get("search") || "";

    const where: any = {};
    if (status !== "all") where.status = status;
    if (search) {
      where.OR = [
        { reference: { contains: search } },
        { user: { email: { contains: search } } },
        { user: { name: { contains: search } } },
      ];
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { transactionId, action, userId, amount } = await req.json();

    if (action === "refund" && transactionId) {
      const tx = await prisma.transaction.findUnique({ where: { id: transactionId } });
      if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });

      // Update transaction status
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: "REFUNDED" },
      });

      // Deduct balance
      await prisma.user.update({
        where: { id: tx.userId },
        data: { creditBalance: { decrement: Number(tx.amount) } },
      });

      // Log
      await prisma.creditLog.create({
        data: {
          userId: tx.userId,
          transactionId: tx.id,
          amount: -Number(tx.amount),
          balanceBefore: 0,
          balanceAfter: 0,
          action: "DEBIT",
          reason: `Refund: ${tx.reference}`,
          actor: "ADMIN",
        },
      });

      return NextResponse.json({ success: true });
    }

    if (action === "credit" && userId && amount) {
      const targetUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

      await prisma.user.update({
        where: { id: userId },
        data: { creditBalance: { increment: amount } },
      });

      await prisma.creditLog.create({
        data: {
          userId,
          transactionId: "MANUAL-" + Date.now(),
          amount,
          balanceBefore: Number(targetUser.creditBalance),
          balanceAfter: Number(targetUser.creditBalance) + amount,
          action: "CREDIT",
          reason: "Manual credit by admin",
          actor: "ADMIN",
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
