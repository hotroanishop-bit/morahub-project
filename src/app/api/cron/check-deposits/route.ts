import { NextResponse } from "next/server";
import { checkDeposits } from "@/lib/bank-checker";

// Cron endpoint - call every 30 seconds via crontab
export async function GET() {
  try {
    await checkDeposits();
    return NextResponse.json({ ok: true, time: new Date().toISOString() });
  } catch (err: any) {
    console.error("Cron check-deposits error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
