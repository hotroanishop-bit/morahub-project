import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import crypto from "crypto";

function generateApiKey(): string {
  return "mh-" + crypto.randomBytes(32).toString("hex");
}

// GET all API keys (admin only)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const keys = await prisma.apiKey.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ keys });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST create API key (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, userId, rateLimit, expiresAt } = await req.json();
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

    // Admin creates for first user or specified userId
    const targetUserId = userId || (await prisma.user.findFirst({ where: { role: "ADMIN" } }))?.id;
    if (!targetUserId) return NextResponse.json({ error: "No user found" }, { status: 400 });

    const key = generateApiKey();
    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        key,
        userId: targetUserId,
        rateLimit: rateLimit || 30,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json({ key: { ...apiKey, key } });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH update API key (admin only)
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { keyId, isActive, rateLimit, expiresAt } = await req.json();
    if (!keyId) return NextResponse.json({ error: "keyId required" }, { status: 400 });

    const data: any = {};
    if (isActive !== undefined) data.isActive = isActive;
    if (rateLimit !== undefined) data.rateLimit = rateLimit;
    if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null;

    const key = await prisma.apiKey.update({ where: { id: keyId }, data });
    return NextResponse.json(key);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE API key (admin only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { keyId } = await req.json();
    if (!keyId) return NextResponse.json({ error: "keyId required" }, { status: 400 });

    await prisma.apiKey.delete({ where: { id: keyId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
