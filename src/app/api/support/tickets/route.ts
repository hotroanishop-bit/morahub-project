import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { canCreateTicket, checkFraudIndicators, sanitizeInput } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { reference, issueType, amount, wrongContent, wrongAmount, accountName, accountNumber } = body;

    // ========== RATE LIMIT ==========
    const rateCheck = await canCreateTicket(user.id);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: rateCheck.reason }, { status: 429 });
    }

    // ========== FRAUD CHECK ==========
    const fraud = await checkFraudIndicators(user.id);
    if (fraud.suspicious) {
      // Force ESCALATED status
      const ticket = await prisma.ticket.create({
        data: {
          userId: user.id,
          subject: `⚠️ Nghi ngờ: ${reference || "Không rõ"}`,
          reference: reference ? sanitizeInput(reference) : null,
          issueType: "fraud_suspected",
          status: "ESCALATED",
          amount: amount || null,
          wrongInfo: fraud.reasons.join("; "),
          accountName: accountName ? sanitizeInput(accountName) : null,
          accountNumber: accountNumber ? sanitizeInput(accountNumber) : null,
        },
      });
      return NextResponse.json({
        success: true,
        ticket,
        warning: "Phiếu được đánh dấu nghi ngờ và chuyển nhân viên.",
      });
    }

    // ========== SANITIZE INPUT ==========
    const ticket = await prisma.ticket.create({
      data: {
        userId: user.id,
        subject: `Hỗ trợ nạp tiền ${reference || ""}`,
        reference: reference ? sanitizeInput(reference) : null,
        issueType: issueType || null,
        status: "OPEN",
        amount: amount || null,
        wrongInfo: wrongContent ? `ND: ${sanitizeInput(wrongContent)}` : (wrongAmount ? `Tien: ${wrongAmount}` : null),
        accountName: accountName ? sanitizeInput(accountName) : null,
        accountNumber: accountNumber ? sanitizeInput(accountNumber) : null,
      },
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error("Create ticket error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tickets = await prisma.ticket.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
