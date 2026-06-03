import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ coupons });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { code, discount, maxUses, expiresAt, amount } = body;
    if (!code || !discount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const existing = await prisma.coupon.findFirst({ where: { code: code.toUpperCase() } });
    if (existing) {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 });
    }
    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discount: parseInt(discount),
        maxUses: parseInt(maxUses) || 100,
        amount: parseFloat(amount) || 0,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
      },
    });
    return NextResponse.json(coupon);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { couponId } = await req.json();
    await prisma.coupon.delete({ where: { id: couponId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
