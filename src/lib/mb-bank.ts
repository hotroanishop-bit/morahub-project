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

// Cache session
let sessionId: string | null = null;
let loginFailed = false;
let lastFailedAttempt = 0;
const LOGIN_COOLDOWN = 5 * 60 * 1000;

function generateDeviceId(): string {
  return "s1rmi184-mbib-0000-0000-" + getTimeNow();
}

function getTimeNow(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const ms = now.getMilliseconds().toString().slice(0, -1);
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${ms}`;
}

function getDefaultHeaders(deviceId: string, refNo: string) {
  return {
    "Content-Type": "application/json; charset=UTF-8",
    "Accept": "application/json, text/plain, */*",
    "Authorization": "Basic RU1CUkVUQUlMV0VCOlNEMjM0ZGZnMzQlI0BGR0AzNHNmc2RmNDU4NDNm",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
    "Origin": "https://online.mbbank.com.vn",
    "Referer": "https://online.mbbank.com.vn/pl/login?returnUrl=%2F",
    "X-Request-Id": refNo,
    "Deviceid": deviceId,
    "Refno": refNo,
    "app": "MB_WEB",
  };
}

async function recognizeCaptcha(imageBase64: string): Promise<string | null> {
  try {
    const imageBuffer = Buffer.from(imageBase64, "base64");
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");
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
    console.log("[MB Bank] Getting captcha...");
    const captchaRes = await fetch(`${MB_API_BASE}/api/retail-internetbankingms/getCaptchaImage`, {
      method: "POST",
      headers,
      body: JSON.stringify({ sessionId: "", refNo: rId, deviceIdCommon: deviceId }),
    });
    
    if (!captchaRes.ok) {
      console.error("[MB Bank] Captcha request failed:", captchaRes.status);
      return false;
    }
    
    const captchaData = await captchaRes.json() as any;
    if (!captchaData.imageString) {
      console.error("[MB Bank] No captcha image");
      return false;
    }

    // 2. Recognize captcha
    console.log("[MB Bank] Recognizing captcha...");
    const captchaText = await recognizeCaptcha(captchaData.imageString);
    if (!captchaText) {
      console.log("[MB Bank] Captcha OCR failed, retrying...");
      return login(username, password);
    }
    console.log("[MB Bank] Captcha:", captchaText);

    // 3. Hash password with MD5
    const crypto = await import("crypto");
    const hashedPassword = crypto.createHash("md5").update(password).digest("hex");

    // 4. Login
    console.log("[MB Bank] Logging in...");
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
      console.log("[MB Bank] ✅ Login success!");
      return true;
    } else if (loginData.result?.responseCode === "GW283") {
      console.log("[MB Bank] Captcha wrong, retrying...");
      return login(username, password);
    } else {
      console.error("[MB Bank] ❌ Login failed:", loginData.result?.message || JSON.stringify(loginData.result));
      loginFailed = true;
      lastFailedAttempt = Date.now();
      return false;
    }
  } catch (err) {
    console.error("[MB Bank] Login error:", err);
    return false;
  }
}

async function mbRequest(path: string, body?: object): Promise<any> {
  const settings = await prisma.siteSettings.findFirst();
  if (!settings?.bankUsername || !settings?.bankPassword) return null;

  if (loginFailed && Date.now() - lastFailedAttempt < LOGIN_COOLDOWN) return null;

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

  if (data.result?.responseCode === "GW200") {
    console.log("[MB Bank] Session expired, re-login...");
    sessionId = null;
    loginFailed = false;
    return mbRequest(path, body);
  }

  return data;
}

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
        status: "PENDING", paymentMethod: "BANKING",
        reference: { startsWith: "MORA" }, createdAt: { gte: fromDate },
      },
    });

    for (const tx of pendingDeposits) {
      const match = transactions.find((bankTx: any) => {
        const desc = (bankTx.description || "").toUpperCase();
        return desc.includes(tx.reference || "") && Number(bankTx.creditAmount) >= Number(tx.amount);
      });

      if (match) {
        await prisma.user.update({ where: { id: tx.userId }, data: { creditBalance: { increment: Number(tx.amount) } } });
        await prisma.transaction.update({ where: { id: tx.id }, data: { status: "COMPLETED" } });

        const user = await prisma.user.findUnique({ where: { id: tx.userId } });
        if (user?.telegramId) {
          await sendTelegramMessage(parseInt(user.telegramId),
            `✅ <b>Nạp tiền thành công!</b>\n\n💰 Số tiền: <b>${Number(tx.amount).toLocaleString("vi-VN")}đ</b>\n📝 Ref: <code>${tx.reference}</code>`,
            { parse_mode: "HTML" });
        }
        console.log(`[Auto-Deposit] Confirmed: ${tx.reference}`);
      }
    }
  } catch (err) {
    console.error("[Auto-Deposit] Error:", err);
    sessionId = null;
  }
}
