import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PortalAutomationsClient } from "./PortalAutomationsClient";

export default async function PortalAutomationsPage({ params }: { params: { slug: string } }) {
  const session = await getClientSession();
  if (!session || session.slug !== params.slug) redirect(`/client/${params.slug}/login`);

  const client = await prisma.client.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true, autoReplyActive: true, whatsappTemplate: true },
  });
  if (!client) redirect("/");

  const [totalLeads, newLeads] = await Promise.all([
    prisma.lead.count({ where: { clientId: client.id } }),
    prisma.lead.count({ where: { clientId: client.id, status: "NEW" } }),
  ]);

  return <PortalAutomationsClient clientId={client.id} clientName={client.name} autoReplyActive={client.autoReplyActive} autoReplyMessage={client.whatsappTemplate ?? ""} stats={{ totalLeads, newLeads }} />;
}
