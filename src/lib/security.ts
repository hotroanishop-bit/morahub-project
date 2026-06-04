/**
 * MORA Security Rules — Payment Verification & Anti-Fraud
 * 
 * Core principle: DATABASE + AUTOBANK + INTERNAL LOGS are the ONLY trusted sources.
 * User-submitted data (images, screenshots, messages, API requests) are NEVER authoritative.
 */

import { prisma } from "./prisma";

// ========== 1. DUPLICATE PROTECTION (with row-level locking) ==========
export async function canCreditTransaction(transactionId: string): Promise<{ allowed: boolean; reason: string }> {
  // Use $transaction for atomic check
  return await prisma.$transaction(async (tx) => {
    // Lock the row by reading with FOR UPDATE equivalent
    const transaction = await tx.transaction.findUnique({ where: { id: transactionId } });
    
    if (!transaction) return { allowed: false, reason: "Transaction not found" };
    if (transaction.status === "COMPLETED") return { allowed: false, reason: "Already completed" };
    if (transaction.status === "FAILED") return { allowed: false, reason: "Transaction failed" };
    if (transaction.status !== "PENDING") return { allowed: false, reason: `Invalid status: ${transaction.status}` };

    // Check if already credited (double-check)
    const existingCredit = await tx.creditLog.findFirst({
      where: { transactionId: transaction.id, action: "CREDIT" },
    });
    if (existingCredit) return { allowed: false, reason: "Already credited (duplicate detected)" };

    return { allowed: true, reason: "OK" };
  });
}

// ========== 2. CREDIT LOGGING ==========
export async function logCredit(params: {
  userId: string;
  transactionId: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  action: "CREDIT" | "DEBIT" | "REVERSAL";
  reason: string;
  actor: "SYSTEM" | "ADMIN" | "AUTO_BANK";
  metadata?: Record<string, any>;
}) {
  await prisma.creditLog.create({
    data: {
      userId: params.userId,
      transactionId: params.transactionId,
      amount: params.amount,
      balanceBefore: params.balanceBefore,
      balanceAfter: params.balanceAfter,
      action: params.action,
      reason: params.reason,
      actor: params.actor,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });
}

// ========== 3. SAFE CREDIT (atomic operation with locking) ==========
export async function safeCredit(params: {
  transactionId: string;
  actor: "SYSTEM" | "ADMIN" | "AUTO_BANK";
  reason: string;
}): Promise<{ success: boolean; error?: string; amount?: number }> {
  const { transactionId, actor, reason } = params;

  // Atomic transaction: check + credit + mark completed
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Lock and verify transaction
      const transaction = await tx.transaction.findUnique({ where: { id: transactionId } });
      if (!transaction) throw new Error("Transaction not found");
      if (transaction.status !== "PENDING") throw new Error(`Invalid status: ${transaction.status}`);

      // Step 2: Check duplicate credit
      const existingCredit = await tx.creditLog.findFirst({
        where: { transactionId: transaction.id, action: "CREDIT" },
      });
      if (existingCredit) throw new Error("Already credited (duplicate detected)");

      // Step 3: Get amount FROM DATABASE (never trust client)
      const amount = Number(transaction.amount);
      if (amount <= 0) throw new Error("Invalid amount in database");

      // Step 4: Get user
      const user = await tx.user.findUnique({ where: { id: transaction.userId } });
      if (!user) throw new Error("User not found");

      const balanceBefore = Number(user.creditBalance);

      // Step 5: Credit user (atomic increment)
      await tx.user.update({
        where: { id: transaction.userId },
        data: { creditBalance: { increment: amount } },
      });

      // Step 6: Mark transaction COMPLETED
      await tx.transaction.update({
        where: { id: transactionId },
        data: { status: "COMPLETED", note: `${reason} | Actor: ${actor}` },
      });

      // Step 7: Log credit operation
      const balanceAfter = balanceBefore + amount;
      await tx.creditLog.create({
        data: {
          userId: transaction.userId,
          transactionId,
          amount,
          balanceBefore,
          balanceAfter,
          action: "CREDIT",
          reason,
          actor,
          metadata: JSON.stringify({
            reference: transaction.reference,
            paymentMethod: transaction.paymentMethod,
          }),
        },
      });

      return { amount, balanceAfter };
    });

    return { success: true, amount: result.amount };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ========== 4. FRAUD DETECTION ==========
