import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "count") {
      const count = await prisma.userNotification.count({
        where: { userId: user.id, isRead: false },
      });
      return NextResponse.json({ count });
    }

    const notifications = await prisma.userNotification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { notificationId } = await req.json();

    if (notificationId === "all") {
      await prisma.userNotification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });
    } else {
      await prisma.userNotification.updateMany({
        where: { id: notificationId, userId: user.id },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
