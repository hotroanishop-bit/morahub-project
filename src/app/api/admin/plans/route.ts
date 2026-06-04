import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const plans = await prisma.plan.findMany({ orderBy: { price: "asc" } });
    return NextResponse.json({ plans });
  } catch (error) { return NextResponse.json({ error: "Lỗi server" }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { name, price, credits, rateLimit, maxKeys } = await req.json();
    await prisma.plan.create({ data: { name, displayName: name, price: parseFloat(price), credits: parseInt(credits), rateLimit: parseInt(rateLimit), maxKeys: parseInt(maxKeys) } });
    return NextResponse.json({ success: true });
  } catch (error) { return NextResponse.json({ error: "Lỗi server" }, { status: 500 }); }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id, name, price, credits, rateLimit, maxKeys } = await req.json();
    await prisma.plan.update({ where: { id }, data: { name, price: parseFloat(price), credits: parseInt(credits), rateLimit: parseInt(rateLimit), maxKeys: parseInt(maxKeys) } });
    return NextResponse.json({ success: true });
  } catch (error) { return NextResponse.json({ error: "Lỗi server" }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await req.json();
    await prisma.plan.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) { return NextResponse.json({ error: "Lỗi server" }, { status: 500 }); }
}
