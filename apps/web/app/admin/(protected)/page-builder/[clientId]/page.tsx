import { getSession, isSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PageBuilderClient } from "./PageBuilderClient";

export default async function PageBuilderPage({
  params,
}: {
  params: { clientId: string };
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const client = await prisma.client.findUnique({
    where: { id: params.clientId },
    select: {
      id: true,
      name: true,
      slug: true,
      industry: true,
      pagePublished: true,
      primaryColor: true,
      landingPageTitle: true,
      ownerId: true,
    },
  });

  if (!client) redirect("/admin/clients");
  if (!isSuperAdmin(session) && client.ownerId !== session.userId) redirect("/admin/clients");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <PageBuilderClient
      client={{
        id: client.id,
        name: client.name,
        slug: client.slug,
        industry: client.industry ?? "GENERAL",
        pagePublished: client.pagePublished,
        primaryColor: client.primaryColor ?? "#6366f1",
        landingPageTitle: client.landingPageTitle,
      }}
      appUrl={appUrl}
    />
  );
}
