import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ControlTowerView } from "@/components/admin/ControlTowerView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "מרכז בקרה | MarketingOS",
  description: "סקירה כללית של הלקוחות, הלידים וביצועי המערכת",
};

export default async function DashboardPage() {
  const session = await getSession();

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Scope: SUPER_ADMIN sees all, others see their own clients
  const isSuperAdmin = session?.role === "SUPER_ADMIN";
  const clientWhere = isSuperAdmin
    ? { isActive: true }
    : session?.userId
    ? { isActive: true, ownerId: session.userId }
    : { isActive: true, id: "" }; // safety: no userId → no results

  // Fetch clients with per-client lead stats
  const rawClients = await prisma.client.findMany({
    where: clientWhere,
    select: {
      id: true,
      name: true,
      slug: true,
      primaryColor: true,
      industry: true,
      isActive: true,
      pagePublished: true,
      createdAt: true,
      _count: { select: { leads: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const ownedClientIds = rawClients.map((c) => c.id);
  const leadWhere = ownedClientIds.length > 0
    ? { clientId: { in: ownedClientIds } }
    : { clientId: "" };

  // Parallel queries for KPIs and per-client 7d leads
  const [totalLeadsToday, totalLeads7d, broadcastCount, clientLeadCounts] = await Promise.all([
    prisma.lead.count({ where: { ...leadWhere, createdAt: { gte: oneDayAgo } } }),
    prisma.lead.count({ where: { ...leadWhere, createdAt: { gte: sevenDaysAgo } } }),
    prisma.broadcastLog.count({ where: { clientId: { in: ownedClientIds } } }).catch(() => 0),
    // Per-client: leads in 7d + won leads (batched)
    Promise.all(
      rawClients.map(async (c) => {
        const [leads7d, wonLeads] = await Promise.all([
          prisma.lead.count({ where: { clientId: c.id, createdAt: { gte: sevenDaysAgo } } }),
          prisma.lead.count({ where: { clientId: c.id, status: "WON" } }),
        ]);
        return { id: c.id, leads7d, wonLeads };
      })
    ),
  ]);

  // Merge per-client stats
  const leadMap = new Map(clientLeadCounts.map((l) => [l.id, l]));
  const clients = rawClients.map(({ _count, ...c }) => ({
    ...c,
    totalLeads: _count.leads,
    leads7d: leadMap.get(c.id)?.leads7d ?? 0,
    wonLeads: leadMap.get(c.id)?.wonLeads ?? 0,
  }));

  const publishedCount = clients.filter((c) => c.pagePublished).length;
  const userName = session?.email?.split("@")[0] ?? "Admin";

  return (
    <ControlTowerView
      userName={userName}
      clients={clients}
      totalClients={clients.length}
      totalLeadsToday={totalLeadsToday}
      totalLeads7d={totalLeads7d}
      publishedCount={publishedCount}
      broadcastCount={broadcastCount}
    />
  );
}
