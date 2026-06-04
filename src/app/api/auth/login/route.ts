import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/password";
import { checkRateLimit, logRequest, blockIP } from "@/lib/security-middleware";

// Rate limit: 5 attempts per 15 minutes per IP
const RATE_LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  // ========== RATE LIMITING ==========
  const rateLimit = checkRateLimit(`login:${ip}`, RATE_LIMIT, WINDOW_MS);
  if (!rateLimit.allowed) {
    blockIP(ip, "Too many login attempts");
    return NextResponse.json(
      { success: false, error: "Quá nhiều lần thử. Vui lòng thử lại sau 15 phút." },
      { status: 429 }
    );
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập email và mật khẩu" },
        { status: 400 }
      );
    }

    // ========== INPUT VALIDATION ==========
    const cleanEmail = String(email).toLowerCase().trim();
    if (!cleanEmail.includes("@") || cleanEmail.length > 255) {
      return NextResponse.json(
        { success: false, error: "Email không hợp lệ" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user || !user.password) {
      // Log failed attempt
      await logRequest(req, undefined, "login_failed", { email: cleanEmail, reason: "user_not_found" });
      return NextResponse.json(
        { success: false, error: "Email hoặc mật khẩu không đúng" },
        { status: 401 }
      );
    }

    const isValid = await comparePassword(password as string, user.password);

    if (!isValid) {
      // Log failed attempt
      await logRequest(req, user.id, "login_failed", { reason: "wrong_password" });
      return NextResponse.json(
        { success: false, error: "Email hoặc mật khẩu không đúng" },
        { status: 401 }
      );
    }

    // Log successful login
    await logRequest(req, user.id, "login_success", { email: cleanEmail });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[LOGIN] Error:", err);
    return NextResponse.json(
      { success: false, error: "Có lỗi xảy ra, vui lòng thử lại" },
      { status: 500 }
    );
  }
}
