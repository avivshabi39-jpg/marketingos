import { prisma } from "@/lib/prisma";

export async function audit(
  action: string,
  opts: {
    userId?: string | null;
    entityId?: string;
    meta?: Record<string, unknown>;
  } = {}
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entityId: opts.entityId,
        userId:   opts.userId ?? null,
        meta:     opts.meta ? (opts.meta as object) : undefined,
      },
    });
  } catch {
    // Audit logging is non-fatal — never crash the request
  }
}
