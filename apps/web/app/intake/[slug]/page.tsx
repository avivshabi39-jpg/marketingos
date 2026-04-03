import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { IntakeFormClient } from "./IntakeFormClient";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const client = await prisma.client.findUnique({
    where: { slug: params.slug },
    select: { name: true },
  });
  return {
    title: client ? `${client.name} — טופס קבלת לקוח` : "טופס קבלת לקוח",
  };
}

export default async function PublicIntakePage({
  params,
}: {
  params: { slug: string };
}) {
  const client = await prisma.client.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true, isActive: true, primaryColor: true, slug: true },
  });

  if (!client || !client.isActive) notFound();

  return (
    <IntakeFormClient
      clientSlug={client.slug}
      clientName={client.name}
      primaryColor={client.primaryColor}
    />
  );
}
