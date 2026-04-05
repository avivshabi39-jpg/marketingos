import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PortalBroadcastClient } from "./PortalBroadcastClient";

export default async function PortalBroadcastPage({ params }: { params: { slug: string } }) {
  const session = await getClientSession();
  if (!session || session.slug !== params.slug) redirect(`/client/${params.slug}/login`);

  const client = await prisma.client.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true, slug: true, greenApiInstanceId: true, greenApiToken: true },
  });
  if (!client) redirect("/");

  const [totalLeads, newLeads, contactedLeads] = await Promise.all([
    prisma.lead.count({ where: { clientId: client.id, phone: { not: "" } } }),
    prisma.lead.count({ where: { clientId: client.id, status: "NEW", phone: { not: "" } } }),
    prisma.lead.count({ where: { clientId: client.id, status: "CONTACTED", phone: { not: "" } } }),
  ]);

  const broadcasts = await prisma.broadcastLog.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, message: true, status: true, totalCount: true, sentCount: true, failCount: true, createdAt: true },
  });

  return (
    <PortalBroadcastClient
      clientId={client.id}
      clientName={client.name}
      stats={{ totalLeads, newLeads, contactedLeads }}
      broadcasts={broadcasts.map((b) => ({ ...b, createdAt: b.createdAt.toISOString() }))}
    />
  );
}
