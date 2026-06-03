import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const key = await prisma.apiKey.findFirst({ where: { id, userId: user.id } });
    if (!key) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.apiKey.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.keyType && { keyType: body.keyType }),
        ...(body.expiresAt !== undefined && { expiresAt: body.expiresAt ? new Date(body.expiresAt) : null }),
        ...(body.allowedIPs !== undefined && { allowedIPs: body.allowedIPs ? JSON.stringify(body.allowedIPs) : null }),
        ...(body.allowedDomains !== undefined && { allowedDomains: body.allowedDomains ? JSON.stringify(body.allowedDomains) : null }),
        ...(body.rateLimit !== undefined && { rateLimit: body.rateLimit || null }),
        ...(body.projectId !== undefined && { projectId: body.projectId || null }),
      },
    });

    return NextResponse.json({ success: true, key: updated });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const key = await prisma.apiKey.findFirst({ where: { id, userId: user.id } });
    if (!key) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.apiKey.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
