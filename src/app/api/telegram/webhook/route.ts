import { NextRequest, NextResponse } from "next/server";
import { handleTelegramUpdate, setWebhook } from "@/lib/telegram-bot";

// Telegram webhook endpoint
export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    await handleTelegramUpdate(update);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Telegram webhook error:", err);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}

// GET - Setup webhook (call once)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const webhookUrl = searchParams.get("url");

  if (action === "set-webhook") {
    if (!webhookUrl) return NextResponse.json({ error: "url required" }, { status: 400 });
    const result = await setWebhook(webhookUrl);
    return NextResponse.json(result);
  }

  return NextResponse.json({
    status: "ok",
    message: "Telegram webhook endpoint. POST updates here.",
    setup: "GET ?action=set-webhook&url=https://morahub.online/api/telegram/webhook",
  });
}
