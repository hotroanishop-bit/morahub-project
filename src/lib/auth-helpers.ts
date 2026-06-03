import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Helper: get current user from NextAuth session
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user) return null;
  const userId = (session.user as any).id;
  return await prisma.user.findUnique({ where: { id: userId } });
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}
