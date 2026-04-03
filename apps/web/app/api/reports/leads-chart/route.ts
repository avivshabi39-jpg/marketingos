import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";
import { getClientSession } from "@/lib/clientAuth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const days = Math.min(90, Math.max(7, parseInt(searchParams.get("days") ?? "30", 10)));

  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400 });
  }

  // Auth: admin session or client portal session
  const [adminSession, clientSession] = await Promise.all([
    getSession(),
    getClientSession(),
  ]);

  if (!adminSession && !clientSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership
  if (adminSession && !isSuperAdmin(adminSession) && adminSession.clientId !== clientId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (clientSession) {
    const client = await prisma.client.findUnique({ where: { id: clientId }, select: { slug: true } });
    if (!client || client.slug !== clientSession.slug) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Build date buckets for last N days
  const now = new Date();
  const buckets: { date: string; count: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    buckets.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }

  const since = new Date(now);
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const leads = await prisma.lead.findMany({
    where: { clientId, createdAt: { gte: since } },
    select: { createdAt: true },
  });

  for (const lead of leads) {
    const dateStr = lead.createdAt.toISOString().slice(0, 10);
    const bucket = buckets.find((b) => b.date === dateStr);
    if (bucket) bucket.count++;
  }

  return NextResponse.json({ data: buckets });
}
