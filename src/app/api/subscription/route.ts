import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { planId } = body;

    if (!planId) return NextResponse.json({ error: "Thiếu plan ID" }, { status: 400 });

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return NextResponse.json({ error: "Gói không tồn tại" }, { status: 404 });

    const price = Number(plan.price);
    const currentCredits = Number(user.creditBalance);

    if (price > 0 && currentCredits < price) {
      return NextResponse.json({
        error: `Không đủ credits. Cần ${price.toLocaleString("vi-VN")}đ, hiện có ${currentCredits.toLocaleString("vi-VN")}đ`,
      }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        planId: plan.id,
        creditBalance: currentCredits - price,
        planStartDate: new Date(),
        planEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: price,
        paymentMethod: "SYSTEM",
        status: "COMPLETED",
        note: `Upgrade lên gói ${plan.name}`,
        reference: `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      },
    });

    return NextResponse.json({ success: true, message: `Đã upgrade lên gói ${plan.name}!` });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { plan: true },
    });

    return NextResponse.json({
      currentPlan: fullUser?.plan,
      credits: Number(fullUser?.creditBalance || 0),
    });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
