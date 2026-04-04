import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { EditPageClient } from "./EditPageClient";

export default async function EditPagePage({ params }: { params: { slug: string } }) {
  const session = await getClientSession();
  if (!session || session.slug !== params.slug) redirect(`/client/${params.slug}/login`);

  const client = await prisma.client.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true, slug: true, pageBlocks: true, primaryColor: true, pagePublished: true, landingPageTitle: true },
  });

  if (!client) redirect("/");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return <EditPageClient client={{ ...client, pageBlocks: (client.pageBlocks as unknown[]) ?? [] }} appUrl={appUrl} />;
}
