import { NextResponse } from "next/server";
import { getSession, isSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SIZES = { lead: 2, appointment: 1, socialPost: 3, report: 10, campaignImage: 5, broadcastLog: 1, base: 20 };

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where = isSuperAdmin(session) ? { isActive: true } : { ownerId: session.userId };

  const clients = await prisma.client.findMany({
    where,
    select: {
      id: true, name: true, industry: true, pagePublished: true, createdAt: true,
      _count: { select: { leads: true, appointments: true, socialPosts: true, reports: true, campaignImages: true, broadcastLogs: true } },
    },
  });

  const clientStorage = clients.map((c) => {
    const ct = c._count;
    const kb = SIZES.base + ct.leads * SIZES.lead + ct.appointments * SIZES.appointment + ct.socialPosts * SIZES.socialPost + ct.reports * SIZES.report + ct.campaignImages * SIZES.campaignImage + ct.broadcastLogs * SIZES.broadcastLog;
    return { id: c.id, name: c.name, industry: c.industry, pagePublished: c.pagePublished, createdAt: c.createdAt, counts: ct, storageKB: kb, storageMB: Math.round((kb / 1024) * 100) / 100 };
  });

  const totalKB = clientStorage.reduce((s, c) => s + c.storageKB, 0);
  const FREE_MB = 512;
  const pct = Math.round(((totalKB / 1024) / FREE_MB) * 1000) / 10;

  const oldLeads = await prisma.lead.count({
    where: { client: where, status: "LOST" as const, createdAt: { lt: new Date(Date.now() - 90 * 86400000) } },
  });

  return NextResponse.json({
    clients: clientStorage.sort((a, b) => b.storageKB - a.storageKB),
    totals: { totalClients: clients.length, totalStorageKB: totalKB, totalStorageMB: Math.round((totalKB / 1024) * 100) / 100, usedPercent: pct, neonFreeLimitMB: FREE_MB, oldLeadsToClean: oldLeads },
    alerts: [
      ...(pct > 80 ? [{ level: "critical", message: `⚠️ שימוש ב-${pct}% מנפח הדיסק!` }] : []),
      ...(pct > 50 ? [{ level: "warning", message: "💡 שקול שדרוג Neon ל-Pro" }] : []),
      ...(oldLeads > 50 ? [{ level: "info", message: `🧹 יש ${oldLeads} לידים ישנים שניתן למחוק` }] : []),
    ],
  });
}
