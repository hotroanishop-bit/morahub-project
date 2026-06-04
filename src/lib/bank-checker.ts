/**
 * MB Bank Auto-Deposit Checker
 * NOTE: mbbank library removed due to sharp dependency issues on VPS
 * Auto-deposit currently handled via Telegram bot manual flow
 * TODO: Implement using bank API webhook when available
 */

import { prisma } from "./prisma";
import { sendTelegramMessage } from "./telegram-bot";

// Placeholder for future bank API integration
export async function checkDeposits() {
  // Not implemented - using manual flow via Telegram bot
  return;
}
