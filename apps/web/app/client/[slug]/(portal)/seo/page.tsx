import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PortalSeoClient } from "./PortalSeoClient";

export default async function PortalSeoPage({
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
      customDomain: true,
      customDomainVerified: true,
      landingPageTitle: true,
      seoDescription: true,
    },
  });

  if (!client) redirect("/");

  return (
    <PortalSeoClient
      client={client}
      appUrl={process.env.NEXT_PUBLIC_APP_URL || ""}
    />
  );
}
