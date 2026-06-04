import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";

// GET /api/bank/balance — get MB Bank balance (admin only)
// NOTE: Auto-bank feature coming soon
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      ok: false,
      error: "Tính năng auto-bank đang được phát triển. Hiện tại sử dụng nạp tiền thủ công qua Telegram bot.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Lỗi server" }, { status: 500 });
  }
}
