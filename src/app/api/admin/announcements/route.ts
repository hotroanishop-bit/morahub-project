import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const announcements = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ announcements });
  } catch (error) { return NextResponse.json({ error: "Lỗi server" }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { title, content, type } = await req.json();
    await prisma.announcement.create({ data: { title, content, type: type || "info" } });
    return NextResponse.json({ success: true });
  } catch (error) { return NextResponse.json({ error: "Lỗi server" }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await req.json();
    await prisma.announcement.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) { return NextResponse.json({ error: "Lỗi server" }, { status: 500 }); }
}
