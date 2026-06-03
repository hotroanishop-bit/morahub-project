import { prisma } from "@/lib/prisma";

interface AuditLogOptions {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, any>;
  ip?: string;
}

export async function logAudit(options: AuditLogOptions) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: options.userId || null,
        action: options.action,
        entity: options.entity,
        entityId: options.entityId || null,
        details: options.details ? JSON.stringify(options.details) : null,
        ip: options.ip || null,
      },
    });
  } catch (err) {
    console.error("Audit log error:", err);
  }
}
