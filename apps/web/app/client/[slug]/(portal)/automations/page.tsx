import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PortalAutomationsClient } from "./PortalAutomationsClient";
import { N8nSection } from "./N8nSection";

export default async function PortalAutomationsPage({ params }: { params: { slug: string } }) {
  const session = await getClientSession();
  if (!session || session.slug !== params.slug) redirect(`/client/${params.slug}/login`);

  const client = await prisma.client.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      name: true,
      autoReplyActive: true,
      whatsappTemplate: true,
      googleReviewLink: true,
      dripEnabled: true,
      dripDay1Message: true,
      dripDay1Delay: true,
      dripDay3Message: true,
      dripDay3Delay: true,
    },
  });
  if (!client) redirect("/");

  const [totalLeads, newLeads] = await Promise.all([
    prisma.lead.count({ where: { clientId: client.id } }),
    prisma.lead.count({ where: { clientId: client.id, status: "NEW" } }),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  return (
    <>
      <PortalAutomationsClient
        client={client}
        stats={{ totalLeads, newLeads }}
      />
      <div style={{ padding: "16px", maxWidth: "700px" }}>
        <N8nSection clientId={client.id} appUrl={appUrl} />
      </div>
    </>
  );
}
