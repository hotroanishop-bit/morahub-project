import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// GET all transactions (admin only)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transactions = await prisma.transaction.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH update transaction status (admin only)
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transactionId, status, adminNote } = await req.json();
    if (!transactionId) return NextResponse.json({ error: "transactionId required" }, { status: 400 });

    const tx = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!tx) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

    // If completing a pending top-up, add credits to user
    if (status === "COMPLETED" && tx.status === "PENDING") {
      await prisma.user.update({
        where: { id: tx.userId },
        data: { creditBalance: { increment: tx.amount } },
      });
    }

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: { status, adminNote: adminNote || undefined },
    });

    // Audit log
    logAudit({
      userId: (session.user as any).id,
      action: status === "COMPLETED" ? "APPROVE_DEPOSIT" : "REJECT_DEPOSIT",
      entity: "Transaction",
      entityId: transactionId,
      details: { amount: tx.amount, userId: tx.userId, status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
