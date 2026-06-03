import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!apiKey) return NextResponse.json({ error: "API key required" }, { status: 401 });

    const dbKey = await prisma.apiKey.findFirst({ where: { key: apiKey, isActive: true } });
    if (!dbKey) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

    const models = await prisma.aiModel.findMany({ where: { isActive: true } });
    return NextResponse.json({
      object: "list",
      data: models.map((m) => ({ id: m.name, object: "model", created: Math.floor(new Date(m.createdAt).getTime() / 1000), owned_by: "morahub" })),
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
