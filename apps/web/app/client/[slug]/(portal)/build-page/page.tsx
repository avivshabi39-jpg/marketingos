import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PortalPageBuilder } from "./PortalPageBuilder";

export default async function PortalBuildPage({ params }: { params: { slug: string } }) {
  const session = await getClientSession();
  if (!session || session.slug !== params.slug) redirect(`/client/${params.slug}/login`);

  const client = await prisma.client.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true, slug: true, industry: true, pagePublished: true, primaryColor: true, landingPageTitle: true },
  });
  if (!client) redirect("/");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return <PortalPageBuilder client={{ ...client, industry: client.industry ?? "GENERAL", primaryColor: client.primaryColor ?? "#6366f1" }} appUrl={appUrl} />;
}
