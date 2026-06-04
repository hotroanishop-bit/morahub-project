import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { webhookId } = await req.json();

    const webhook = await prisma.webhook.findFirst({
      where: { id: webhookId, userId: user.id },
    });

    if (!webhook) return NextResponse.json({ error: "Webhook not found" }, { status: 404 });

    // Send test payload
    try {
      await fetch(webhook.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "test",
          timestamp: new Date().toISOString(),
          data: { message: "This is a test webhook from MoraHub" },
        }),
      });
    } catch (error) {
      console.error("Webhook test failed:", error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
