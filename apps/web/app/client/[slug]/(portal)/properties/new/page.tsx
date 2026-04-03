import { notFound, redirect } from "next/navigation";
import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";
import { NewPropertyClient } from "./NewPropertyClient";

export default async function NewPropertyPage({
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
    select: { id: true, isActive: true },
  });

  if (!client || !client.isActive) notFound();

  return <NewPropertyClient clientId={client.id} slug={params.slug} />;
}
