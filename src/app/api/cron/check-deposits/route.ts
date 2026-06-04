import { NextRequest, NextResponse } from "next/server";
import { checkDeposits } from "@/lib/bank-checker";

// Cron endpoint - protected with secret token
export async function GET(req: NextRequest) {
  // Verify cron secret token
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Also check query param for curl-based cron
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (token !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    await checkDeposits();
    return NextResponse.json({ ok: true, time: new Date().toISOString() });
  } catch (err: any) {
    console.error("Cron check-deposits error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
