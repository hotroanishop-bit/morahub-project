import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - Get session with messages
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const chatSession = await prisma.chatSession.findFirst({
    where: { id, userId: (session.user as any).id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!chatSession) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(chatSession);
}

// DELETE - Delete session
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.chatSession.deleteMany({
    where: { id, userId: (session.user as any).id },
  });

  return NextResponse.json({ success: true });
}
