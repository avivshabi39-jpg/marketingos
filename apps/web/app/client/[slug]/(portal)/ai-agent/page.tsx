import { redirect, notFound } from "next/navigation";
import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";
import { PortalAiAgentClient } from "./PortalAiAgentClient";

export default async function PortalAiAgentPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getClientSession();
  if (!session) redirect(`/client/${params.slug}/login`);
  if (session.slug !== params.slug) redirect(`/client/${session.slug}/ai-agent`);

  const client = await prisma.client.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      name: true,
      slug: true,
      industry: true,
      pagePublished: true,
      aiAgentEnabled: true,
      whatsappNumber: true,
      primaryColor: true,
    },
  });

  if (!client || !client.aiAgentEnabled) notFound();

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalLeads, newLeads7d, leadsThisMonth, wonLeads, pageViews, topSourceResult] =
    await Promise.all([
      prisma.lead.count({ where: { clientId: client.id } }),
      prisma.lead.count({
        where: { clientId: client.id, status: "NEW", createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.lead.count({
        where: { clientId: client.id, createdAt: { gte: firstOfMonth } },
      }),
      prisma.lead.count({ where: { clientId: client.id, status: "WON" } }),
      prisma.pageView.count({ where: { clientId: client.id } }),
      prisma.lead
        .groupBy({
          by: ["source"],
          where: { clientId: client.id, source: { not: null } },
          _count: { _all: true },
          orderBy: { _count: { source: "desc" } },
          take: 1,
        })
        .then((r) => r[0]?.source ?? null),
    ]);

  const conversionRate =
    totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  return (
    <PortalAiAgentClient
      client={{
        id: client.id,
        name: client.name,
        slug: client.slug,
        industry: client.industry,
        pagePublished: client.pagePublished,
        primaryColor: client.primaryColor ?? "#6366f1",
      }}
      stats={{
        totalLeads,
        newLeads7d,
        leadsThisMonth,
        wonLeads,
        conversionRate,
        pageViews,
        topSource: topSourceResult ?? "ישיר",
      }}
    />
  );
}
