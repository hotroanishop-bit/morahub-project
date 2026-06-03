import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - Public: active announcements
export async function GET() {
  const announcements = await prisma.announcement.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return NextResponse.json(announcements);
}

// POST - Admin: create announcement
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, content, type } = await req.json();
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "title and content required" }, { status: 400 });
  }

  const announcement = await prisma.announcement.create({
    data: { title: title.trim(), content: content.trim(), type: type || "info" },
  });

  return NextResponse.json(announcement);
}

// PATCH - Admin: toggle/update
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, isActive, title, content, type } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updated = await prisma.announcement.update({
    where: { id },
    data: {
      ...(isActive !== undefined && { isActive }),
      ...(title && { title }),
      ...(content && { content }),
      ...(type && { type }),
    },
  });

  return NextResponse.json(updated);
}

// DELETE - Admin
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.announcement.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
