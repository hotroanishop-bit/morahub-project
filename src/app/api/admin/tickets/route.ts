import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: true, messages: true },
      take: 100,
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Admin tickets error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
