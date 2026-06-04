import { prisma } from "@/lib/prisma";

export interface NotificationData {
  userId: string;
  type: "DEPOSIT_SUCCESS" | "DEPOSIT_FAILED" | "TICKET_REPLY" | "TICKET_RESOLVED" | "API_KEY_EXPIRING" | "LOW_CREDIT" | "LOGIN_NEW_DEVICE" | "SYSTEM";
  title: string;
  message: string;
  data?: any;
}

// Create notification
export async function createNotification(notification: NotificationData) {
  try {
    await prisma.userNotification.create({
      data: {
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

// Get unread count
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    return await prisma.userNotification.count({
      where: { userId, isRead: false },
    });
  } catch {
    return 0;
  }
}

// Mark as read
export async function markAsRead(notificationId: string, userId: string) {
  await prisma.userNotification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
}

// Mark all as read
export async function markAllAsRead(userId: string) {
  await prisma.userNotification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

// Send Telegram notification
export async function sendTelegramNotification(telegramId: string, message: string) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token || !telegramId) return;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegramId,
        text: message,
        parse_mode: "HTML",
      }),
    });
  } catch (error) {
    console.error("Telegram notification failed:", error);
  }
}

// Notify deposit success
export async function notifyDepositSuccess(userId: string, amount: number, reference: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  await createNotification({
    userId,
    type: "DEPOSIT_SUCCESS",
    title: "💰 Nạp tiền thành công",
    message: `Bạn đã nạp ${Number(amount).toLocaleString("vi-VN")}đ (Mã: ${reference})`,
  });

  if (user?.telegramId) {
    await sendTelegramNotification(
      user.telegramId,
      `💰 <b>Nạp tiền thành công!</b>\n\nSố tiền: ${Number(amount).toLocaleString("vi-VN")}đ\nMã: ${reference}\nSố dư: ${Number(user.creditBalance).toLocaleString("vi-VN")}đ`
    );
  }
}

// Notify ticket reply
export async function notifyTicketReply(userId: string, ticketId: string, message: string) {
  await createNotification({
    userId,
    type: "TICKET_REPLY",
    title: "🎫 Ticket mới",
    message: `Ticket #${ticketId}: ${message}`,
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.telegramId) {
    await sendTelegramNotification(
      user.telegramId,
      `🎫 <b>Ticket mới:</b>\n#${ticketId}\n\n${message}`
    );
  }
}

// Notify API key expiring
export async function notifyApiKeyExpiring(userId: string, keyName: string, expiresAt: Date) {
  await createNotification({
    userId,
    type: "API_KEY_EXPIRING",
    title: "🔑 API Key sắp hết hạn",
    message: `API key "${keyName}" sẽ hết hạn vào ${expiresAt.toLocaleDateString("vi-VN")}`,
  });
}

// Notify low credit
export async function notifyLowCredit(userId: string, balance: number) {
  await createNotification({
    userId,
    type: "LOW_CREDIT",
    title: "⚠️ Số dư thấp",
    message: `Số dư còn ${Number(balance).toLocaleString("vi-VN")}đ. Hãy nạp thêm!`,
  });
}

// Notify login new device
export async function notifyLoginNewDevice(userId: string, ip: string, device: string) {
  await createNotification({
    userId,
    type: "LOGIN_NEW_DEVICE",
    title: "🔐 Đăng nhập mới",
    message: `Đăng nhập từ ${device} (IP: ${ip})`,
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.telegramId) {
    await sendTelegramNotification(
      user.telegramId,
      `🔐 <b>Đăng nhập mới!</b>\n\nDevice: ${device}\nIP: ${ip}\nThời gian: ${new Date().toLocaleString("vi-VN")}`
    );
  }
}
