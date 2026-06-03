import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/password";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập email và mật khẩu" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email as string },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { success: false, error: "Email hoặc mật khẩu không đúng" },
        { status: 401 }
      );
    }

    const isValid = await comparePassword(password as string, user.password);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Email hoặc mật khẩu không đúng" },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[LOGIN] Error:", err);
    return NextResponse.json(
      { success: false, error: "Có lỗi xảy ra, vui lòng thử lại" },
      { status: 500 }
    );
  }
}
