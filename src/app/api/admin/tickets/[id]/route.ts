import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { notifyTicketReplied } from "@/lib/email";

async function isAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

// GET - Get ticket with messages (admin)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await isAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true } } },
  });

  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const messages = await prisma.ticketMessage.findMany({
    where: { ticketId: id },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true, email: true, role: true } } },
  });

  return NextResponse.json({ ticket, messages });
}

// POST - Admin reply or update status
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await isAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Update status
  if (body.status) {
    await prisma.ticket.update({ where: { id }, data: { status: body.status } });
  }

  // Send reply as chat message
  if (body.adminReply?.trim()) {
    await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderId: user.id,
        isAdmin: true,
        content: body.adminReply.trim(),
      },
    });

    await prisma.ticket.update({
      where: { id },
      data: { status: "REPLYING", updatedAt: new Date() },
    });

    // Notify user
    notifyTicketReplied(ticket.userId, ticket.subject).catch(console.error);
    await prisma.userNotification.create({
      data: {
        userId: ticket.userId,
        title: "Phản hồi ticket",
        message: `Admin đã phản hồi "${ticket.subject}"`,
        type: "info",
        link: "/dashboard/tickets",
      },
    });
  }

  return NextResponse.json({ success: true });
}
