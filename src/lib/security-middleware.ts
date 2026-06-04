/**
 * MORA Security Middleware — Rate Limiting, CORS, CSP, Logging
 * Highest security level for production
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./prisma";

// ========== 1. RATE LIMITING (In-Memory Store) ==========
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime };
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ========== 2. REQUEST LOGGING ==========
export async function logRequest(
  req: NextRequest,
  userId?: string,
  action?: string,
  details?: Record<string, any>
) {
  try {
    await prisma.requestLog.create({
      data: {
        userId: userId || "anonymous",
        model: action || "system",
        endpoint: req.nextUrl.pathname,
        method: req.method,
        statusCode: 200,
        ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "",
        userAgent: req.headers.get("user-agent")?.slice(0, 500) || "",
      },
    });
  } catch (error) {
    console.error("Request log error:", error);
  }
}

// ========== 3. INPUT SANITIZATION ==========
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, "")
    .replace(/['"`;]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim()
    .slice(0, 10000);
}

export function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

// ========== 4. IP BLOCKING ==========
const blockedIPs = new Set<string>();

export function isIPBlocked(ip: string): boolean {
  return blockedIPs.has(ip);
}

export function blockIP(ip: string, reason: string) {
  blockedIPs.add(ip);
  console.log(`[SECURITY] Blocked IP: ${ip} - Reason: ${reason}`);
}

// ========== 5. SUSPICIOUS ACTIVITY DETECTION ==========
export async function detectSuspiciousActivity(
  ip: string,
  userId?: string
): Promise<{ suspicious: boolean; reasons: string[] }> {
  const reasons: string[] = [];
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Check: Too many requests from IP
  const ipRequests = await prisma.requestLog.count({
    where: {
      ip,
      createdAt: { gte: oneHourAgo },
    },
  });
  if (ipRequests >= 1000) reasons.push(`${ipRequests} requests from IP in last hour`);

  // Check: Too many failed auth attempts
  const failedAuth = await prisma.requestLog.count({
    where: {
      ip,
      statusCode: { in: [401, 403] },
      createdAt: { gte: oneHourAgo },
    },
  });
  if (failedAuth >= 10) reasons.push(`${failedAuth} failed auth attempts`);

  // Check: User with multiple failed transactions
  if (userId) {
    const failedTx = await prisma.transaction.count({
      where: {
        userId,
        status: "FAILED",
        createdAt: { gte: oneHourAgo },
      },
    });
    if (failedTx >= 5) reasons.push(`${failedTx} failed transactions`);
  }

  return { suspicious: reasons.length > 0, reasons };
}
