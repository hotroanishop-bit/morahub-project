import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { transactionId } = await req.json();
    if (!transactionId) return NextResponse.json({ error: "Missing transactionId" }, { status: 400 });

    const tx = await prisma.transaction.findFirst({
      where: { id: transactionId, userId: user.id, status: "PENDING" },
    });

    if (!tx) return NextResponse.json({ error: "Giao dịch không tồn tại hoặc đã xử lý" }, { status: 404 });

    await prisma.transaction.update({
      where: { id: tx.id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel transaction error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
