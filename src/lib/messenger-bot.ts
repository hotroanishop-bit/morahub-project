import { prisma } from "@/lib/prisma";

// Messenger Bot Configuration
// Ani needs to set these in .env or admin settings:
// - MESSENGER_PAGE_ACCESS_TOKEN
// - MESSENGER_VERIFY_TOKEN
// - MESSENGER_APP_SECRET

export async function getMessengerConfig() {
  const settings = await prisma.siteSettings.findFirst();
  return {
    pageAccessToken: process.env.MESSENGER_PAGE_ACCESS_TOKEN || (settings as any)?.messengerPageToken || "",
    verifyToken: process.env.MESSENGER_VERIFY_TOKEN || "morahub_verify_2024",
    appSecret: process.env.MESSENGER_APP_SECRET || "",
  };
}

// Send message to a single user
export async function sendMessengerMessage(recipientId: string, message: string) {
  const config = await getMessengerConfig();
  if (!config.pageAccessToken) {
    console.error("[MESSENGER] No page access token configured");
    return false;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${config.pageAccessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: message },
        }),
      }
    );

    const data = await response.json();
    if (data.error) {
      console.error("[MESSENGER] Send error:", data.error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[MESSENGER] Send failed:", error);
    return false;
  }
}

// Broadcast message to all linked Messenger users
export async function broadcastMessenger(message: string) {
  const users = await prisma.user.findMany({
    where: {
      messengerId: { not: null },
      messengerVerified: true,
      status: "ACTIVE",
    },
    select: { messengerId: true, name: true },
  });

  let sent = 0;
  let failed = 0;

  for (const user of users) {
    if (!user.messengerId) continue;
    
    const success = await sendMessengerMessage(user.messengerId, message);
    if (success) sent++;
    else failed++;

    // Rate limit: 20 messages per second
    await new Promise(r => setTimeout(r, 50));
  }

  console.log(`[MESSENGER] Broadcast: ${sent} sent, ${failed} failed, ${users.length} total`);
  return { sent, failed, total: users.length };
}

// Send template message (for structured messages)
export async function sendMessengerTemplate(recipientId: string, template: any) {
  const config = await getMessengerConfig();
  if (!config.pageAccessToken) return false;

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${config.pageAccessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: template,
        }),
      }
    );

    const data = await response.json();
    return !data.error;
  } catch (error) {
    return false;
  }
}
