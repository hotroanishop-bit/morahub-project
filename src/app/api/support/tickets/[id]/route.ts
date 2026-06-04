import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { messages: true, user: true },
    });

    if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ticket });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { status, resolution, assignedTo } = await req.json();

    const updateData: Record<string, any> = {};
    if (status) updateData.status = status;
    if (resolution) updateData.resolution = resolution;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (status === "COMPLETED" || status === "CLOSED" || status === "FAILED") {
      updateData.resolvedAt = new Date();
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ ticket });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
