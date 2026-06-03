import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: {
        id: true, name: true, email: true, image: true, role: true, phone: true,
        creditBalance: true, planId: true, createdAt: true, referralCode: true,
        twoFactorEnabled: true,
        plan: { select: { name: true, displayName: true, credits: true } },
        _count: { select: { apiKeys: true, projects: true } },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, image, phone } = body;

    const updated = await prisma.user.update({
      where: { id: (session.user as any).id },
      data: {
        ...(name && { name }),
        ...(image && { image }),
        ...(phone !== undefined && { phone }),
      },
      select: { id: true, name: true, email: true, image: true, phone: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
