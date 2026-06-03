import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { amount, paymentMethod } = await req.json();

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  if (!["MOMO", "ZALOPAY", "BANKING"].includes(paymentMethod)) {
    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
  }

  // Create pending transaction
  const transaction = await prisma.transaction.create({
    data: {
      userId: session.user.id,
      amount,
      paymentMethod,
      status: "PENDING",
      reference: `TOPUP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    },
  });

  // In production, this would redirect to payment gateway
  // For MVP, we auto-complete after a short delay simulation
  return NextResponse.json({
    transaction,
    message: "Payment initiated. In production, you would be redirected to the payment gateway.",
    paymentUrl: `/dashboard/top-up/confirm?id=${transaction.id}`,
  });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(transactions);
}
