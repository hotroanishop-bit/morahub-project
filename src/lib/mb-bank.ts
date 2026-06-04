/**
 * MB Bank Auto-Deposit - Custom Implementation
 * Uses raw HTTP requests + tesseract.js for captcha OCR
 * No sharp dependency needed!
 */

import { prisma } from "./prisma";
import { sendTelegramMessage } from "./telegram-bot";

const MB_API_BASE = "https://online.mbbank.com.vn";

// Cache session
let sessionId: string | null = null;
let lastLogin = 0;
const SESSION_TTL = 5 * 60 * 1000; // 5 minutes
let wasmData: Buffer | null = null;

// Generate device ID
function generateDeviceId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Get timestamp
function getTimeNow(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${now.getMilliseconds().toString().slice(0, -1)}`;
}

// Default headers
function getDefaultHeaders(deviceId: string, refNo: string) {
  return {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "X-Request-Id": refNo,
    "Deviceid": deviceId,
    "Refno": refNo,
    "Origin": "https://online.mbbank.com.vn",
    "Referer": "https://online.mbbank.com.vn/",
  };
}

// Recognize captcha using tesseract.js
async function recognizeCaptcha(imageBase64: string): Promise<string | null> {
  try {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");
    
    const imageBuffer = Buffer.from(imageBase64, "base64");
    const { data: { text } } = await worker.recognize(imageBuffer);
    await worker.terminate();
    
    // Clean up result - keep only alphanumeric
    const cleaned = text.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6);
    if (cleaned.length !== 6) return null;
    
    return cleaned;
  } catch (err) {
    console.error("[MB Bank] Captcha OCR error:", err);
    return null;
  }
}

// Login to MB Bank
async function login(username: string, password: string): Promise<boolean> {
  try {
    const deviceId = generateDeviceId();
    const rId = getTimeNow();
    const headers = getDefaultHeaders(deviceId, rId);

    // 1. Get captcha
    const captchaRes = await fetch(`${MB_API_BASE}/api/retail-internetbankingms/getCaptchaImage`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        sessionId: "",
        refNo: rId,
        deviceIdCommon: deviceId,
      }),
    });

    const captchaData = await captchaRes.json() as any;
    if (!captchaData.imageString) {
      console.error("[MB Bank] Failed to get captcha");
      return false;
    }

    // 2. Recognize captcha
    const captchaText = await recognizeCaptcha(captchaData.imageString);
    if (!captchaText) {
      console.error("[MB Bank] Failed to recognize captcha, retrying...");
      return login(username, password); // Retry
    }

    // 3. Hash password with MD5
    const crypto = await import("crypto");
    const hashedPassword = crypto.createHash("md5").update(password).digest("hex");

    // 4. Login
    const loginRes = await fetch(`${MB_API_BASE}/api/retail_web/internetbanking/v2.0/doLogin`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        userId: username,
        password: hashedPassword,
        captcha: captchaText,
        ibAuthen2faString: "0f1d0dcab6324a254218a0f6e0385728",
        sessionId: null,
        refNo: getTimeNow(),
        deviceIdCommon: deviceId,
      }),
    });

    const loginData = await loginRes.json() as any;
    
    if (loginData.result?.ok) {
      sessionId = loginData.sessionId;
      lastLogin = Date.now();
      console.log("[MB Bank] Login success");
      return true;
    } else if (loginData.result?.responseCode === "GW283") {
      // Captcha wrong, retry
      console.log("[MB Bank] Captcha wrong, retrying...");
      return login(username, password);
    } else {
      console.error("[MB Bank] Login failed:", loginData.result?.message);
      return false;
    }
  } catch (err) {
    console.error("[MB Bank] Login error:", err);
    return false;
  }
}

// Make authenticated request
async function mbRequest(path: string, body?: object): Promise<any> {
  const settings = await prisma.siteSettings.findFirst();
  if (!settings?.bankUsername || !settings?.bankPassword) return null;

  if (!sessionId || Date.now() - lastLogin > SESSION_TTL) {
    const ok = await login(settings.bankUsername, settings.bankPassword);
    if (!ok) return null;
  }

  const deviceId = generateDeviceId();
  const rId = getTimeNow();
  const headers = getDefaultHeaders(deviceId, rId);

  const defaultBody = {
    sessionId,
    refNo: rId,
    deviceIdCommon: deviceId,
  };

  const res = await fetch(`${MB_API_BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ ...defaultBody, ...body }),
  });

  const data = await res.json() as any;

  if (data.result?.responseCode === "GW200") {
    // Session expired, re-login
    sessionId = null;
    return mbRequest(path, body);
  }

  return data;
}

// Get balance
export async function getBalance() {
  const data = await mbRequest("/api/retail-accountms/accountms/getBalance");
  if (!data || !data.totalBalanceEquivalent) return null;

  return {
    totalBalance: data.totalBalanceEquivalent,
    currency: data.currencyEquivalent,
    accounts: (data.acct_list || []).map((a: any) => ({
      number: a.acctNo,
      name: a.acctNm,
      currency: a.ccyCd,
      balance: a.currentBalance,
    })),
  };
}

// Get transaction history
export async function getTransactions(fromDate: string, toDate: string) {
  const settings = await prisma.siteSettings.findFirst();
  if (!settings?.bankAccountNumber) return [];

  const data = await mbRequest(
    "/api/retail-transactionms/transactionms/get-account-transaction-history",
    {
      accountNo: settings.bankAccountNumber,
      fromDate,
      toDate,
    }
  );

  if (!data?.transactionHistoryList) return [];

  return data.transactionHistoryList.map((t: any) => ({
    postDate: t.postingDate,
    transactionDate: t.transactionDate,
    accountNumber: t.accountNo,
    creditAmount: t.creditAmount,
    debitAmount: t.debitAmount,
    currency: t.currency,
    description: t.description,
    refNo: t.refNo,
    toAccountName: t.benAccountName,
    toBank: t.bankName,
    toAccountNumber: t.benAccountNo,
  }));
}

// Check deposits (called by cron)
export async function checkDeposits() {
  try {
    const settings = await prisma.siteSettings.findFirst();
    if (!settings?.bankUsername || !settings?.bankActive) return;

    // Get transactions from last 1 hour
    const now = new Date();
    const fromDate = new Date(now.getTime() - 60 * 60 * 1000);
    
    const pad = (n: number) => n.toString().padStart(2, "0");
    const fromDateStr = `${pad(fromDate.getDate())}/${pad(fromDate.getMonth() + 1)}/${fromDate.getFullYear()}`;
    const toDateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;

    const transactions = await getTransactions(fromDateStr, toDateStr);
    if (!transactions.length) return;

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
      const match = transactions.find((bankTx: any) => {
        const desc = (bankTx.description || "").toUpperCase();
        const ref = (tx.reference || "").toUpperCase();
        return desc.includes(ref) && Number(bankTx.creditAmount) >= Number(tx.amount);
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

        // Notify user
        const user = await prisma.user.findUnique({ where: { id: tx.userId } });
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

        console.log(`[Auto-Deposit] Confirmed: ${tx.reference} - ${tx.amount}đ`);
      }
    }
  } catch (err) {
    console.error("[Auto-Deposit] Error:", err);
    sessionId = null; // Reset session on error
  }
}
