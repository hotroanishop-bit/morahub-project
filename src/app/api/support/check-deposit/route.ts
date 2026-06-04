import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { findTransactionByReference } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { reference, dbOnly } = await req.json();
    if (!reference) return NextResponse.json({ error: "Missing reference" }, { status: 400 });

    // Secure transaction lookup
    const tx = await findTransactionByReference(reference);

    if (tx) {
      return NextResponse.json({
        found: true,
        status: tx.status,
        amount: Number(tx.amount),
        reference: tx.reference,
        source: "database",
      });
    }

    return NextResponse.json({ found: false, source: "database" });
  } catch (error) {
    console.error("Support check error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
