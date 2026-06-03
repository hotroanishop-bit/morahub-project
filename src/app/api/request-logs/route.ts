import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const model = searchParams.get("model");
  const status = searchParams.get("status");
  const skip = (page - 1) * limit;

  const where: any = { userId: (session.user as any).id };
  if (model) where.model = model;
  if (status) where.status = status;

  const [logs, total] = await Promise.all([
    prisma.requestLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true, model: true, endpoint: true, statusCode: true,
        latency: true, tokensIn: true, tokensOut: true, cost: true,
        ip: true, createdAt: true,
      },
    }),
    prisma.requestLog.count({ where }),
  ]);

  return NextResponse.json({
    logs,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}
