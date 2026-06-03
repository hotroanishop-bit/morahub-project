import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { amount, bankId, note } = body;

    if (!amount || amount < 10000) {
      return NextResponse.json({ error: "Số tiền tối thiểu 10,000đ" }, { status: 400 });
    }

    // Short reference: MORA + 6 digits
    const ref = `MORA${Date.now().toString().slice(-6)}`;

    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        amount,
        paymentMethod: bankId || "BANKING",
        status: "PENDING",
        note: note || `Nạp ${amount.toLocaleString("vi-VN")}đ`,
        reference: ref,
      },
    });

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        amount: Number(transaction.amount),
        status: transaction.status,
        reference: transaction.reference,
        note: transaction.note,
        paymentMethod: transaction.paymentMethod,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error) {
    console.error("Deposit error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      transactions: transactions.map((t) => ({ ...t, amount: Number(t.amount) })),
    });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
