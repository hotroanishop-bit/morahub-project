import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST - Add message to session
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { role, content, tokens } = await req.json();

  // Verify ownership
  const chatSession = await prisma.chatSession.findFirst({
    where: { id, userId: (session.user as any).id },
  });
  if (!chatSession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const message = await prisma.chatMessage.create({
    data: { sessionId: id, role, content, tokens },
  });

  // Update session timestamp
  await prisma.chatSession.update({
    where: { id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json(message);
}
