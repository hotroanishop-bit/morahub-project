import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "mh-";
  for (let i = 0; i < 48; i++) key += chars.charAt(Math.floor(Math.random() * chars.length));
  return key;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const key = await prisma.apiKey.findFirst({ where: { id, userId: user.id } });
    if (!key) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const newKey = generateApiKey();
    const updated = await prisma.apiKey.update({
      where: { id },
      data: { key: newKey, revokedAt: new Date() },
    });

    return NextResponse.json({ success: true, key: { id: updated.id, key: newKey } });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
