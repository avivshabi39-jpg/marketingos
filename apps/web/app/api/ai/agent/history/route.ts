import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";
import { getClientSession } from "@/lib/clientAuth";

export async function GET(req: NextRequest) {
  const adminSession = await getSession();
  const clientPortal = adminSession ? null : await getClientSession();
  if (!adminSession && !clientPortal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = new URL(req.url).searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ messages: [] });

  // Ownership check
  if (adminSession && !isSuperAdmin(adminSession)) {
    const client = await prisma.client.findUnique({ where: { id: clientId }, select: { ownerId: true } });
    if (client?.ownerId !== adminSession.userId) return NextResponse.json({ messages: [] });
  }
  if (clientPortal && clientPortal.clientId !== clientId) return NextResponse.json({ messages: [] });

  const rows = await prisma.aiConversation.findMany({
    where: { clientId },
    orderBy: { createdAt: "asc" },
    take: 50,
    select: { role: true, content: true, action: true },
  });

  return NextResponse.json({ messages: rows });
}
