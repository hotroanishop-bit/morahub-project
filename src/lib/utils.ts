import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from "crypto";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateApiKey(): { raw: string; hashed: string } {
  const key = "mh-" + crypto.randomBytes(32).toString("hex");
  const hashed = crypto.createHash("sha256").update(key).digest("hex");
  return { raw: key, hashed };
}

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export function formatCredits(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(2);
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

export function calculateCost(
  tokensIn: number,
  tokensOut: number,
  pricePer1k: number
): number {
  return (tokensIn + tokensOut) * pricePer1k / 1000;
}
