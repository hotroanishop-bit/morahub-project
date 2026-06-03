import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subject, body, filter } = await req.json();

  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "subject and body required" }, { status: 400 });
  }

  // Get target users
  const where: any = { status: "ACTIVE" };
  if (filter === "no-plan") where.planId = null;
  if (filter === "with-plan") where.planId = { not: null };
  if (filter === "low-credit") where.creditBalance = { lt: 10000 };

  const users = await prisma.user.findMany({
    where,
    select: { id: true, email: true, name: true },
  });

  if (users.length === 0) {
    return NextResponse.json({ error: "No target users found" }, { status: 400 });
  }

  // Create notifications for all users
  const notifications = users.map(u => ({
    userId: u.id,
    title: subject.trim(),
    message: body.trim(),
    type: "info" as const,
    link: "/dashboard",
  }));

  await prisma.userNotification.createMany({ data: notifications });

  // Audit log
  logAudit({
    userId: (session.user as any).id,
    action: "MASS_EMAIL",
    entity: "User",
    details: { subject: subject.trim(), recipientCount: users.length, filter: filter || "all" },
  });

  // In production, send actual emails here
  // For now, we create in-app notifications

  return NextResponse.json({
    success: true,
    recipientCount: users.length,
    message: `Đã gửi thông báo đến ${users.length} người dùng`,
  });
}
