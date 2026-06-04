import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const models = await prisma.aiModel.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ models });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, displayName, provider, pricePer1kIn, pricePer1kOut, contextWindow, maxTokens } = await req.json();

    await prisma.aiModel.create({
      data: {
        name,
        displayName: displayName || name,
        provider: provider || "other",
        pricePer1kIn: parseFloat(pricePer1kIn) || 0,
        pricePer1kOut: parseFloat(pricePer1kOut) || 0,
        contextWindow: parseInt(contextWindow) || 4096,
        maxTokens: parseInt(maxTokens) || 4096,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, name, displayName, provider, pricePer1kIn, pricePer1kOut, contextWindow, maxTokens } = await req.json();

    await prisma.aiModel.update({
      where: { id },
      data: {
        name,
        displayName,
        provider,
        pricePer1kIn: parseFloat(pricePer1kIn) || 0,
        pricePer1kOut: parseFloat(pricePer1kOut) || 0,
        contextWindow: parseInt(contextWindow) || 4096,
        maxTokens: parseInt(maxTokens) || 4096,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await req.json();
    await prisma.aiModel.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
