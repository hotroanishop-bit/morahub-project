import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { notifyTicketCreated } from "@/lib/email";
import { dispatchWebhook } from "@/lib/webhook";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tickets = await prisma.ticket.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { subject, message, category, priority } = body;

    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
    }

    // Create ticket with first message
    const ticket = await prisma.ticket.create({
      data: {
        userId: user.id,
        subject: subject.trim(),
        category: category || "general",
        priority: priority || "normal",
        messages: {
          create: {
            senderId: user.id,
            isAdmin: false,
            content: message.trim(),
          },
        },
      },
      include: { messages: true },
    });

    // Notify
    notifyTicketCreated(user.id, subject.trim()).catch(console.error);
    dispatchWebhook("ticket.created", user.id, {
      ticketId: ticket.id,
      subject: subject.trim(),
      message: message.trim(),
    }).catch(console.error);

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
