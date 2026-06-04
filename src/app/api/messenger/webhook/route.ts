import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMessengerConfig, sendMessengerMessage } from "@/lib/messenger-bot";

// GET — Verify webhook (Facebook sends this to verify)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const config = await getMessengerConfig();

  if (mode === "subscribe" && token === config.verifyToken) {
    console.log("[MESSENGER] Webhook verified");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// POST — Receive messages from Messenger
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.object !== "page") {
      return NextResponse.json({ status: "not_page" });
    }

    // Process each entry
    for (const entry of body.entry || []) {
      for (const event of entry.messaging || []) {
        const senderId = event.sender?.id;
        const messageText = event.message?.text;

        if (!senderId) continue;

        // Handle different event types
        if (event.message) {
          // Text message
          await handleMessage(senderId, messageText || "");
        } else if (event.postback) {
          // Postback (button click)
          await handlePostback(senderId, event.postback.payload);
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[MESSENGER] Webhook error:", error);
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}

// Handle incoming message
async function handleMessage(senderId: string, text: string) {
  const lowerText = text.toLowerCase().trim();

  // Check if user exists with this messenger ID
  const user = await prisma.user.findFirst({
    where: { messengerId: senderId },
  });

  if (!user) {
    // New user — send welcome + link instructions
    await sendMessengerMessage(senderId,
      "👋 Chào mừng đến MoraHub!\n\n" +
      "Để sử dụng bot, vui lòng:\n" +
      "1. Đăng nhập tại morahub.online\n" +
      "2. Vào Settings → Liên kết Messenger\n" +
      "3. Nhập mã xác thực\n\n" +
      "Sau khi linked, bạn sẽ nhận được thông báo nạp tiền, ticket, và nhiều hơn nữa!"
    );
    return;
  }

  // Command handling
  if (lowerText === "/balance" || lowerText === "số dư") {
    const balance = Number(user.creditBalance).toLocaleString("vi-VN");
    await sendMessengerMessage(senderId, `💰 Số dư hiện tại: ${balance}đ`);
  } else if (lowerText === "/help" || lowerText === "help") {
    await sendMessengerMessage(senderId,
      "📖 Hướng dẫn sử dụng:\n\n" +
      "💰 /balance — Xem số dư\n" +
      "📊 /usage — Xem lượt gọi API\n" +
      "🔑 /key — Quản lý API key\n" +
      "🎫 /ticket — Tạo ticket hỗ trợ\n" +
      "ℹ️ /help — Xem hướng dẫn\n\n" +
      "🌐 Dashboard: morahub.online/dashboard"
    );
  } else if (lowerText === "/usage" || lowerText === "usage") {
    // Get current month usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usage = await prisma.usageLog.aggregate({
      where: { userId: user.id, createdAt: { gte: startOfMonth } },
      _sum: { tokensIn: true, tokensOut: true, cost: true },
      _count: true,
    });

    await sendMessengerMessage(senderId,
      `📊 Lượt gọi tháng này:\n\n` +
      `Tổng calls: ${usage._count}\n` +
      `Tokens in: ${Number(usage._sum.tokensIn || 0).toLocaleString()}\n` +
      `Tokens out: ${Number(usage._sum.tokensOut || 0).toLocaleString()}\n` +
      `Chi phí: ${Number(usage._sum.cost || 0).toLocaleString("vi-VN")}đ`
    );
  } else if (lowerText === "/key" || lowerText === "key") {
    const keys = await prisma.apiKey.findMany({
      where: { userId: user.id, isActive: true },
      select: { name: true, isActive: true },
    });

    if (keys.length === 0) {
      await sendMessengerMessage(senderId, "🔑 Bạn chưa có API key nào.\nTạo tại: morahub.online/dashboard/api-keys");
    } else {
      const keyList = keys.map(k => `• ${k.name}`).join("\n");
      await sendMessengerMessage(senderId, `🔑 API Keys của bạn:\n\n${keyList}\n\nQuản lý tại: morahub.online/dashboard/api-keys`);
    }
  } else {
    // Default reply
    await sendMessengerMessage(senderId,
      "🤖 MoraHub Bot\n\n" +
      "Nhập /help để xem hướng dẫn sử dụng."
    );
  }
}

// Handle postback (button clicks)
async function handlePostback(senderId: string, payload: string) {
  if (payload === "GET_STARTED") {
    await sendMessengerMessage(senderId,
      "🎉 Chào mừng đến MoraHub!\n\n" +
      "Nền tảng AI API hàng đầu Việt Nam.\n\n" +
      "Nhập /help để bắt đầu!"
    );
  }
}
