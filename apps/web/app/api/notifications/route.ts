import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/notifications — last 10 InboxEvents for the user + unread count
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [events, unread] = await Promise.all([
    prisma.inboxEvent.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.inboxEvent.count({
      where: { userId: session.userId, isRead: false },
    }),
  ]);

  const now = new Date();

  function timeAgo(date: Date): string {
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "עכשיו";
    if (minutes < 60) return `לפני ${minutes} דקות`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `לפני ${hours} שעות`;
    const days = Math.floor(hours / 24);
    return `לפני ${days} ימים`;
  }

  const notifications = events.map((e) => ({
    id: e.id,
    type: e.type,
    title: e.title,
    description: e.description ?? "",
    isRead: e.isRead,
    createdAt: e.createdAt.toISOString(),
    timeAgo: timeAgo(e.createdAt),
  }));

  return NextResponse.json({ notifications, unread });
}

// PATCH /api/notifications — mark all as read
export async function PATCH() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.inboxEvent.updateMany({
    where: { userId: session.userId, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}
