import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import DashboardView from "@/components/admin/DashboardView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "דאשבורד | MarketingOS",
  description: "סקירה כללית של הלקוחות, הלידים וביצועי הקמפיינים",
};

export default async function DashboardPage() {
  const session = await getSession();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59
  );

  // Filter by ownership: SUPER_ADMIN sees all, others see their own clients
  const isSuperAdmin = session?.role === "SUPER_ADMIN";
  const clientWhere = isSuperAdmin
    ? { isActive: true }
    : { isActive: true, ownerId: session?.userId };

  // Find all client IDs owned by this user
  const ownedClients = await prisma.client.findMany({
    where: clientWhere,
    select: { id: true },
  });
  const ownedClientIds = ownedClients.map((c) => c.id);

  // Lead filter scoped to user's clients
  const leadWhere =
    ownedClientIds.length > 0
      ? { clientId: { in: ownedClientIds } }
      : { clientId: "" };

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    clientCount,
    leadsThisMonth,
    leadsLastMonth,
    wonLeads,
    recentLeads,
    allLeads,
    todayLeads,
    newLeads7d,
  ] = await Promise.all([
    prisma.client.count({ where: clientWhere }),
    prisma.lead.count({
      where: { ...leadWhere, createdAt: { gte: startOfMonth } },
    }),
    prisma.lead.count({
      where: {
        ...leadWhere,
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
    }),
    prisma.lead.count({ where: { ...leadWhere, status: "WON" } }),
    prisma.lead.findMany({
      where: leadWhere,
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { client: { select: { name: true, primaryColor: true } } },
    }),
    prisma.lead.findMany({
      where: { ...leadWhere, createdAt: { gte: startOfMonth } },
      select: { source: true, value: true },
    }),
    prisma.lead.count({
      where: { ...leadWhere, createdAt: { gte: oneDayAgo } },
    }),
    prisma.lead.count({
      where: { ...leadWhere, createdAt: { gte: sevenDaysAgo } },
    }),
  ]);

  const totalLeads = await prisma.lead.count({ where: leadWhere });
  const conversionRate =
    totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  const revenueThisMonth = await prisma.lead.aggregate({
    where: { ...leadWhere, status: "WON", createdAt: { gte: startOfMonth } },
    _sum: { value: true },
  });

  const leadDelta =
    leadsLastMonth > 0
      ? Math.round(
          ((leadsThisMonth - leadsLastMonth) / leadsLastMonth) * 100
        )
      : 0;

  // Source breakdown (based on this month's leads)
  const sourceMap: Record<string, number> = {};
  for (const lead of allLeads) {
    const src = lead.source?.toLowerCase() ?? "other";
    const key =
      src.includes("facebook") || src.includes("fb")
        ? "facebook"
        : src.includes("google")
        ? "google"
        : src === "organic"
        ? "organic"
        : src === "manual"
        ? "manual"
        : "other";
    sourceMap[key] = (sourceMap[key] ?? 0) + 1;
  }
  const totalSourceLeads = allLeads.length || 1;
  const sourceSorted = Object.entries(sourceMap).sort((a, b) => b[1] - a[1]);

  const statsCards = [
    {
      title: "לידים החודש",
      value: leadsThisMonth,
      delta: `${Math.abs(leadDelta)}%`,
      positive: leadDelta >= 0,
      iconName: "Users",
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      title: "אחוז המרה",
      value: `${conversionRate}%`,
      delta: null,
      iconName: "TrendingUp",
      color: "bg-green-50 text-green-600",
    },
    {
      title: "לקוחות פעילים",
      value: clientCount,
      delta: null,
      iconName: "Building2",
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "הכנסה החודש",
      value: `₪${(revenueThisMonth._sum.value ?? 0).toLocaleString("he-IL")}`,
      delta: null,
      iconName: "Banknote",
      color: "bg-amber-50 text-amber-600",
    },
  ];

  // Fetch clients with per-client stats
  const clients = await prisma.client.findMany({
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

  const publishedCount = clients.filter((c) => c.pagePublished).length;

  const clientsWithStats = await Promise.all(
    clients.map(async (c) => {
      const [clientLeadsThisMonth, clientWonLeads, clientLeads7d] = await Promise.all([
        prisma.lead.count({
          where: { clientId: c.id, createdAt: { gte: startOfMonth } },
        }),
        prisma.lead.count({ where: { clientId: c.id, status: "WON" } }),
        prisma.lead.count({
          where: { clientId: c.id, createdAt: { gte: sevenDaysAgo } },
        }),
      ]);
      return {
        ...c,
        leadsThisMonth: clientLeadsThisMonth,
        totalLeads: c._count.leads,
        wonLeads: clientWonLeads,
        leads7d: clientLeads7d,
      };
    })
  );

  // Landing pages for owned clients
  const landingPages = await prisma.landingPage.findMany({
    where: { clientId: { in: ownedClientIds } },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: {
      id: true,
      title: true,
      slug: true,
      isPublished: true,
      createdAt: true,
      client: { select: { id: true, name: true, primaryColor: true, slug: true } },
      _count: { select: { leads: true } },
    },
  });

  // Recent activity across all clients (last 20)
  const recentActivities = await prisma.leadActivity.findMany({
    where: { lead: { clientId: { in: ownedClientIds } } },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      type: true,
      content: true,
      createdAt: true,
      lead: {
        select: {
          firstName: true,
          lastName: true,
          client: { select: { name: true, primaryColor: true } },
        },
      },
    },
  });

  // Pipeline value (open deals)
  const pipelineData = await prisma.lead.aggregate({
    where: {
      ...leadWhere,
      status: { in: ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL"] },
    },
    _sum: { value: true },
    _count: { _all: true },
  });

  // Won deals this month
  const wonData = await prisma.lead.aggregate({
    where: {
      ...leadWhere,
      status: "WON",
      updatedAt: { gte: startOfMonth },
    },
    _sum: { value: true },
    _count: { _all: true },
  });

  // Serialize: strip _count from clients
  const serializedClients = clientsWithStats.map(
    ({ _count: _removed, ...rest }) => rest
  );

  const userName = session?.email?.split("@")[0] ?? "Admin";

  const serializedLandingPages = landingPages.map(({ _count, ...rest }) => ({
    ...rest,
    leadsCount: _count.leads,
  }));

  return (
    <DashboardView
      session={session}
      statsCards={statsCards}
      clients={serializedClients}
      recentLeads={recentLeads}
      recentActivities={recentActivities.map((a) => ({ ...a, content: a.content ?? "" }))}
      sourceSorted={sourceSorted}
      totalSourceLeads={totalSourceLeads}
      clientCount={clientCount}
      landingPages={serializedLandingPages}
      pipelineValue={pipelineData._sum.value ?? 0}
      pipelineCount={pipelineData._count._all}
      wonValue={wonData._sum.value ?? 0}
      wonCount={wonData._count._all}
      todayLeads={todayLeads}
      newLeads7d={newLeads7d}
      publishedCount={publishedCount}
      userName={userName}
    />
  );
}
