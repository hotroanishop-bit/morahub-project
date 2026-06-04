import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { code } = await req.json();

    const coupon = await prisma.coupon.findFirst({
      where: {
        code: code.toUpperCase(),
        isActive: true,
        expiresAt: { gt: new Date() },
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon không hợp lệ hoặc đã hết hạn" }, { status: 400 });
    }

    if (coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: "Coupon đã hết lượt sử dụng" }, { status: 400 });
    }

    // Use amount field as credit amount
    const creditAmount = Number(coupon.amount) || Number(coupon.discount) * 10000;
    const currentBalance = Number(user.creditBalance);

    // Credit user
    await prisma.user.update({
      where: { id: user.id },
      data: { creditBalance: { increment: creditAmount } },
    });

    // Update coupon usage
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: { increment: 1 } },
    });

    // Log credit
    await prisma.creditLog.create({
      data: {
        userId: user.id,
        transactionId: `COUPON-${coupon.code}`,
        amount: creditAmount,
        balanceBefore: currentBalance,
        balanceAfter: currentBalance + creditAmount,
        action: "CREDIT",
        reason: `Coupon: ${coupon.code}`,
        actor: "SYSTEM",
      },
    });

    return NextResponse.json({ success: true, amount: creditAmount });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
