import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  const cs = !session ? await getClientSession() : null;
  if (!session && !cs) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { clientId: params.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notification.count({ where: { clientId: params.id, read: false } }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  const cs = !session ? await getClientSession() : null;
  if (!session && !cs) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.notification.updateMany({
    where: { clientId: params.id, read: false },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
