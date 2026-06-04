/**
 * MoraHub Telegram Bot v2
 * 
 * Features:
 * - Menu keyboard with buttons
 * - After verify: no /verify in menu
 * - Support tickets (creates ticket + notifies admin)
 * - Deposit support (coming soon)
 * - Admin notifications for new tickets
 */

import { prisma } from "@/lib/prisma";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
const SITE_URL = process.env.NEXTAUTH_URL || "https://morahub.online";

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

// Get main menu keyboard based on verification status
function getMenuKeyboard(isVerified: boolean) {
  const rows: any[][] = [
    [{ text: "💰 Số dư" }, { text: "📊 Models" }],
    [{ text: "🔑 API Keys" }, { text: "📈 Thống kê" }],
  ];

  if (isVerified) {
    rows.push([{ text: "🎫 Hỗ trợ" }, { text: "💵 Nạp tiền" }]);
  } else {
    rows.push([{ text: "🔗 Xác minh Telegram" }]);
  }

  rows.push([{ text: "📖 Hướng dẫn" }]);

  return {
    keyboard: rows,
    resize_keyboard: true,
    one_time_keyboard: false,
  };
}

// Get compact menu (after actions)
function getCompactMenu(isVerified: boolean) {
  return getMenuKeyboard(isVerified);
}

// Notify admin about new ticket
async function notifyAdminNewTicket(ticketId: string, subject: string, userEmail: string, message: string) {
  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!adminUser?.telegramId) return;

  await sendTelegramMessage(
    parseInt(adminUser.telegramId),
    `🔔 <b>Ticket mới!</b>\n\n` +
    `🆔 #${ticketId.slice(-6).toUpperCase()}\n` +
    `👤 User: <b>${userEmail}</b>\n` +
    `📝 Chủ đề: <b>${subject}</b>\n` +
    `💬 Nội dung: ${message.slice(0, 200)}${message.length > 200 ? "..." : ""}\n\n` +
    `🔗 <a href="${SITE_URL}/admin/tickets">Xem trên admin</a>`,
    { parse_mode: "HTML" }
  );
}

