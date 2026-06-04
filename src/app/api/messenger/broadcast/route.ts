import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { broadcastMessenger, sendMessengerMessage } from "@/lib/messenger-bot";
import { prisma } from "@/lib/prisma";

// POST — Broadcast message to all Messenger users
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, targetUser } = await req.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Send to specific user
    if (targetUser) {
      const success = await sendMessengerMessage(targetUser, message);
      return NextResponse.json({ 
        success, 
        sent: success ? 1 : 0, 
        failed: success ? 0 : 1,
        total: 1 
      });
    }

    // Broadcast to all linked users
    const result = await broadcastMessenger(message);

    // Log broadcast
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "MESSENGER_BROADCAST",
        entity: "Messenger",
        details: `Broadcast to ${result.total} users: ${result.sent} sent, ${result.failed} failed`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Messenger broadcast error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// GET — Get Messenger stats
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const totalLinked = await prisma.user.count({
      where: { messengerId: { not: null }, messengerVerified: true },
    });

    const totalUsers = await prisma.user.count();

    return NextResponse.json({ totalLinked, totalUsers });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
