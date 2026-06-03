import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - List chat sessions for current user
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await prisma.chatSession.findMany({
    where: { userId: (session.user as any).id },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return NextResponse.json(sessions);
}

// POST - Create new chat session
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, model } = await req.json();
  const chatSession = await prisma.chatSession.create({
    data: { userId: (session.user as any).id, title: title || "New Chat", model },
  });

  return NextResponse.json(chatSession);
}
