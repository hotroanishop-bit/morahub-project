import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET site settings (public for deposit page)
export async function GET() {
  try {
    let settings = await prisma.siteSettings.findFirst();
    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          bankName: "VietcomBank",
          bankBin: "970432",
          accountNo: "",
          accountName: "",
          minDeposit: 10000,
          depositNote: "MoraHub nap tien",
        },
      });
    }
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH update settings (admin only)
export async function PATCH(req: NextRequest) {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    let settings = await prisma.siteSettings.findFirst();

    if (!settings) {
      settings = await prisma.siteSettings.create({ data: body });
    } else {
      settings = await prisma.siteSettings.update({ where: { id: settings.id }, data: body });
    }

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
