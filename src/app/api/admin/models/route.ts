import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// GET all models (admin only)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const models = await prisma.aiModel.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ models });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST create model (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, displayName, provider, pricePer1kIn, pricePer1kOut, maxTokens, contextWindow, description } = await req.json();
    if (!name || !displayName || !provider) {
      return NextResponse.json({ error: "name, displayName, provider required" }, { status: 400 });
    }

    const model = await prisma.aiModel.create({
      data: { name, displayName, provider, pricePer1kIn: pricePer1kIn || 0, pricePer1kOut: pricePer1kOut || 0, maxTokens: maxTokens || 4096, contextWindow: contextWindow || 128000, description },
    });

    logAudit({
      userId: (session.user as any).id,
      action: "CREATE",
      entity: "AiModel",
      entityId: model.id,
      details: { name, displayName, provider },
    });
    return NextResponse.json(model);
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ error: "Model name already exists" }, { status: 409 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH update model (admin only)
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { modelId, pricePer1kIn, pricePer1kOut, maxTokens, contextWindow, isActive, description } = await req.json();
    if (!modelId) return NextResponse.json({ error: "modelId required" }, { status: 400 });

    const data: any = {};
    if (pricePer1kIn !== undefined) data.pricePer1kIn = pricePer1kIn;
    if (pricePer1kOut !== undefined) data.pricePer1kOut = pricePer1kOut;
    if (maxTokens !== undefined) data.maxTokens = maxTokens;
    if (contextWindow !== undefined) data.contextWindow = contextWindow;
    if (isActive !== undefined) data.isActive = isActive;
    if (description !== undefined) data.description = description;

    const model = await prisma.aiModel.update({ where: { id: modelId }, data });
    return NextResponse.json(model);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE model (admin only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { modelId } = await req.json();
    if (!modelId) return NextResponse.json({ error: "modelId required" }, { status: 400 });

    await prisma.aiModel.delete({ where: { id: modelId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