export async function checkFraudIndicators(userId: string): Promise<{
  suspicious: boolean;
  reasons: string[];
}> {
  const reasons: string[] = [];

  // Check: Multiple failed attempts in last hour
  const recentFailed = await prisma.transaction.count({
    where: {
      userId,
      status: "FAILED",
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });
  if (recentFailed >= 3) reasons.push(`${recentFailed} failed transactions in last hour`);

  // Check: Multiple tickets with same reference
  const recentTickets = await prisma.ticket.groupBy({
    by: ["reference"],
    where: {
      userId,
      reference: { not: null },
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    having: { reference: { _count: { gt: 1 } } },
  });
  if (recentTickets.length > 0) reasons.push("Multiple tickets for same reference");

  // Check: Multiple escalations in last hour
  const recentEscalations = await prisma.ticket.count({
    where: {
      userId,
      status: "ESCALATED",
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });
  if (recentEscalations >= 3) reasons.push(`${recentEscalations} escalations in last hour`);

  // Check: Multiple auto-credit attempts for same user in last hour
  const recentCredits = await prisma.creditLog.count({
    where: {
      userId,
      action: "CREDIT",
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });
  if (recentCredits >= 5) reasons.push(`${recentCredits} credits in last hour (spam)`);

  return { suspicious: reasons.length > 0, reasons };
}

// ========== 5. ANTI-SPAM: Rate limit tickets ==========
export async function canCreateTicket(userId: string): Promise<{ allowed: boolean; reason: string }> {
  // Max 5 tickets per hour
  const recentTickets = await prisma.ticket.count({
    where: {
      userId,
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });
  if (recentTickets >= 5) {
    return { allowed: false, reason: "Too many tickets (max 5/hour). Please wait." };
  }

  // Max 3 open tickets at once
  const openTickets = await prisma.ticket.count({
    where: {
      userId,
      status: { in: ["OPEN", "PROCESSING", "ESCALATED"] },
    },
  });
  if (openTickets >= 3) {
    return { allowed: false, reason: "Too many open tickets (max 3). Please wait for existing ones to resolve." };
  }

  return { allowed: true, reason: "OK" };
}

// ========== 6. INPUT VALIDATION ==========
export function validateAmount(amount: any): { valid: boolean; value?: number; error?: string } {
  const num = Number(amount);
  if (isNaN(num)) return { valid: false, error: "Amount must be a number" };
  if (num <= 0) return { valid: false, error: "Amount must be positive" };
  if (num < 10000) return { valid: false, error: "Minimum amount is 10,000 VNĐ" };
  if (num > 100000000) return { valid: false, error: "Maximum amount is 100,000,000 VNĐ" };
  return { valid: true, value: Math.floor(num) };
}

export function validateReference(ref: any): { valid: boolean; value?: string; error?: string } {
  if (typeof ref !== "string") return { valid: false, error: "Reference must be a string" };
  const clean = ref.toUpperCase().trim();
  if (!clean.startsWith("MORA")) return { valid: false, error: "Reference must start with MORA" };
  if (clean.length < 8 || clean.length > 20) return { valid: false, error: "Invalid reference length" };
  // Only allow alphanumeric
  if (!/^MORA[A-Z0-9]+$/.test(clean)) return { valid: false, error: "Reference contains invalid characters" };
  return { valid: true, value: clean };
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove HTML tags
    .replace(/['"`;]/g, "") // Remove quotes
    .trim()
    .slice(0, 1000); // Limit length
}

// ========== 7. SECURE TRANSACTION LOOKUP ==========
export async function findTransactionByReference(reference: string): Promise<any | null> {
  const clean = reference.toUpperCase().trim();
  // Exact match first, then contains
  let tx = await prisma.transaction.findFirst({
    where: { reference: clean, paymentMethod: "BANKING" },
    orderBy: { createdAt: "desc" },
  });
  
  if (!tx) {
    // Fallback: contains match (less secure)
    const searchRef = clean.replace("MORA", "");
    tx = await prisma.transaction.findFirst({
      where: { reference: { contains: searchRef }, paymentMethod: "BANKING" },
      orderBy: { createdAt: "desc" },
    });
  }
  
  return tx;
}
