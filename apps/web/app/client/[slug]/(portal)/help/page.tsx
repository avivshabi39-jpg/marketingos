import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PortalHelpClient } from "./PortalHelpClient";

export default async function PortalHelpPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getClientSession();
  if (!session || session.slug !== params.slug)
    redirect(`/client/${params.slug}/login`);

  const client = await prisma.client.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      name: true,
      slug: true,
      pagePublished: true,
      autoReplyActive: true,
      greenApiInstanceId: true,
    },
  });

  if (!client) redirect("/");

  return <PortalHelpClient client={client} />;
}
