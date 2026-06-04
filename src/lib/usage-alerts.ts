import { prisma } from "@/lib/prisma";
import { sendTelegramNotification } from "@/lib/notifications";

// Check and send usage alerts
export async function checkUsageAlerts() {
  try {
    // Get all active users with their plans
    const users = await prisma.user.findMany({
      where: { status: "ACTIVE" },
      include: { plan: true },
    });

    for (const user of users) {
      if (!user.telegramId) continue;
      if (!user.plan) continue;

      // Get current month usage
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const usage = await prisma.usageLog.aggregate({
        where: {
          userId: user.id,
          createdAt: { gte: startOfMonth },
        },
        _sum: { cost: true },
      });

      const totalSpent = Number(usage._sum.cost || 0);
      const balance = Number(user.creditBalance);
      const maxCredits = Number(user.plan.credits || 0);

      // Alert: Low balance (< 10% of plan credits)
      if (maxCredits > 0 && balance < maxCredits * 0.1 && balance > 0) {
        await sendTelegramNotification(
          user.telegramId,
          `⚠️ <b>Số dư sắp hết!</b>\n\nSố dư: ${balance.toLocaleString("vi-VN")}đ\nGói: ${user.plan.name}\n\nNạp thêm tại: https://morahub.online/dashboard/top-up`
        );
      }

      // Alert: Balance empty
      if (balance <= 0) {
        await sendTelegramNotification(
          user.telegramId,
          `🚫 <b>Số dư đã hết!</b>\n\nVui lòng nạp thêm credit để tiếp tục sử dụng.\nhttps://morahub.online/dashboard/top-up`
        );
      }
    }

    console.log("[USAGE ALERTS] Checked", users.length, "users");
  } catch (error) {
    console.error("[USAGE ALERTS] Error:", error);
  }
}
