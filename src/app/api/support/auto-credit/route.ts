import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { safeCredit, checkFraudIndicators, validateReference, sanitizeInput, findTransactionByReference } from "@/lib/security";
import { checkRateLimit, logRequest } from "@/lib/security-middleware";

// Rate limit: 10 auto-credit attempts per hour per user
const RATE_LIMIT = 10;
const WINDOW_MS = 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    // ========== AUTH CHECK ==========
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ========== RATE LIMITING ==========
    const rateLimit = checkRateLimit(`auto-credit:${user.id}`, RATE_LIMIT, WINDOW_MS);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Quá nhiều yêu cầu. Vui lòng thử lại sau." }, { status: 429 });
    }

    const body = await req.json();
    const { reference, wrongContent, wrongAmount, accountName, accountNumber } = body;

    // ========== INPUT VALIDATION ==========
    if (!reference) return NextResponse.json({ error: "Missing reference" }, { status: 400 });
    
    const refValidation = validateReference(reference);
    if (!refValidation.valid) return NextResponse.json({ error: refValidation.error }, { status: 400 });

    const cleanRef = refValidation.value!;
    const cleanWrongContent = wrongContent ? sanitizeInput(String(wrongContent)) : undefined;
    const cleanAccountName = accountName ? sanitizeInput(String(accountName)) : undefined;
    const cleanAccountNumber = accountNumber ? sanitizeInput(String(accountNumber)) : undefined;

    // ========== FIND TRANSACTION (secure lookup) ==========
    const tx = await findTransactionByReference(cleanRef);
    if (!tx) {
      return NextResponse.json({ 
        error: "Transaction not found",
        message: "Không tìm thấy giao dịch trong hệ thống. Vui lòng liên hệ nhân viên."
      }, { status: 404 });
    }

    // ========== FRAUD CHECK ==========
    if (tx.userId) {
      const fraud = await checkFraudIndicators(tx.userId);
      if (fraud.suspicious) {
        await prisma.ticket.create({
          data: {
            userId: tx.userId,
            subject: `⚠️ Nghi ngờ giao dịch: ${cleanRef}`,
            reference: cleanRef,
            issueType: "fraud_suspected",
            status: "ESCALATED",
            amount: Number(tx.amount),
            wrongInfo: fraud.reasons.join("; "),
            accountName: cleanAccountName,
            accountNumber: cleanAccountNumber,
          },
        });
        await logRequest(req, user.id, "auto_credit_fraud", { reference: cleanRef, reasons: fraud.reasons });
        return NextResponse.json({
          success: false,
          error: "Giao dịch được đánh dấu nghi ngờ. Vui lòng liên hệ nhân viên.",
          status: "escalated",
        });
      }
    }

    // ========== SAFE CREDIT (atomic, amount from DB only) ==========
    const result = await safeCredit({
      transactionId: tx.id,
      actor: "AUTO_BANK",
      reason: `Auto-credit từ hỗ trợ | ND: ${cleanWrongContent || "N/A"} | Ten: ${cleanAccountName || "N/A"} | STK: ${cleanAccountNumber || "N/A"}`,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    // Log successful auto-credit
    await logRequest(req, user.id, "auto_credit_success", { reference: cleanRef, amount: result.amount });

    // ========== NOTIFY ADMIN ==========
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (admin?.telegramId) {
      const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
      if (BOT_TOKEN) {
        const msg =
          `✅ <b>Auto-credit thành công</b>\n\n` +
          `📝 Mã: <code>${cleanRef}</code>\n` +
          `💰 Số tiền: <b>${result.amount?.toLocaleString("vi-VN")}đ</b>\n` +
          (cleanWrongContent ? `❌ ND sai: ${cleanWrongContent}\n` : "") +
          (cleanAccountName ? `👤 Tên: ${cleanAccountName}\n` : "") +
          (cleanAccountNumber ? `🏦 STK: ${cleanAccountNumber}\n` : "") +
          `\n✅ Đã tự cộng credit.`;

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: parseInt(admin.telegramId), text: msg, parse_mode: "HTML" }),
        });
      }
    }

    return NextResponse.json({
      success: true,
      amount: result.amount,
      reference: cleanRef,
      message: "Tiền đã được tự động cộng vào tài khoản!",
    });
  } catch (error) {
    console.error("Auto-credit error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
