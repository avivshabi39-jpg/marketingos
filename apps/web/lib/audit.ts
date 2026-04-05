import { prisma } from "@/lib/prisma";

export async function audit(
  action: string,
  opts: {
    userId?: string | null;
    entityId?: string;
    meta?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    success?: boolean;
  } = {}
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entityId: opts.entityId,
        userId: opts.userId ?? null,
        meta: opts.meta ? (opts.meta as object) : undefined,
        ipAddress: opts.ipAddress,
        userAgent: opts.userAgent?.slice(0, 200),
        success: opts.success ?? true,
      },
    });
  } catch {
    // Audit logging is non-fatal — never crash the request
  }
}

/** Extract IP and User-Agent from a request for audit logging. */
export function auditInfo(req: Request) {
  return {
    ipAddress:
      (req.headers as Headers).get("x-forwarded-for")?.split(",")[0]?.trim() ||
      (req.headers as Headers).get("x-real-ip") ||
      "unknown",
    userAgent: (req.headers as Headers).get("user-agent") || "unknown",
  };
}
