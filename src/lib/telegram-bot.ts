/**
 * MoraHub Telegram Bot
 * 
 * Setup:
 * 1. Create bot via @BotFather on Telegram
 * 2. Add TELEGRAM_BOT_TOKEN to .env
 * 3. Add TELEGRAM_WEBHOOK_URL to .env (e.g. https://morahub.online/api/telegram/webhook)
 * 4. Call setWebhook() once to register the webhook
 * 
 * Commands:
 * /start - Welcome message
 * /balance - Check credit balance
 * /models - List available models
 * /keys - List API keys
 * /usage - Usage summary
 * /help - Help text
 */

import { prisma } from "@/lib/prisma";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function sendTelegramMessage(chatId: number, text: string, options?: { parse_mode?: string; reply_markup?: any }) {
  if (!BOT_TOKEN) return;
  try {
    await fetch(`${API_URL}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options?.parse_mode || "HTML",
        reply_markup: options?.reply_markup,
      }),
    });
  } catch (err) {
    console.error("Telegram send error:", err);
  }
}

export async function handleTelegramUpdate(update: any) {
  const message = update.message || update.callback_query?.message;
  if (!message) return;

  const chatId = message.chat.id;
  const text = message.text?.trim() || "";
  const userId = update.callback_query?.from?.id || message.from?.id;

  // Find user by telegram ID
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { telegramId: String(userId) },
        { email: `${userId}@telegram.user` },
      ],
    },
    include: { plan: true, apiKeys: true },
  });

  if (text === "/start") {
    await sendTelegramMessage(chatId,
      `👋 <b>Chào mừng đến MoraHub!</b>\n\n` +
      `Nền tảng API AI hàng đầu Việt Nam.\n\n` +
      `📋 <b>Commands:</b>\n` +
      `/verify - Liên kết tài khoản\n` +
      `/balance - Kiểm tra số dư\n` +
      `/models - Danh sách models\n` +
      `/keys - API Keys\n` +
      `/usage - Thống kê sử dụng\n` +
      `/help - Hướng dẫn\n\n` +
      `🌐 <a href="https://morahub.online">morahub.online</a>\n` +
      `💬 Hỗ trợ: <a href="https://t.me/MoraSupport_bot">@MoraSupport_bot</a>`,
      { parse_mode: "HTML" }
    );
    return;
  }

  if (text === "/balance") {
    if (!user) {
      await sendTelegramMessage(chatId, "❌ Chưa liên kết tài khoản. Đăng ký tại morahub.online");
      return;
    }
    const balance = Number(user.creditBalance).toLocaleString("vi-VN");
    const plan = user.plan?.name || "Free";
    await sendTelegramMessage(chatId,
      `💰 <b>Số dư tài khoản</b>\n\n` +
      `💎 Số dư: <b>${balance}đ</b>\n` +
      `📦 Plan: <b>${plan}</b>\n` +
      `🔑 API Keys: ${user.apiKeys.length}`,
      { parse_mode: "HTML" }
    );
    return;
  }

  if (text === "/models") {
    const models = await prisma.aiModel.findMany({
      where: { isActive: true },
      select: { displayName: true, provider: true, pricePer1kIn: true, pricePer1kOut: true },
      orderBy: { provider: "asc" },
    });

    let msg = `🤖 <b>Models có sẵn (${models.length})</b>\n\n`;
    const grouped = models.reduce((acc, m) => {
      (acc[m.provider] = acc[m.provider] || []).push(m);
      return acc;
    }, {} as Record<string, typeof models>);

    for (const [provider, providerModels] of Object.entries(grouped)) {
      msg += `<b>${provider.toUpperCase()}</b>\n`;
      for (const m of providerModels) {
        msg += `  • ${m.displayName} — ${Number(m.pricePer1kIn).toLocaleString()}đ/1K in\n`;
      }
      msg += "\n";
    }

    await sendTelegramMessage(chatId, msg, { parse_mode: "HTML" });
    return;
  }

  if (text === "/keys") {
    if (!user) {
      await sendTelegramMessage(chatId, "❌ Chưa liên kết tài khoản.");
      return;
    }
    const keys = await prisma.apiKey.findMany({
      where: { userId: user.id },
      select: { name: true, key: true, isActive: true, totalCalls: true },
      orderBy: { createdAt: "desc" },
    });

    if (keys.length === 0) {
      await sendTelegramMessage(chatId, "🔑 Chưa có API key nào.\nTạo tại: morahub/dashboard/keys");
      return;
    }

    let msg = `🔑 <b>API Keys (${keys.length})</b>\n\n`;
    for (const k of keys) {
      const status = k.isActive ? "✅" : "❌";
      msg += `${status} <b>${k.name}</b>\n   <code>${k.key.slice(0, 20)}...</code>\n   Calls: ${k.totalCalls}\n\n`;
    }

    await sendTelegramMessage(chatId, msg, { parse_mode: "HTML" });
    return;
  }

  if (text === "/usage") {
    if (!user) {
      await sendTelegramMessage(chatId, "❌ Chưa liên kết tài khoản.");
      return;
    }

    const now = new Date();
    const last24h = new Date(now.getTime() - 86400000);
    const last7d = new Date(now.getTime() - 7 * 86400000);

    const [dayUsage, weekUsage] = await Promise.all([
      prisma.usageLog.aggregate({
        where: { userId: user.id, createdAt: { gte: last24h } },
        _count: true, _sum: { tokensIn: true, tokensOut: true, cost: true },
      }),
      prisma.usageLog.aggregate({
        where: { userId: user.id, createdAt: { gte: last7d } },
        _count: true, _sum: { tokensIn: true, tokensOut: true, cost: true },
      }),
    ]);

    await sendTelegramMessage(chatId,
      `📊 <b>Thống kê sử dụng</b>\n\n` +
      `📅 <b>24h:</b> ${dayUsage._count} calls, ${Number(dayUsage._sum.cost || 0).toLocaleString("vi-VN")}đ\n` +
      `📅 <b>7 ngày:</b> ${weekUsage._count} calls, ${Number(weekUsage._sum.cost || 0).toLocaleString("vi-VN")}đ`,
      { parse_mode: "HTML" }
    );
    return;
  }

  // /verify CODE — link Telegram to MoraHub account
  if (text.startsWith("/verify")) {
    const code = text.replace("/verify", "").trim();
    if (!code) {
      await sendTelegramMessage(chatId,
        `🔗 <b>Liên kết tài khoản</b>\n\n` +
        `Cách liên kết:\n` +
        `1. Vào morahub.online/dashboard/settings\n` +
        `2. Nhấn \"Liên kết Telegram\" để lấy mã\n` +
        `3. Gõ: <code>/verify MÃ</code>\n\n` +
        `Ví dụ: <code>/verify A1B2C3</code>`
      );
      return;
    }

    // Find website user with this verify code
    const websiteUser = await prisma.user.findFirst({
      where: {
        telegramVerifyCode: code,
        telegramVerifyExpiry: { gte: new Date() },
      },
    });

    if (!websiteUser) {
      await sendTelegramMessage(chatId,
        `❌ Mã không hợp lệ hoặc đã hết hạn.\nVui lòng lấy mã mới tại morahub.online/dashboard/settings`
      );
      return;
    }

    // Check if telegram is already linked to another account
    const existingLink = await prisma.user.findFirst({
      where: {
        telegramId: String(userId),
        id: { not: websiteUser.id },
      },
    });

    if (existingLink) {
      await sendTelegramMessage(chatId,
        `❌ Telegram này đã được liên kết với tài khoản khác.\nHủy liên kết trước tại morahub.online/dashboard/settings`
      );
      return;
    }

    // Link!
    const settings = await prisma.siteSettings.findFirst();
    const CREDIT_REWARD = settings?.telegramVerifyCredit ?? 50000;
    await prisma.user.update({
      where: { id: websiteUser.id },
      data: {
        telegramId: String(userId),
        telegramVerified: true,
        telegramVerifyCode: null,
        telegramVerifyExpiry: null,
        creditBalance: { increment: CREDIT_REWARD },
      },
    });

    // Record transaction
    await prisma.transaction.create({
      data: {
        userId: websiteUser.id,
        amount: CREDIT_REWARD,
        paymentMethod: "SYSTEM",
        status: "COMPLETED",
        note: "🎁 Phần thưởng xác minh Telegram",
      },
    });

    const balance = Number(websiteUser.creditBalance) + CREDIT_REWARD;
    await sendTelegramMessage(chatId,
      `✅ <b>Liên kết thành công!</b>\n\n` +
      `👤 Tài khoản: <b>${websiteUser.email}</b>\n` +
      `💎 Thưởng: <b>+${CREDIT_REWARD.toLocaleString("vi-VN")}đ</b>\n` +
      `💰 Số dư: <b>${balance.toLocaleString("vi-VN")}đ</b>\n\n` +
      `Bây giờ bạn có thể dùng /balance, /models, /keys...`
    );
    return;
  }

  if (text === "/help") {
    await sendTelegramMessage(chatId,
      `📖 <b>Hướng dẫn sử dụng MoraHub Bot</b>\n\n` +
      `Bot này giúp bạn quản lý tài khoản MoraHub ngay trên Telegram.\n\n` +
      `<b>Commands:</b>\n` +
      `/start - Bắt đầu\n` +
      `/verify - Liên kết tài khoản\n` +
      `/balance - Kiểm tra số dư\n` +
      `/models - Danh sách AI models\n` +
      `/keys - Quản lý API keys\n` +
      `/usage - Thống kê sử dụng\n` +
      `/help - Hướng dẫn\n\n` +
      `🌐 Website: <a href="https://morahub.online">morahub.online</a>\n` +
      `📧 Support: support@morahub.online\n` +
      `💬 Telegram: <a href="https://t.me/MoraSupport_bot">@MoraSupport_bot</a>`,
      { parse_mode: "HTML" }
    );
    return;
  }

  // Default: unknown command
  await sendTelegramMessage(chatId,
    `🤔 Không hiểu lệnh "${text}".\nGõ /help để xem danh sách commands.`
  );
}

/**
 * Set webhook URL (call once)
 */
export async function setWebhook(webhookUrl: string) {
  if (!BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN not set");
  const res = await fetch(`${API_URL}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: webhookUrl }),
  });
  return res.json();
}
