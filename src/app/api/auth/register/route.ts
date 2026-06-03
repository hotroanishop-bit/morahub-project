import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, referralCode } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);

    // Find referrer if referral code provided
    let referredByCode = null;
    if (referralCode) {
      const referrer = await prisma.user.findFirst({ where: { referralCode } });
      if (referrer) referredByCode = referralCode;
    }

    const user = await prisma.user.create({
      data: {
        name: name || null,
        email,
        password: hashedPassword,
        creditBalance: 10000,
        referredBy: referredByCode,
      },
    });

    // Give reward to referrer
    if (referredByCode) {
      const referrer = await prisma.user.findFirst({ where: { referralCode: referredByCode } });
      if (referrer) {
        await prisma.user.update({ where: { id: referrer.id }, data: { creditBalance: { increment: 10000 } } });
        await prisma.transaction.create({
          data: {
            userId: referrer.id,
            amount: 10000,
            status: "COMPLETED",
            paymentMethod: "REFERRAL",
            note: `Referral reward from ${email}`,
          },
        });
      }
    }

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
