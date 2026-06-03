import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const models = await prisma.aiModel.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(models.map((m) => ({
      ...m,
      pricePer1kIn: String(m.pricePer1kIn),
      pricePer1kOut: String(m.pricePer1kOut),
    })));
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