export async function handleTelegramUpdate(update: any) {
  const message = update.message || update.callback_query?.message;
  if (!message) return;

  const chatId = message.chat.id;
  const text = message.text?.trim() || "";
  const userId = update.callback_query?.from?.id || message.from?.id;
  const firstName = message.from?.first_name || "";

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

  const isVerified = !!user?.telegramVerified;

  // ========== /start ==========
  if (text === "/start" || text === "🏠 Menu chính") {
    if (!user) {
      await sendTelegramMessage(chatId,
        `👋 <b>Chào ${firstName}!</b>\n\n` +
        `Chào mừng đến <b>MoraHub</b> — Nền tảng API AI hàng đầu!\n\n` +
        `🔗 Liên kết tài khoản để bắt đầu:\n` +
        `1. Vào <a href="${SITE_URL}/dashboard/settings">morahub.online/settings</a>\n` +
        `2. Nhấn "Lấy mã xác minh"\n` +
        `3. Gõ: <code>/verify MÃ</code>\n\n` +
        `💡 Hoặc nhấn nút 🔗 bên dưới`,
        { parse_mode: "HTML", reply_markup: { keyboard: [[{ text: "🔗 Xác minh Telegram" }]], resize_keyboard: true } }
      );
      return;
    }

    await sendTelegramMessage(chatId,
      `👋 <b>Chào ${user.name || firstName}!</b>\n\n` +
      `💰 Số dư: <b>${Number(user.creditBalance).toLocaleString("vi-VN")}đ</b>\n` +
      `📦 Plan: <b>${user.plan?.name || "Free"}</b>\n` +
      `🔑 Keys: ${user.apiKeys.length}\n\n` +
      `Chọn lệnh bên dưới 👇`,
      { parse_mode: "HTML", reply_markup: getMenuKeyboard(isVerified) }
    );
    return;
  }

  // ========== Verify button / /verify ==========
  if (text === "🔗 Xác minh Telegram" || text.startsWith("/verify")) {
    if (isVerified) {
      await sendTelegramMessage(chatId,
        `✅ Bạn đã liên kết Telegram rồi!\n\n` +
        `👤 ${user!.email}\n` +
        `🆔 ID: ${user!.telegramId}`,
        { reply_markup: getCompactMenu(isVerified) }
      );
      return;
    }

    const code = text.startsWith("/verify") ? text.replace("/verify", "").trim() : "";
    if (!code) {
      await sendTelegramMessage(chatId,
        `🔗 <b>Liên kết tài khoản</b>\n\n` +
        `Cách liên kết:\n` +
        `1. Vào <a href="${SITE_URL}/dashboard/settings">morahub.online/settings</a>\n` +
        `2. Nhấn "Lấy mã xác minh"\n` +
        `3. Gõ lệnh: <code>/verify MÃ</code>\n\n` +
        `💡 Hoặc nhấn nút 🔗 trên bàn phím`,
        { parse_mode: "HTML" }
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
        `❌ Mã không hợp lệ hoặc đã hết hạn.\nVui lòng lấy mã mới tại morahub.online/settings`,
        { reply_markup: getCompactMenu(false) }
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
        `❌ Telegram này đã được liên kết với tài khoản khác.\nHủy liên kết trước tại morahub.online/settings`,
        { reply_markup: getCompactMenu(false) }
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
      `Chọn lệnh bên dưới 👇`,
      { parse_mode: "HTML", reply_markup: getMenuKeyboard(true) }
    );
    return;
  }

  // ========== Balance ==========
  if (text === "💰 Số dư" || text === "/balance") {
    if (!user) {
      await sendTelegramMessage(chatId, "❌ Chưa liên kết tài khoản.\nNhấn 🔗 trên bàn phím để liên kết.",
        { reply_markup: getMenuKeyboard(false) });
      return;
    }
    const balance = Number(user.creditBalance).toLocaleString("vi-VN");
    const plan = user.plan?.name || "Free";
    await sendTelegramMessage(chatId,
      `💰 <b>Số dư tài khoản</b>\n\n` +
      `💎 Số dư: <b>${balance}đ</b>\n` +
      `📦 Plan: <b>${plan}</b>\n` +
      `🔑 API Keys: ${user.apiKeys.length}`,
      { parse_mode: "HTML", reply_markup: getCompactMenu(isVerified) }
    );
    return;
  }

  // ========== Models ==========
  if (text === "📊 Models" || text === "/models") {
    const models = await prisma.aiModel.findMany({
      where: { isActive: true },
      select: { displayName: true, provider: true, pricePer1kIn: true },
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
        msg += `  • ${m.displayName} — ${Number(m.pricePer1kIn).toLocaleString()}đ/1K\n`;
      }
      msg += "\n";
    }

    await sendTelegramMessage(chatId, msg, { parse_mode: "HTML", reply_markup: getCompactMenu(isVerified) });
    return;
  }

  // ========== API Keys ==========
  if (text === "🔑 API Keys" || text === "/keys") {
    if (!user) {
      await sendTelegramMessage(chatId, "❌ Chưa liên kết tài khoản.",
        { reply_markup: getMenuKeyboard(false) });
      return;
    }
    const keys = await prisma.apiKey.findMany({
      where: { userId: user.id },
      select: { name: true, key: true, isActive: true, totalCalls: true },
      orderBy: { createdAt: "desc" },
    });

    if (keys.length === 0) {
      await sendTelegramMessage(chatId,
        `🔑 Chưa có API key nào.\nTạo tại: <a href="${SITE_URL}/dashboard/keys">morahub.online/keys</a>`,
        { parse_mode: "HTML", reply_markup: getCompactMenu(isVerified) }
      );
      return;
    }

    let msg = `🔑 <b>API Keys (${keys.length})</b>\n\n`;
    for (const k of keys) {
      const status = k.isActive ? "✅" : "❌";
      msg += `${status} <b>${k.name}</b>\n   <code>${k.key.slice(0, 20)}...</code>\n   Calls: ${k.totalCalls}\n\n`;
    }

    await sendTelegramMessage(chatId, msg, { parse_mode: "HTML", reply_markup: getCompactMenu(isVerified) });
    return;
  }

  // ========== Usage ==========
  if (text === "📈 Thống kê" || text === "/usage") {
    if (!user) {
      await sendTelegramMessage(chatId, "❌ Chưa liên kết tài khoản.",
        { reply_markup: getMenuKeyboard(false) });
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
      { parse_mode: "HTML", reply_markup: getCompactMenu(isVerified) }
    );
    return;
  }

  // ========== Support (Hỗ trợ) ==========
  if (text === "🎫 Hỗ trợ") {
    if (!user) {
      await sendTelegramMessage(chatId, "❌ Chưa liên kết tài khoản.",
        { reply_markup: getMenuKeyboard(false) });
      return;
    }

    await sendTelegramMessage(chatId,
      `🎫 <b>Hỗ trợ kỹ thuật</b>\n\n` +
      `Gửi nội dung cần hỗ trợ, bot sẽ tạo ticket và gửi cho admin.\n\n` +
      `📌 Gõ nội dung và gửi, ví dụ:\n` +
      `<code>API bị lỗi 500 khi gọi gpt-4o</code>`,
      { parse_mode: "HTML", reply_markup: getCompactMenu(isVerified) }
    );
    return;
  }

  // ========== Deposit Support (Nạp tiền) ==========
  if (text === "💵 Nạp tiền") {
    await sendTelegramMessage(chatId,
      `👋 <b>Xin chào!</b>

` +
      `Tôi là <b>Mora Assistant</b> — Hệ thống hỗ trợ giao dịch tự động 24/7 của MoraHub.

` +
      `Vui lòng chọn vấn đề bạn đang gặp phải:`,
      { parse_mode: "HTML", reply_markup: {
        inline_keyboard: [
          [{ text: "💵 Nạp tiền đúng ND nhưng chưa nhận được tiền", callback_data: "support_correct" }],
          [{ text: "📝 Chuyển khoản sai nội dung", callback_data: "support_wrong_content" }],
          [{ text: "💰 Chuyển khoản sai số tiền", callback_data: "support_wrong_amount" }],
          [{ text: "⚠️ Sai nội dung và sai số tiền", callback_data: "support_wrong_both" }],
          [{ text: "💸 CK dưới 10.000 VNĐ", callback_data: "support_under10k" }],
          [{ text: "➕ Bổ sung thông tin khác", callback_data: "support_other_info" }],
        ]
      }}
    );
    return;
  }

  // ========== Support Callbacks ==========
  if (update.callback_query) {
    const data = update.callback_query.data;
    const cbChatId = update.callback_query.message?.chat?.id || chatId;
    
    if (data === "support_under10k") {
      await sendTelegramMessage(cbChatId,
        `❌ <b>Rất tiếc.</b>

Theo quy định của MoraHub, các giao dịch dưới 10.000 VNĐ sẽ không được hỗ trợ xử lý thủ công.

Vui lòng thực hiện giao dịch mới với số tiền từ 10.000 VNĐ trở lên.

Xin cảm ơn.`,
        { parse_mode: "HTML", reply_markup: getCompactMenu(isVerified) }
      );
      return;
    }

    if (data === "support_other_info") {
      await sendTelegramMessage(cbChatId,
        `📝 Bạn có thể cung cấp thông tin giao dịch để mình đối chiếu.

` +
        `Bạn có thể <b>che số tài khoản, bỏ số dư</b> — chúng mình chỉ cần:

` +
        `👤 Họ tên người chuyển
🏦 Ngân hàng chuyển
💵 Số tiền giao dịch
🕒 Thời gian giao dịch
📝 Nội dung chuyển khoản

Vui lòng nhập thông tin bạn có:`,
        { parse_mode: "HTML" }
      );
      if (user) {
        await prisma.user.update({ where: { id: user.id }, data: { telegramVerifyCode: "SUPPORT_OTHER_INFO" } });
      }
      return;
    }

    if (data === "support_correct") {
      await sendTelegramMessage(cbChatId,
        `📝 Vui lòng nhập <b>mã nạp tiền</b> (MORA...) để mình kiểm tra:

Ví dụ: <code>MORA7KX9B2NF</code>`,
        { parse_mode: "HTML" }
      );
      if (user) {
        await prisma.user.update({ where: { id: user.id }, data: { telegramVerifyCode: "SUPPORT_CORRECT" } });
      }
      return;
    }

    if (data === "support_wrong_content") {
      await sendTelegramMessage(cbChatId,
        `📝 Bạn đã chuyển khoản sai nội dung.

Vui lòng nhập theo format:
<code>MORAxxxxxx sốtiền</code>

Ví dụ: <code>MORA123456 50000</code>`,
        { parse_mode: "HTML" }
      );
      if (user) {
        await prisma.user.update({ where: { id: user.id }, data: { telegramVerifyCode: "SUPPORT_WRONG_CONTENT" } });
      }
      return;
    }

    if (data === "support_wrong_amount") {
      await sendTelegramMessage(cbChatId,
        `💰 Bạn đã chuyển khoản sai số tiền.

Bạn đã chuyển khoản bao nhiêu tiền? Vui lòng nhập theo format:
<code>MORAxxxxxx sốtiền</code>

Ví dụ: <code>MORA123456 40000</code>`,
        { parse_mode: "HTML" }
      );
      if (user) {
        await prisma.user.update({ where: { id: user.id }, data: { telegramVerifyCode: "SUPPORT_WRONG_AMOUNT" } });
      }
      return;
    }

    if (data === "support_wrong_both") {
      await sendTelegramMessage(cbChatId,
        `⚠️ Bạn đã sai cả nội dung và số tiền.

Vui lòng nhập:
📝 Nội dung đã chuyển
💵 Số tiền đã chuyển

Format: <code>MORAxxxxxx sốtiền</code>

Ví dụ: <code>MORA123456 40000</code>`,
        { parse_mode: "HTML" }
      );
      if (user) {
        await prisma.user.update({ where: { id: user.id }, data: { telegramVerifyCode: "SUPPORT_WRONG_BOTH" } });
      }
      return;
    }
    return;
  }

  // ========== Support Flow Input ==========
  if (user?.telegramVerifyCode?.startsWith("SUPPORT_")) {
    const flow = user.telegramVerifyCode;
    
    if (flow === "SUPPORT_OTHER_INFO") {
      await prisma.user.update({ where: { id: user.id }, data: { telegramVerifyCode: null } });
      await sendTelegramMessage(chatId,
        `🔍 Mình đã ghi nhận thông tin:

${text.slice(0, 500)}

Nếu cần hỗ trợ thêm, vui lòng liên hệ nhân viên qua Telegram.`,
        { parse_mode: "HTML", reply_markup: getCompactMenu(isVerified) }
      );
      return;
    }

    if (flow === "SUPPORT_CORRECT" || flow === "SUPPORT_WRONG_CONTENT" || flow === "SUPPORT_WRONG_AMOUNT" || flow === "SUPPORT_WRONG_BOTH") {
      const parts = text.split(/\s+/);
      const ref = parts[0]?.toUpperCase();
      const amt = parseInt(parts[1]) || 0;
      
      if (!ref?.startsWith("MORA")) {
        await sendTelegramMessage(chatId, `❌ Mã CK không hợp lệ. Vui lòng nhập đúng format: <code>MORAxxxxxx sốtiền</code>`, { parse_mode: "HTML" });
        return;
      }
      
      await sendTelegramMessage(chatId, `🔍 Hệ thống đang kiểm tra giao dịch...`, { parse_mode: "HTML" });
      
      const tx = await prisma.transaction.findFirst({
        where: { reference: { contains: ref.replace("MORA", "") }, paymentMethod: "BANKING" },
        orderBy: { createdAt: "desc" },
      });
      
      await prisma.user.update({ where: { id: user.id }, data: { telegramVerifyCode: null } });
      
      if (tx) {
        const bankAmount = Number(tx.amount);
        if (tx.status === "COMPLETED") {
          await sendTelegramMessage(chatId,
            `✅ <b>Đã xác minh thành công!</b>\n\n💵 Tiền đã được cộng vào tài khoản.\n💰 Số tiền: <b>${bankAmount.toLocaleString("vi-VN")}đ</b>\n📝 Mã CK: <code>${ref}</code>\n\nXin lỗi vì sự chậm trễ. Cảm ơn bạn đã sử dụng MoraHub! 🙏`,
            { parse_mode: "HTML", reply_markup: getCompactMenu(isVerified) }
          );
        } else if (tx.status === "PENDING") {
          await sendTelegramMessage(chatId,
            `🔍 Hệ thống đã phát hiện giao dịch của bạn.\n\n⏳ Giao dịch đang được xác minh.\n💰 Số tiền: <b>${bankAmount.toLocaleString("vi-VN")}đ</b>\n\nVui lòng chờ từ 1 đến 2 phút.`,
            { parse_mode: "HTML", reply_markup: getCompactMenu(isVerified) }
          );
        } else {
          await sendTelegramMessage(chatId,
            `ℹ️ Giao dịch này đã được xử lý trước đó.\n\nVui lòng kiểm tra lại số dư tài khoản.`,
            { parse_mode: "HTML", reply_markup: getCompactMenu(isVerified) }
          );
        }
      } else {
        await sendTelegramMessage(chatId,
          `❌ Hiện tại hệ thống chưa tìm thấy giao dịch phù hợp.\n\nNguyên nhân có thể là:\n• Thông tin chưa đầy đủ\n• Giao dịch chưa được ngân hàng cập nhật\n• Sai nội dung hoặc sai số tiền\n\nVui lòng cung cấp thêm thông tin để đối chiếu.`,
          { parse_mode: "HTML", reply_markup: { inline_keyboard: [[{ text: "➕ Bổ sung thông tin", callback_data: "support_other_info" }]] } }
        );
      }
      return;
    }
  }

  // ========== Help ==========
  if (text === "📖 Hướng dẫn" || text === "/help") {
    await sendTelegramMessage(chatId,
      `📖 <b>Hướng dẫn sử dụng MoraHub Bot</b>\n\n` +
      `Bot giúp bạn quản lý tài khoản ngay trên Telegram.\n\n` +
      `<b>Lệnh:</b>\n` +
      `/start — Menu chính\n` +
      `/verify — Liên kết tài khoản\n` +
      `/balance — Kiểm tra số dư\n` +
      `/models — Danh sách AI models\n` +
      `/keys — Quản lý API keys\n` +
      `/usage — Thống kê sử dụng\n` +
      `/help — Hướng dẫn\n\n` +
      `🌐 Website: <a href="${SITE_URL}">morahub.online</a>\n` +
      `💬 Hỗ trợ: <a href="https://t.me/MoraSupport_bot">@MoraSupport_bot</a>`,
      { parse_mode: "HTML", reply_markup: getCompactMenu(isVerified) }
    );
    return;
  }

  // ========== Unknown command ==========
  if (text.startsWith("/")) {
    await sendTelegramMessage(chatId,
      `🤔 Lệnh không tồn tại.\nNhấn "📖 Hướng dẫn" hoặc gõ /help`,
      { reply_markup: getCompactMenu(isVerified) }
    );
    return;
  }

  // ========== Free text = treat as support request ==========
  if (user && !text.startsWith("/")) {
    // Create support ticket
    try {
      const ticket = await prisma.ticket.create({
        data: {
          userId: user.id,
          subject: `Hỗ trợ từ Telegram: ${text.slice(0, 50)}`,
          status: "OPEN",
          priority: "normal",
          category: "telegram",
        },
      });

      // Add first message
      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: user.id,
          content: text,
        },
      });

      // Notify user
      await sendTelegramMessage(chatId,
        `🎫 <b>Đã tạo ticket hỗ trợ!</b>\n\n` +
        `🆔 #${ticket.id.slice(-6).toUpperCase()}\n` +
        `📝 ${text.slice(0, 100)}${text.length > 100 ? "..." : ""}\n\n` +
        `Admin sẽ phản hồi sớm nhất có thể.\n` +
        `Xem tại: <a href="${SITE_URL}/dashboard/tickets">morahub.online/tickets</a>`,
        { parse_mode: "HTML", reply_markup: getCompactMenu(isVerified) }
      );

      // Notify admin
      await notifyAdminNewTicket(ticket.id, ticket.subject, user.email, text);

    } catch (err) {
      console.error("Create ticket error:", err);
      await sendTelegramMessage(chatId,
        `❌ Có lỗi xảy ra. Vui lòng thử lại hoặc liên hệ admin.`,
        { reply_markup: getCompactMenu(isVerified) }
      );
    }
    return;
  }
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
