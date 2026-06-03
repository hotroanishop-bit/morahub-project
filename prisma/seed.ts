import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ======================== PLANS ========================
  const plans = await Promise.all([
    prisma.plan.upsert({
      where: { name: "free" },
      update: {},
      create: {
        name: "free",
        displayName: "Miễn Phí",
        description: "Dùng thử, không ràng buộc",
        price: 0,
        credits: 10000,
        rateLimit: 10,
        maxKeys: 3,
        maxTokens: 2048,
        features: JSON.stringify(["Tất cả model cơ bản", "Rate limit 10 req/min", "10K credits/tháng"]),
        sortOrder: 0,
      },
    }),
    prisma.plan.upsert({
      where: { name: "basic" },
      update: {},
      create: {
        name: "basic",
        displayName: "Cơ Bản",
        description: "Dành cho developer cá nhân",
        price: 250000,
        credits: 100000,
        rateLimit: 30,
        maxKeys: 5,
        maxTokens: 4096,
        features: JSON.stringify(["Tất cả model", "Rate limit 30 req/min", "100K credits/tháng", "Hỗ trợ email"]),
        sortOrder: 1,
      },
    }),
    prisma.plan.upsert({
      where: { name: "pro" },
      update: {},
      create: {
        name: "pro",
        displayName: "Chuyên Nghiệp",
        description: "Dành cho team & startup",
        price: 1000000,
        credits: 500000,
        rateLimit: 100,
        maxKeys: 20,
        maxTokens: 8192,
        features: JSON.stringify(["Tất cả model", "Rate limit 100 req/min", "500K credits/tháng", "Hỗ trợ ưu tiên", "Streaming"]),
        sortOrder: 2,
      },
    }),
    prisma.plan.upsert({
      where: { name: "enterprise" },
      update: {},
      create: {
        name: "enterprise",
        displayName: "Doanh Nghiệp",
        description: "Giải pháp tùy chỉnh",
        price: 0,
        credits: 999999999,
        rateLimit: 999,
        maxKeys: 999,
        maxTokens: 32768,
        features: JSON.stringify(["Tất cả model", "Unlimited", "Dedicated support", "Custom SLA"]),
        sortOrder: 3,
      },
    }),
  ]);
  console.log(`✅ ${plans.length} plans created`);

  // ======================== MODELS ========================
  const models = await Promise.all([
    prisma.aiModel.upsert({ where: { name: "gpt-4o" }, update: {}, create: { name: "gpt-4o", displayName: "GPT-4o", provider: "OPENAI", pricePer1kIn: 0.0025, pricePer1kOut: 0.01, maxTokens: 16384, contextWindow: 128000, description: "Model mạnh nhất của OpenAI" } }),
    prisma.aiModel.upsert({ where: { name: "gpt-4o-mini" }, update: {}, create: { name: "gpt-4o-mini", displayName: "GPT-4o Mini", provider: "OPENAI", pricePer1kIn: 0.00015, pricePer1kOut: 0.0006, maxTokens: 16384, contextWindow: 128000, description: "Nhanh & rẻ" } }),
    prisma.aiModel.upsert({ where: { name: "claude-3.5-sonnet" }, update: {}, create: { name: "claude-3.5-sonnet", displayName: "Claude 3.5 Sonnet", provider: "ANTHROPIC", pricePer1kIn: 0.003, pricePer1kOut: 0.015, maxTokens: 8192, contextWindow: 200000, description: "Tốt nhất cho coding" } }),
    prisma.aiModel.upsert({ where: { name: "claude-3-haiku" }, update: {}, create: { name: "claude-3-haiku", displayName: "Claude 3 Haiku", provider: "ANTHROPIC", pricePer1kIn: 0.00025, pricePer1kOut: 0.00125, maxTokens: 4096, contextWindow: 200000, description: "Nhanh & rẻ" } }),
    prisma.aiModel.upsert({ where: { name: "gemini-pro" }, update: {}, create: { name: "gemini-pro", displayName: "Gemini Pro", provider: "GOOGLE", pricePer1kIn: 0.000125, pricePer1kOut: 0.000375, maxTokens: 8192, contextWindow: 32000, description: "Model của Google" } }),
    prisma.aiModel.upsert({ where: { name: "deepseek-chat" }, update: {}, create: { name: "deepseek-chat", displayName: "DeepSeek Chat", provider: "DEEPSEEK", pricePer1kIn: 0.00014, pricePer1kOut: 0.00028, maxTokens: 4096, contextWindow: 64000, description: "Rẻ & tốt" } }),
    prisma.aiModel.upsert({ where: { name: "mistral-large" }, update: {}, create: { name: "mistral-large", displayName: "Mistral Large", provider: "MISTRAL", pricePer1kIn: 0.002, pricePer1kOut: 0.006, maxTokens: 4096, contextWindow: 32000, description: "Model của Mistral AI" } }),
    prisma.aiModel.upsert({ where: { name: "qwen-max" }, update: {}, create: { name: "qwen-max", displayName: "Qwen Max", provider: "ALIBABA", pricePer1kIn: 0.0016, pricePer1kOut: 0.0064, maxTokens: 8192, contextWindow: 32000, description: "Model của Alibaba" } }),
    prisma.aiModel.upsert({ where: { name: "glm-4" }, update: {}, create: { name: "glm-4", displayName: "GLM-4", provider: "ZHIPU", pricePer1kIn: 0.0007, pricePer1kOut: 0.0007, maxTokens: 4096, contextWindow: 128000, description: "Model của Zhipu AI" } }),
    prisma.aiModel.upsert({ where: { name: "grok-2" }, update: {}, create: { name: "grok-2", displayName: "Grok-2", provider: "XAI", pricePer1kIn: 0.002, pricePer1kOut: 0.01, maxTokens: 4096, contextWindow: 128000, description: "Model của xAI" } }),
  ]);
  console.log(`✅ ${models.length} models created`);

  // ======================== ADMIN USER ========================
  const adminPass = await hashPassword("admin123");
  const admin = await prisma.user.upsert({
    where: { email: "admin@morahub.com" },
    update: {},
    create: {
      email: "admin@morahub.com",
      name: "Admin",
      password: adminPass,
      creditBalance: 999999,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // ======================== TEST USER ========================
  const userPass = await hashPassword("user1234");
  const testUser = await prisma.user.upsert({
    where: { email: "user@morahub.com" },
    update: {},
    create: {
      email: "user@morahub.com",
      name: "Test User",
      password: userPass,
      creditBalance: 10000,
      role: "USER",
      status: "ACTIVE",
    },
  });
  console.log(`✅ Test user: ${testUser.email}`);

  // ======================== ADMIN NOTIFICATION ========================
  await prisma.userNotification.create({
    data: {
      userId: admin.id,
      title: "Chào mừng đến MoraHub! 🎉",
      message: "Bạn đã đăng nhập thành công với tư cách Administrator. Quản lý hệ thống tại trang Quản Trị.",
      type: "success",
    },
  });
  console.log(`✅ Admin notification created`);

  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
