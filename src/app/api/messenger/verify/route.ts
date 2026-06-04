import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// POST — Generate verification code for Messenger linking
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    // Already verified
    if (user.messengerVerified && user.messengerId) {
      return NextResponse.json({ error: "Tài khoản đã liên kết Messenger" }, { status: 400 });
    }

    // Generate 6-char code
    const code = crypto.randomBytes(3).toString("hex").toUpperCase();

    // Store code on user (expires in 10 minutes)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        telegramVerifyCode: code, // Reuse the same field
        telegramVerifyExpiry: new Date(Date.now() + 10 * 60 * 1000),
      } as any,
    });

    return NextResponse.json({
      ok: true,
      code,
      message: `Gửi mã này cho bot Messenger: ${code}`,
      expiresIn: "10 phút",
    });
  } catch (err: any) {
    console.error("Generate Messenger verify code error:", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// GET — Get current Messenger status
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    return NextResponse.json({
      messengerId: (user as any).messengerId,
      messengerVerified: (user as any).messengerVerified,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
