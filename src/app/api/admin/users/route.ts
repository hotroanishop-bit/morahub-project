import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET all users (admin only)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        creditBalance: true,
        role: true,
        status: true,
        planId: true,
        createdAt: true,
        _count: { select: { apiKeys: true, usageLogs: true, transactions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH update user (admin only)
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, creditBalance, role, status, planId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const data: any = {};
    if (creditBalance !== undefined) data.creditBalance = creditBalance;
    if (role) data.role = role;
    if (status) data.status = status;
    if (planId !== undefined) {
      data.planId = planId || null;
      if (planId) {
        const plan = await prisma.plan.findUnique({ where: { id: planId } });
        if (plan) {
          data.planStartDate = new Date();
          data.planEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }
      } else {
        data.planStartDate = null;
        data.planEndDate = null;
      }
    }

    const user = await prisma.user.update({ where: { id: userId }, data });
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
