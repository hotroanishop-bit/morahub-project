import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashApiKey } from "@/lib/utils";

async function authenticateApiKey(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const key = authHeader.slice(7);
  if (!key.startsWith("mh-")) return null;

  const hashed = hashApiKey(key);

  const apiKey = await prisma.apiKey.findUnique({
    where: { key: hashed, isActive: true },
    include: { user: true },
  });

  if (!apiKey) return null;

  // Update last used
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return { apiKey, user: apiKey.user };
}

export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (!auth) {
    return NextResponse.json(
      { error: { message: "Invalid API key", type: "authentication_error" } },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  const [logs, total] = await Promise.all([
    prisma.usageLog.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        model: { select: { name: true, displayName: true, provider: true } },
      },
    }),
    prisma.usageLog.count({ where: { userId: auth.user.id } }),
  ]);

  return NextResponse.json({
    object: "list",
    total,
    limit,
    offset,
    data: logs.map((log) => ({
      id: log.id,
      model: log.model.name,
      model_display: log.model.displayName,
      provider: log.model.provider,
      tokens_in: log.tokensIn,
      tokens_out: log.tokensOut,
      cost: Number(log.cost),
      created_at: log.createdAt.toISOString(),
    })),
  });
}
