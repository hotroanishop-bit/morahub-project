import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";

// GET /api/bank/balance — get MB Bank balance (admin only)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prisma } = await import("@/lib/prisma");
    const settings = await prisma.siteSettings.findFirst();
    if (!settings?.bankUsername || !settings?.bankPassword) {
      return NextResponse.json({ error: "Chưa cấu hình MB Bank" }, { status: 400 });
    }

    // Dynamic import to avoid sharp/wasm issues at build time
    // mbbank sets globalThis.location which crashes SSR - patch it first
    if (typeof globalThis.location === "undefined") {
      (globalThis as any).location = {};
    }
    const { MB } = await import("mbbank");
    const mb = new MB({
      username: settings.bankUsername,
      password: settings.bankPassword,
      preferredOCRMethod: "default",
      saveWasm: false,
    });

    await mb.login();
    const balance = await mb.getBalance();

    if (!balance) {
      return NextResponse.json({ error: "Không lấy được số dư" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      totalBalance: balance.totalBalance,
      currency: balance.currencyEquivalent,
      accounts: balance.balances?.map((a: any) => ({
        number: a.number,
        name: a.name,
        currency: a.currency,
        balance: a.balance,
      })),
    });
  } catch (err: any) {
    console.error("Bank balance error:", err);
    return NextResponse.json({ error: err.message || "Lỗi kết nối MB Bank" }, { status: 500 });
  }
}
