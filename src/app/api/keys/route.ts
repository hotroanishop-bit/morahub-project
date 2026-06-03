import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "mh-";
  for (let i = 0; i < 48; i++) key += chars.charAt(Math.floor(Math.random() * chars.length));
  return key;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const keys = await prisma.apiKey.findMany({
      where: { userId: user.id },
      include: { project: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ keys });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, keyType, expiresAt, allowedIPs, allowedDomains, rateLimit, projectId } = body;

    if (!name?.trim()) return NextResponse.json({ error: "Tên key không được để trống" }, { status: 400 });

    const keyCount = await prisma.apiKey.count({ where: { userId: user.id } });
    const maxKeys = (user as any).plan?.maxKeys || 3;
    if (keyCount >= maxKeys) {
      return NextResponse.json({ error: `Đã đạt giới hạn ${maxKeys} key. Nâng cấp gói.` }, { status: 400 });
    }

    const key = generateApiKey();
    const apiKey = await prisma.apiKey.create({
      data: {
        userId: user.id,
        name: name.trim(),
        key,
        keyType: keyType || "FULL",
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        allowedIPs: allowedIPs ? JSON.stringify(allowedIPs) : null,
        allowedDomains: allowedDomains ? JSON.stringify(allowedDomains) : null,
        rateLimit: rateLimit || null,
        projectId: projectId || null,
      },
    });

    return NextResponse.json({ success: true, key: { id: apiKey.id, key: apiKey.key, name: apiKey.name } });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
