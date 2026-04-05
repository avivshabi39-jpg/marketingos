import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PortalEmailClient } from "./PortalEmailClient";

export default async function PortalEmailPage({ params }: { params: { slug: string } }) {
  const session = await getClientSession();
  if (!session || session.slug !== params.slug) redirect(`/client/${params.slug}/login`);

  const client = await prisma.client.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true, slug: true },
  });
  if (!client) redirect("/");

  const sequences = await prisma.emailSequence.findMany({
    where: { clientId: client.id },
    include: {
      _count: { select: { logs: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const leadCount = await prisma.lead.count({
    where: { clientId: client.id },
  });

  return (
    <PortalEmailClient
      client={client}
      sequences={sequences.map(({ _count, steps, ...s }) => ({
        ...s,
        steps: steps as { delay: number; subject: string; body: string }[],
        logCount: _count.logs,
      }))}
      leadCount={leadCount}
    />
  );
}
