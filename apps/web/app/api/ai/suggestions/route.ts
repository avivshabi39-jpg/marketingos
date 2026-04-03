import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";

// GET /api/ai/suggestions?clientId=xxx
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = new URL(req.url).searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ suggestions: [] });

  if (!isSuperAdmin(session)) {
    const client = await prisma.client.findUnique({ where: { id: clientId }, select: { ownerId: true } });
    if (client?.ownerId !== session.userId) return NextResponse.json({ suggestions: [] });
  }

  const suggestions = await prisma.aiSuggestion.findMany({
    where: { clientId, isRead: false },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return NextResponse.json({ suggestions });
}

// PATCH /api/ai/suggestions — mark all as read for a client
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await req.json().catch(() => ({})) as { clientId?: string };
  if (!clientId) return NextResponse.json({ ok: false });

  await prisma.aiSuggestion.updateMany({
    where: { clientId, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}
