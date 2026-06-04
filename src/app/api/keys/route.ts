import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import crypto from "crypto";

function generateApiKey(): string {
  return "mora_" + crypto.randomBytes(32).toString("hex");
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const keys = await prisma.apiKey.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        key: true,
        expiresAt: true,
        lastUsedAt: true,
        totalCalls: true,
        createdAt: true,
        isActive: true,
      },
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

    const { name, expiresInDays } = await req.json();
    const key = generateApiKey();
    
    let expiresAt = null;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    await prisma.apiKey.create({
      data: {
        userId: user.id,
        name: name || "API Key",
        key,
        expiresAt,
      },
    });

    return NextResponse.json({ key, name, expiresAt });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { keyId } = await req.json();
    const newKey = generateApiKey();

    await prisma.apiKey.update({
      where: { id: keyId, userId: user.id },
      data: { key: newKey, totalCalls: 0, totalTokens: 0 },
    });

    return NextResponse.json({ key: newKey });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { keyId } = await req.json();

    await prisma.apiKey.delete({
      where: { id: keyId, userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
