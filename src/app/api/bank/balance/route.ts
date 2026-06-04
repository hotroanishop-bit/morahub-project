import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getBalance } from "@/lib/mb-bank";

// GET /api/bank/balance — get MB Bank balance (admin only)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const balance = await getBalance();
    if (!balance) {
      return NextResponse.json({ error: "Không lấy được số dư. Kiểm tra lại tài khoản MB Bank." }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      totalBalance: balance.totalBalance,
      currency: balance.currency,
      accounts: balance.accounts,
    });
  } catch (err: any) {
    console.error("Bank balance error:", err);
    return NextResponse.json({ error: err.message || "Lỗi kết nối MB Bank" }, { status: 500 });
  }
}
