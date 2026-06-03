import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export type WebhookEvent =
  | "usage.created"
  | "key.created"
  | "key.revoked"
  | "key.expired"
  | "credit.low"
  | "credit.depleted"
  | "ticket.created"
  | "ticket.replied"
  | "subscription.changed";

interface WebhookPayload {
  event: WebhookEvent;
  userId: string;
  data: Record<string, any>;
  timestamp: string;
}

export async function dispatchWebhook(event: WebhookEvent, userId: string, data: Record<string, any>) {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: {
        userId,
        isActive: true,
        events: { contains: event },
      },
    });

    if (webhooks.length === 0) return;

    const payload: WebhookPayload = {
      event,
      userId,
      data,
      timestamp: new Date().toISOString(),
    };

    const body = JSON.stringify(payload);

    await Promise.allSettled(
      webhooks.map(async (wh) => {
        try {
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "X-MoraHub-Event": event,
            "X-MoraHub-Timestamp": payload.timestamp,
          };

          if (wh.secret) {
            const signature = crypto
              .createHmac("sha256", wh.secret)
              .update(body)
              .digest("hex");
            headers["X-MoraHub-Signature"] = `sha256=${signature}`;
          }

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);

          await fetch(wh.url, {
            method: "POST",
            headers,
            body,
            signal: controller.signal,
          });

          clearTimeout(timeout);
        } catch (err) {
          console.error(`Webhook delivery failed for ${wh.url}:`, err);
        }
      })
    );
  } catch (err) {
    console.error("Webhook dispatch error:", err);
  }
}
