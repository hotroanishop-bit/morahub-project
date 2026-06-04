import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { checkRateLimit, logRequest, sanitizeString } from "@/lib/security-middleware";

// Rate limit: 3 registrations per hour per IP
const RATE_LIMIT = 3;
const WINDOW_MS = 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  // ========== RATE LIMITING ==========
  const rateLimit = checkRateLimit(`register:${ip}`, RATE_LIMIT, WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Quá nhiều tài khoản. Vui lòng thử lại sau." },
      { status: 429 }
    );
  }

  try {
    const { name, email, password, referralCode } = await req.json();

    // ========== INPUT VALIDATION ==========
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    if (!cleanEmail.includes("@") || cleanEmail.length > 255) {
      return NextResponse.json({ error: "Email không hợp lệ" }, { status: 400 });
    }

    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    if (password.length > 128) {
      return NextResponse.json({ error: "Password too long" }, { status: 400 });
    }

    // ========== CHECK DUPLICATE ==========
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      await logRequest(req, undefined, "register_duplicate", { email: cleanEmail });
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);

    // Find referrer if referral code provided
    let referredByCode = null;
    if (referralCode && typeof referralCode === "string") {
      const cleanReferral = sanitizeString(referralCode);
      const referrer = await prisma.user.findFirst({ where: { referralCode: cleanReferral } });
      if (referrer) referredByCode = cleanReferral;
    }

    // Get site settings for credits
    const settings = await prisma.siteSettings.findFirst();
    const signupCredit = settings?.signupCredit ?? 0;
    const referralReward = settings?.referralReward ?? 50000;
    const referralEnabled = settings?.referralEnabled ?? true;

    const user = await prisma.user.create({
      data: {
        name: name ? sanitizeString(String(name)) : null,
        email: cleanEmail,
        password: hashedPassword,
        creditBalance: signupCredit,
        referredBy: referredByCode,
      },
    });

    // Give reward to referrer (only if referral enabled)
    if (referredByCode && referralEnabled) {
      const referrer = await prisma.user.findFirst({ where: { referralCode: referredByCode } });
      if (referrer) {
        await prisma.user.update({ where: { id: referrer.id }, data: { creditBalance: { increment: referralReward } } });
        await prisma.transaction.create({
          data: {
            userId: referrer.id,
            amount: referralReward,
            status: "COMPLETED",
            paymentMethod: "REFERRAL",
            note: `Referral reward from ${cleanEmail}`,
          },
        });
      }
    }

    // Log successful registration
    await logRequest(req, user.id, "register_success", { email: cleanEmail });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
