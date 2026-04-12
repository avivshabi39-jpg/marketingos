import { notFound, redirect } from "next/navigation";
import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";
import { PortalLeadsClient } from "./PortalLeadsClient";

export default async function ClientLeadsPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getClientSession();
  if (!session || session.slug !== params.slug) {
    redirect(`/client/${params.slug}/login`);
  }

  const client = await prisma.client.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      name: true,
      isActive: true,
      whatsappNumber: true,
      autoReplyActive: true,
    },
  });

  if (!client || !client.isActive) notFound();

  const leads = await prisma.lead.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      source: true,
      status: true,
      value: true,
      leadScore: true,
      gender: true,
      ageRange: true,
      city: true,
      autoReplied: true,
      metadata: true,
      createdAt: true,
    },
  });

  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === "NEW").length,
    contacted: leads.filter((l) => l.status === "CONTACTED").length,
    won: leads.filter((l) => l.status === "WON").length,
  };

  return (
    <PortalLeadsClient
      leads={leads.map((l) => ({ ...l, createdAt: l.createdAt.toISOString(), metadata: (l.metadata as Record<string, unknown>) ?? null }))}
      stats={stats}
      clientId={client.id}
      autoReplyActive={client.autoReplyActive}
    />
  );
}
