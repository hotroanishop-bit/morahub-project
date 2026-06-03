import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const TELEGRAM_CREDIT_REWARD = 50000; // 50K credit reward

// POST /api/telegram/verify — generate verification code
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    // Already verified
    if (user.telegramVerified && user.telegramId) {
      return NextResponse.json({ error: "Tài khoản đã liên kết Telegram" }, { status: 400 });
    }

    // Generate 6-char code
    const code = crypto.randomBytes(3).toString("hex").toUpperCase();

    // Store code on user (expires in 10 minutes)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        telegramVerifyCode: code,
        telegramVerifyExpiry: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    return NextResponse.json({
      ok: true,
      code,
      message: `Gửi mã này cho bot trên Telegram: ${code}`,
      expiresIn: "10 phút",
    });
  } catch (err: any) {
    console.error("Generate verify code error:", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// GET /api/telegram/verify — get current telegram status
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    return NextResponse.json({
      telegramId: user.telegramId,
      telegramVerified: user.telegramVerified,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// DELETE /api/telegram/verify — unlink telegram
export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        telegramId: null,
        telegramVerified: false,
        telegramVerifyCode: null,
        telegramVerifyExpiry: null,
      },
    });

    return NextResponse.json({ ok: true, message: "Đã hủy liên kết Telegram" });
  } catch (err: any) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
