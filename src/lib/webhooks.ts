import { prisma } from "@/lib/prisma";

export async function triggerWebhooks(userId: string, event: string, data: any) {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: { userId, isActive: true, events: { contains: event } },
    });

    for (const webhook of webhooks) {
      try {
        await fetch(webhook.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event,
            timestamp: new Date().toISOString(),
            data,
          }),
        });

        // Update last triggered
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: {  },
        });
      } catch (error) {
        console.error(`Webhook ${webhook.id} failed:`, error);
      }
    }
  } catch (error) {
    console.error("Trigger webhooks error:", error);
  }
}
