import { prisma } from "@/lib/prisma";
import { dispatchWebhook } from "@/lib/webhook";

/**
 * Check and disable expired API keys.
 * Called periodically or before API key validation.
 */
export async function disableExpiredKeys() {
  try {
    const expiredKeys = await prisma.apiKey.findMany({
      where: {
        isActive: true,
        expiresAt: { not: null, lt: new Date() },
      },
      include: { user: true },
    });

    if (expiredKeys.length === 0) return 0;

    const ids = expiredKeys.map(k => k.id);

    await prisma.apiKey.updateMany({
      where: { id: { in: ids } },
      data: { isActive: false },
    });

    // Dispatch webhooks for each expired key
    for (const key of expiredKeys) {
      await dispatchWebhook("key.expired", key.userId, {
        keyId: key.id,
        keyName: key.name,
      });

      // Also check if user credit is low
      if (Number(key.user.creditBalance) <= 0) {
        await dispatchWebhook("credit.depleted", key.userId, {
          balance: Number(key.user.creditBalance),
        });
      } else if (Number(key.user.creditBalance) < 10000) {
        await dispatchWebhook("credit.low", key.userId, {
          balance: Number(key.user.creditBalance),
        });
      }
    }

    console.log(`Auto-disabled ${expiredKeys.length} expired API keys`);
    return expiredKeys.length;
  } catch (err) {
    console.error("Error disabling expired keys:", err);
    return 0;
  }
}

/**
 * Check and dispatch low credit warnings
 */
export async function checkLowCredits() {
  try {
    const users = await prisma.user.findMany({
      where: {
        creditBalance: { lt: 10000, gt: 0 },
      },
    });

    for (const user of users) {
      await dispatchWebhook("credit.low", user.id, {
        balance: Number(user.creditBalance),
      });
    }
  } catch (err) {
    console.error("Error checking low credits:", err);
  }
}
