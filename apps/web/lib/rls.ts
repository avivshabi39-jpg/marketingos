import { prisma } from "@/lib/prisma";

/**
 * Verify that a client belongs to the current user.
 * Super admins (ownerId === null on client) bypass this check.
 */
export async function verifyClientOwnership(
  clientId: string,
  userId: string,
  isSuperAdmin: boolean
): Promise<boolean> {
  if (isSuperAdmin) return true;
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { ownerId: true },
  });
  return client?.ownerId === userId;
}

/**
 * Verify that a lead belongs to one of the current user's clients.
 */
export async function verifyLeadOwnership(
  leadId: string,
  userId: string,
  isSuperAdmin: boolean
): Promise<boolean> {
  if (isSuperAdmin) return true;
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { client: { select: { ownerId: true } } },
  });
  return lead?.client?.ownerId === userId;
}

/**
 * Get all client IDs owned by a user.
 * Super admins get all client IDs.
 */
export async function getOwnerClientIds(
  userId: string,
  isSuperAdmin: boolean
): Promise<string[]> {
  const where = isSuperAdmin ? {} : { ownerId: userId };
  const clients = await prisma.client.findMany({
    where,
    select: { id: true },
  });
  return clients.map((c) => c.id);
}

/**
 * Build a where clause that scopes to the current user's clients.
 * For use in findMany queries on models with clientId.
 */
export async function scopedClientWhere(
  userId: string,
  isSuperAdmin: boolean,
  extraWhere?: Record<string, unknown>
): Promise<Record<string, unknown>> {
  if (isSuperAdmin) return extraWhere ?? {};
  const clientIds = await getOwnerClientIds(userId, false);
  return {
    ...extraWhere,
    clientId: { in: clientIds },
  };
}
