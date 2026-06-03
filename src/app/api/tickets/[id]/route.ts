import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyTicketReplied } from "@/lib/email";
import { dispatchWebhook } from "@/lib/webhook";

// GET - Get messages for a ticket
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const ticket = await prisma.ticket.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!ticket) {
    // Check if admin
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (user?.role !== "ADMIN") return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const messages = await prisma.ticketMessage.findMany({
    where: { ticketId: id },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true, email: true, role: true } } },
  });

  // Mark as read (update ticket status to REPLYING if user reads admin reply)
  if (ticket && ticket.status === "OPEN") {
    await prisma.ticket.update({ where: { id }, data: { status: "REPLYING" } });
  }

  return NextResponse.json({ messages, ticket });
}

// POST - Send a message
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { content } = await req.json();

  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const ticket = await prisma.ticket.findFirst({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check permission
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const isAdmin = user?.role === "ADMIN";
  const isOwner = ticket.userId === session.user.id;

  if (!isAdmin && !isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (ticket.status === "CLOSED") return NextResponse.json({ error: "Ticket closed" }, { status: 400 });

  // Create message
  const message = await prisma.ticketMessage.create({
    data: {
      ticketId: id,
      senderId: session.user.id,
      isAdmin,
      content: content.trim(),
    },
    include: { sender: { select: { id: true, name: true, email: true, role: true } } },
  });

  // Update ticket status
  await prisma.ticket.update({
    where: { id },
    data: { status: "REPLYING", updatedAt: new Date() },
  });

  // Notify the other party
  if (isAdmin) {
    // Admin replied → notify user
    notifyTicketReplied(ticket.userId, ticket.subject).catch(console.error);
    await prisma.userNotification.create({
      data: {
        userId: ticket.userId,
        title: "Phản hồi ticket",
        message: `Admin đã phản hồi "${ticket.subject}"`,
        type: "info",
        link: `/dashboard/tickets`,
      },
    });
  } else {
    // User replied → notify admin + webhook
    dispatchWebhook("ticket.replied", ticket.userId, {
      ticketId: id,
      subject: ticket.subject,
      message: content.trim(),
    }).catch(console.error);
  }

  return NextResponse.json({ message });
}
