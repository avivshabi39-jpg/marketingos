import { NextRequest, NextResponse } from "next/server";
import { getSession, isSuperAdmin } from "@/lib/auth";
import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";

// Verify the caller has access to this client's notifications
async function verifyAccess(params: { id: string }) {
  const session = await getSession();
  const cs = !session ? await getClientSession() : null;
  if (!session && !cs) return { error: "Unauthorized", status: 401 } as const;

  // Client portal: must match their own clientId
  if (cs) {
    if (cs.clientId !== params.id) return { error: "Forbidden", status: 403 } as const;
    return { ok: true } as const;
  }

  // Admin: super-admin can access any, others must own the client
  if (session && !isSuperAdmin(session)) {
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      select: { ownerId: true },
    });
    if (!client || client.ownerId !== session.userId) {
      return { error: "Forbidden", status: 403 } as const;
    }
  }

  return { ok: true } as const;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await verifyAccess(params);
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { clientId: params.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notification.count({ where: { clientId: params.id, read: false } }),
  ]);

  return NextResponse.json(
    { notifications, unreadCount },
    { headers: { "Cache-Control": "private, s-maxage=10, stale-while-revalidate=30" } }
  );
}

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await verifyAccess(params);
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  await prisma.notification.updateMany({
    where: { clientId: params.id, read: false },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
