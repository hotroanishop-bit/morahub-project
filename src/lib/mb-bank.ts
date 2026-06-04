/**
 * MB Bank Auto-Deposit - Custom Implementation
 * Uses raw HTTP requests + tesseract.js for captcha OCR
 * No sharp dependency needed!
 * 
 * Session logic: only re-login when MB Bank says session expired (responseCode GW200)
 * No timer-based re-login — keeps session alive as long as possible
 */

import { prisma } from "./prisma";
import { sendTelegramMessage } from "./telegram-bot";

const MB_API_BASE = "https://online.mbbank.com.vn";

// Cache session — no timer, just keep it alive
let sessionId: string | null = null;
let loginFailed = false;
let lastFailedAttempt = 0;
const LOGIN_COOLDOWN = 5 * 60 * 1000; // 5 min cooldown after failed login

function generateDeviceId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getTimeNow(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${now.getMilliseconds().toString().slice(0, -1)}`;
}

function getDefaultHeaders(deviceId: string, refNo: string) {
  return {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36",
    "X-Request-Id": refNo,
    "Deviceid": deviceId,
    "Refno": refNo,
    "Origin": "https://online.mbbank.com.vn",
    "Referer": "https://online.mbbank.com.vn/",
  };
}

async function recognizeCaptcha(imageBase64: string): Promise<string | null> {
  try {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");
    const imageBuffer = Buffer.from(imageBase64, "base64");
    const { data: { text } } = await worker.recognize(imageBuffer);
    await worker.terminate();
    const cleaned = text.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6);
    return cleaned.length === 6 ? cleaned : null;
  } catch (err) {
    console.error("[MB Bank] Captcha OCR error:", err);
    return null;
  }
}

async function login(username: string, password: string): Promise<boolean> {
  try {
    const deviceId = generateDeviceId();
    const rId = getTimeNow();
    const headers = getDefaultHeaders(deviceId, rId);

    // 1. Get captcha
    const captchaRes = await fetch(`${MB_API_BASE}/api/retail-internetbankingms/getCaptchaImage`, {
      method: "POST",
      headers,
      body: JSON.stringify({ sessionId: "", refNo: rId, deviceIdCommon: deviceId }),
    });
    const captchaData = await captchaRes.json() as any;
    if (!captchaData.imageString) return false;

    // 2. Recognize captcha
    const captchaText = await recognizeCaptcha(captchaData.imageString);
    if (!captchaText) return login(username, password); // Retry on captcha fail

    // 3. Hash password
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
      loginFailed = false;
      console.log("[MB Bank] Login success, session:", sessionId?.slice(0, 8));
      return true;
    } else if (loginData.result?.responseCode === "GW283") {
      return login(username, password); // Captcha wrong, retry
    } else {
      console.error("[MB Bank] Login failed:", loginData.result?.message);
      loginFailed = true;
      lastFailedAttempt = Date.now();
      return false;
    }
  } catch (err) {
    console.error("[MB Bank] Login error:", err);
    return false;
  }
}

// Make request — only re-login when MB Bank says session expired (GW200)
async function mbRequest(path: string, body?: object): Promise<any> {
  const settings = await prisma.siteSettings.findFirst();
  if (!settings?.bankUsername || !settings?.bankPassword) return null;

  // Cooldown after failed login
  if (loginFailed && Date.now() - lastFailedAttempt < LOGIN_COOLDOWN) return null;

  // No session — login first
  if (!sessionId) {
    const ok = await login(settings.bankUsername, settings.bankPassword);
    if (!ok) return null;
  }

  const deviceId = generateDeviceId();
  const rId = getTimeNow();
  const headers = getDefaultHeaders(deviceId, rId);

  const res = await fetch(`${MB_API_BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ sessionId, refNo: rId, deviceIdCommon: deviceId, ...body }),
  });
  const data = await res.json() as any;

  // MB Bank says session expired → login once, retry
  if (data.result?.responseCode === "GW200") {
    console.log("[MB Bank] Session expired, re-login...");
    sessionId = null;
    loginFailed = false;
    return mbRequest(path, body); // Retry with fresh login
  }

  return data;
}

// Get balance
export async function getBalance() {
  const data = await mbRequest("/api/retail-accountms/accountms/getBalance");
  if (!data?.totalBalanceEquivalent) return null;
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
  const data = await mbRequest("/api/retail-transactionms/transactionms/get-account-transaction-history", {
    accountNo: settings.bankAccountNumber, fromDate, toDate,
  });
  if (!data?.transactionHistoryList) return [];
  return data.transactionHistoryList.map((t: any) => ({
    postDate: t.postingDate,
    description: t.description,
    creditAmount: t.creditAmount,
    debitAmount: t.debitAmount,
  }));
}

// Check deposits (called by cron)
export async function checkDeposits() {
  try {
    const settings = await prisma.siteSettings.findFirst();
    if (!settings?.bankUsername || !settings?.bankActive) return;

    const now = new Date();
    const fromDate = new Date(now.getTime() - 60 * 60 * 1000);
    const pad = (n: number) => n.toString().padStart(2, "0");
    const fromDateStr = `${pad(fromDate.getDate())}/${pad(fromDate.getMonth() + 1)}/${fromDate.getFullYear()}`;
    const toDateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;

    const transactions = await getTransactions(fromDateStr, toDateStr);
    if (!transactions.length) return;

    const pendingDeposits = await prisma.transaction.findMany({
      where: {
        status: "PENDING",
        paymentMethod: "BANKING",
        reference: { startsWith: "MORA" },
        createdAt: { gte: fromDate },
      },
    });

    for (const tx of pendingDeposits) {
      const match = transactions.find((bankTx: any) => {
        const desc = (bankTx.description || "").toUpperCase();
        return desc.includes(tx.reference || "") && Number(bankTx.creditAmount) >= Number(tx.amount);
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
            `✅ <b>Nạp tiền thành công!</b>\n\n💰 Số tiền: <b>${Number(tx.amount).toLocaleString("vi-VN")}đ</b>\n📝 Ref: <code>${tx.reference}</code>\n💎 Số dư mới: <b>${(Number(user.creditBalance) + Number(tx.amount)).toLocaleString("vi-VN")}đ</b>`,
            { parse_mode: "HTML" }
          );
        }

        const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
        if (admin?.telegramId) {
          await sendTelegramMessage(
            parseInt(admin.telegramId),
            `🔔 <b>Auto-Deposit</b>\n👤 ${user?.email}\n💰 ${Number(tx.amount).toLocaleString("vi-VN")}đ\n📝 ${tx.reference}`,
            { parse_mode: "HTML" }
          );
        }

        console.log(`[Auto-Deposit] Confirmed: ${tx.reference} - ${tx.amount}đ`);
      }
    }
  } catch (err) {
    console.error("[Auto-Deposit] Error:", err);
    sessionId = null; // Reset on error so next request re-login
  }
}
