import { notFound, redirect } from "next/navigation";
import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";
import { EditPropertyClient } from "./EditPropertyClient";

export default async function EditPropertyPage({
  params,
}: {
  params: { slug: string; id: string };
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

  const property = await prisma.property.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      rooms: true,
      floor: true,
      totalFloors: true,
      area: true,
      city: true,
      neighborhood: true,
      street: true,
      propertyType: true,
      status: true,
      images: true,
      features: true,
      isExclusive: true,
      isFeatured: true,
      clientId: true,
      published: true,
      privateNotes: true,
      marketingLog: true,
    },
  });

  if (!property) notFound();
  if (property.clientId !== client.id) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <EditPropertyClient
      property={{
        ...property,
        marketingLog: (property.marketingLog as { id: string; date: string; text: string }[]) ?? [],
      }}
      slug={params.slug}
      appUrl={appUrl}
    />
  );
}
