/**
 * MB Bank Auto-Deposit - Uses standalone script for MB Bank operations
 * Avoids Next.js SSR issues with mbbank library's window.location
 */

import { prisma } from "./prisma";
import { sendTelegramMessage } from "./telegram-bot";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);
const MB_SCRIPT = path.join(process.cwd(), "scripts", "mb-bank-script.js");

let loginFailed = false;
let lastFailedAttempt = 0;
const LOGIN_COOLDOWN = 5 * 60 * 1000;

async function runMBBank(action: string, args: Record<string, any> = {}): Promise<any> {
  const settings = await prisma.siteSettings.findFirst();
  if (!settings?.bankUsername || !settings?.bankPassword) return null;
  if (loginFailed && Date.now() - lastFailedAttempt < LOGIN_COOLDOWN) return null;

  try {
    const { stdout, stderr } = await execFileAsync("node", [
      MB_SCRIPT, action, args ? JSON.stringify(args) : "",
    ], {
      timeout: 120000,
      env: {
        ...process.env,
        MB_USERNAME: settings.bankUsername,
        MB_PASSWORD: settings.bankPassword,
        DATABASE_URL: process.env.DATABASE_URL!,
      },
    });

    if (stderr && stderr.trim()) {
      const errData = JSON.parse(stderr.trim());
      console.error("[MB Bank]", errData.error);
      loginFailed = true;
      lastFailedAttempt = Date.now();
      return null;
    }

    loginFailed = false;
    return JSON.parse(stdout.trim());
  } catch (err: any) {
    console.error("[MB Bank] Exec error:", err.message?.slice(0, 200));
    loginFailed = true;
    lastFailedAttempt = Date.now();
    return null;
  }
}

export async function getBalance() {
  const result = await runMBBank("balance");
  if (!result) return null;
  return {
    totalBalance: result.totalBalance,
    currency: result.currencyEquivalent,
    accounts: (result.balances || []).map((a: any) => ({
      number: a.number, name: a.name, currency: a.currency, balance: a.balance,
    })),
  };
}

export async function checkDeposits() {
  try {
    const settings = await prisma.siteSettings.findFirst();
    if (!settings?.bankUsername || !settings?.bankActive) return;

    // Auto-fail expired pending transactions (>15 min)
    const expiryTime = new Date(Date.now() - 15 * 60 * 1000);
    const expired = await prisma.transaction.updateMany({
      where: { status: "PENDING", paymentMethod: "BANKING", createdAt: { lt: expiryTime } },
      data: { status: "FAILED" },
    });
    if (expired.count > 0) console.log(`[Auto-Deposit] Expired ${expired.count} old transactions`);

    const now = new Date();
    const fromDate = new Date(now.getTime() - 60 * 60 * 1000);
    const pad = (n: number) => n.toString().padStart(2, "0");

    const transactions = await runMBBank("transactions", {
      accountNumber: settings.bankAccountNumber || settings.bankUsername,
      fromDate: `${pad(fromDate.getDate())}/${pad(fromDate.getMonth() + 1)}/${fromDate.getFullYear()}`,
      toDate: `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`,
    });

    if (!transactions) return;

    const pendingDeposits = await prisma.transaction.findMany({
      where: {
        status: "PENDING", paymentMethod: "BANKING",
        reference: { startsWith: "MORA" },
        createdAt: { gte: fromDate },
      },
    });

    for (const tx of pendingDeposits) {
      const match = transactions.find((bankTx: any) => {
        const desc = (bankTx.transactionDesc || bankTx.description || "").toUpperCase();
        const descNoSpace = desc.replace(/\s/g, "");
        return (desc.includes(tx.reference || "") || descNoSpace.includes(tx.reference || "")) && Number(bankTx.creditAmount) >= Number(tx.amount);
      });

      if (match) {
        await prisma.user.update({
          where: { id: tx.userId },
          data: { creditBalance: { increment: Number(tx.amount) } },
        });
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { status: "COMPLETED" },
        });

        const user = await prisma.user.findUnique({ where: { id: tx.userId } });
        if (user?.telegramId) {
          await sendTelegramMessage(
            parseInt(user.telegramId),
            `✅ <b>Nạp tiền thành công!</b>\n\n💰 Số tiền: <b>${Number(tx.amount).toLocaleString("vi-VN")}đ</b>\n📝 Ref: <code>${tx.reference}</code>`,
            { parse_mode: "HTML" }
          );
        }
        console.log(`[Auto-Deposit] Confirmed: ${tx.reference}`);
      }
    }
  } catch (err: any) {
    console.error("[Auto-Deposit] Error:", err.message);
  }
}
