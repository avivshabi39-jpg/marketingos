import { redirect } from "next/navigation";
import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";
import { PortalSettingsClient } from "./PortalSettingsClient";

export default async function PortalSettingsPage({
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
      slug: true,
      phone: true,
      email: true,
      primaryColor: true,
      logoUrl: true,
      landingPageTitle: true,
      seoDescription: true,
      greenApiInstanceId: true,
      greenApiToken: true,
      googleReviewLink: true,
      autoReplyActive: true,
      pagePublished: true,
      industry: true,
      plan: true,
    },
  });

  if (!client) redirect("/");

  return (
    <PortalSettingsClient
      client={client}
      appUrl={process.env.NEXT_PUBLIC_APP_URL || ""}
    />
  );
}
