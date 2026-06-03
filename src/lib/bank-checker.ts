/**
 * MB Bank Auto-Deposit Checker
 * Checks transaction history every 30 seconds
 * Matches reference codes and auto-credits users
 */

import { prisma } from "./prisma";
import { sendTelegramMessage } from "./telegram-bot";

// Cache MB session
let mbClient: any = null;
let lastLogin = 0;
const SESSION_TTL = 5 * 60 * 1000; // 5 minutes

async function getMBClient() {
  const settings = await prisma.siteSettings.findFirst();
  if (!settings?.bankUsername || !settings?.bankPassword || !settings?.bankActive) {
    return null;
  }

  // Reuse session if still valid
  if (mbClient && Date.now() - lastLogin < SESSION_TTL) {
    return mbClient;
  }

  try {
    const { MB } = await import("mbbank");
    mbClient = new MB({
      username: settings.bankUsername,
      password: settings.bankPassword,
      preferredOCRMethod: "default",
      saveWasm: true,
    });
    await mbClient.login();
    lastLogin = Date.now();
    console.log("[MB Bank] Login success");
    return mbClient;
  } catch (err) {
    console.error("[MB Bank] Login failed:", err);
    mbClient = null;
    return null;
  }
}

// Check for new deposits
export async function checkDeposits() {
  try {
    const settings = await prisma.siteSettings.findFirst();
    if (!settings?.bankUsername || !settings?.bankActive) return;

    const client = await getMBClient();
    if (!client) return;

    // Get transactions from last 1 hour
    const now = new Date();
    const fromDate = new Date(now.getTime() - 60 * 60 * 1000);

    const fromDateStr = `${String(fromDate.getDate()).padStart(2, "0")}/${String(fromDate.getMonth() + 1).padStart(2, "0")}/${fromDate.getFullYear()}`;
    const toDateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;

    const transactions = await client.getTransactionsHistory({
      accountNumber: settings.bankAccountNumber || "",
      fromDate: fromDateStr,
      toDate: toDateStr,
    });

    if (!transactions) return;
    const txList = Array.isArray(transactions) ? transactions : (transactions as any).transactions || [];

    // Find pending deposits with MORA reference
    const pendingDeposits = await prisma.transaction.findMany({
      where: {
        status: "PENDING",
        paymentMethod: "BANKING",
        reference: { startsWith: "MORA" },
        createdAt: { gte: fromDate },
      },
    });

    for (const tx of pendingDeposits) {
      // Match by reference code in transaction description
      const match = txList.find((bankTx: any) => {
        const desc = (bankTx.description || bankTx.content || bankTx.narrative || "").toUpperCase();
        const ref = (tx.reference || "").toUpperCase();
        return desc.includes(ref) && Number(bankTx.amount) >= Number(tx.amount);
      });

      if (match) {
        // Credit user
        await prisma.user.update({
          where: { id: tx.userId },
          data: { creditBalance: { increment: Number(tx.amount) } },
        });

        // Update transaction
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { status: "COMPLETED" },
        });

        // Get user for notification
        const user = await prisma.user.findUnique({ where: { id: tx.userId } });

        // Notify user via Telegram
        if (user?.telegramId) {
          const newBalance = Number(user.creditBalance) + Number(tx.amount);
          await sendTelegramMessage(
            parseInt(user.telegramId),
            `✅ <b>Nạp tiền thành công!</b>\n\n` +
            `💰 Số tiền: <b>${Number(tx.amount).toLocaleString("vi-VN")}đ</b>\n` +
            `📝 Ref: <code>${tx.reference}</code>\n` +
            `💎 Số dư mới: <b>${newBalance.toLocaleString("vi-VN")}đ</b>`,
            { parse_mode: "HTML" }
          );
        }

        // Notify admin
        const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
        if (admin?.telegramId) {
          await sendTelegramMessage(
            parseInt(admin.telegramId),
            `🔔 <b>Auto-Deposit Confirmed</b>\n\n` +
            `👤 User: ${user?.email}\n` +
            `💰 Amount: ${Number(tx.amount).toLocaleString("vi-VN")}đ\n` +
            `📝 Ref: ${tx.reference}`,
            { parse_mode: "HTML" }
          );
        }

        console.log(`[Auto-Deposit] Confirmed: ${tx.reference} - ${tx.amount}đ for user ${user?.email}`);
      }
    }

    // Update last checked
    await prisma.siteSettings.updateMany({
      data: { updatedAt: now },
    });

  } catch (err) {
    console.error("[Auto-Deposit] Error:", err);
    // Reset session on error
    mbClient = null;
  }
}
