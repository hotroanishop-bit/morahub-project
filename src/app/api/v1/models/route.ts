import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const models = await prisma.aiModel.findMany({
    where: { isActive: true },
    orderBy: { provider: "asc" },
    select: {
      id: true,
      name: true,
      displayName: true,
      provider: true,
      pricePer1kIn: true,
      maxTokens: true,
      contextWindow: true,
    },
  });

  return NextResponse.json({
    object: "list",
    data: models.map((m) => ({
      id: m.name,
      object: "model",
      created: 1700000000,
      owned_by: m.provider.toLowerCase(),
      display_name: m.displayName,
      pricing: {
        prompt: Number(m.pricePer1kIn),
        completion: Number(m.pricePer1kIn),
        unit: "per_1k_tokens",
      },
      context_window: m.contextWindow,
      max_tokens: m.maxTokens,
    })),
  });
}
