import { prisma } from "@/lib/prisma";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send email via SMTP. Returns true if sent, false if SMTP not configured.
 * In production, configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env
 */
async function sendEmail(options: EmailOptions): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "MoraHub <noreply@morahub.online>";

  if (!host || !user || !pass) {
    // SMTP not configured, skip silently
    return false;
  }

  try {
    // Dynamic import to avoid bundling nodemailer when not needed
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    return true;
  } catch (err) {
    console.error("Email send error:", err);
    return false;
  }
}

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#6366f1,#a855f7);color:white;font-weight:bold;font-size:20px;line-height:48px;">M</div>
    </div>
    <div style="background:white;border-radius:16px;border:1px solid #e2e8f0;padding:32px;">
      ${content}
    </div>
    <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:24px;">MoraHub — Nền tảng API AI</p>
  </div>
</body>
</html>`;
}

export async function notifyLowCredit(userId: string, balance: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.email) return;

  await sendEmail({
    to: user.email,
    subject: "⚠️ Credit sắp hết — MoraHub",
    html: baseTemplate(`
      <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">Credit sắp hết</h2>
      <p style="color:#64748b;font-size:14px;line-height:1.6;">
        Credit hiện tại: <strong style="color:#f59e0b;">${Number(balance).toLocaleString("vi-VN")}đ</strong>
      </p>
      <p style="color:#64748b;font-size:14px;line-height:1.6;">
        Vui lòng nạp thêm credit để tiếp tục sử dụng API.
      </p>
      <a href="https://morahub.online/dashboard/top-up" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#a855f7);color:white;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px;margin-top:16px;">Nạp Ngay</a>
    `),
  });
}

export async function notifyKeyExpired(userId: string, keyName: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.email) return;

  await sendEmail({
    to: user.email,
    subject: "🔑 API Key đã hết hạn — MoraHub",
    html: baseTemplate(`
      <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">API Key hết hạn</h2>
      <p style="color:#64748b;font-size:14px;line-height:1.6;">
        Key "<strong>${keyName}</strong>" đã hết hạn và bị vô hiệu hóa tự động.
      </p>
      <p style="color:#64748b;font-size:14px;line-height:1.6;">
        Hãy tạo key mới hoặc gia hạn key hiện tại.
      </p>
      <a href="https://morahub.online/dashboard/keys" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#a855f7);color:white;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px;margin-top:16px;">Quản Lý Keys</a>
    `),
  });
}

export async function notifyTicketCreated(userId: string, ticketTitle: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.email) return;

  await sendEmail({
    to: user.email,
    subject: "🎧 Ticket mới đã tạo — MoraHub",
    html: baseTemplate(`
      <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">Ticket đã tạo</h2>
      <p style="color:#64748b;font-size:14px;line-height:1.6;">
        Ticket "<strong>${ticketTitle}</strong>" đã được tạo thành công.
      </p>
      <p style="color:#64748b;font-size:14px;line-height:1.6;">
        Chúng tôi sẽ phản hồi trong thời gian sớm nhất.
      </p>
      <a href="https://morahub.online/dashboard/tickets" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#a855f7);color:white;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px;margin-top:16px;">Xem Ticket</a>
    `),
  });
}

export async function notifyTicketReplied(userId: string, ticketTitle: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.email) return;

  await sendEmail({
    to: user.email,
    subject: "💬 Phản hồi ticket — MoraHub",
    html: baseTemplate(`
      <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">Có phản hồi mới</h2>
      <p style="color:#64748b;font-size:14px;line-height:1.6;">
        Ticket "<strong>${ticketTitle}</strong>" có phản hồi mới.
      </p>
      <a href="https://morahub.online/dashboard/tickets" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#a855f7);color:white;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px;margin-top:16px;">Xem Ngay</a>
    `),
  });
}
