import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Generate referral code if not exists
    let referralCode = user.referralCode;
    if (!referralCode) {
      referralCode = `MH${user.id.slice(-6).toUpperCase()}`;
      await prisma.user.update({ where: { id: user.id }, data: { referralCode } });
    }

    // Count referrals
    const totalReferrals = await prisma.user.count({ where: { referredBy: referralCode } });

    // Count rewards from transactions
    const rewards = await prisma.transaction.aggregate({
      where: { userId: user.id, paymentMethod: "REFERRAL", status: "COMPLETED" },
      _sum: { amount: true },
    });
    const totalEarned = Number(rewards._sum.amount || 0);

    return NextResponse.json({
      referralCode,
      totalReferrals,
      totalEarned,
      pendingReward: 0,
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
