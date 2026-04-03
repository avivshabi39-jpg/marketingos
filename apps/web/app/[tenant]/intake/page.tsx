import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { IntakeFormClient } from "./IntakeFormClient";

export async function generateMetadata(
  { params }: { params: { tenant: string } }
): Promise<Metadata> {
  const client = await prisma.client.findUnique({
    where: { slug: params.tenant },
    select: { name: true },
  });
  return { title: client ? `${client.name} — טופס קבלת לקוח` : "טופס קבלת לקוח" };
}

export default async function IntakePage({ params }: { params: { tenant: string } }) {
  const client = await prisma.client.findUnique({
    where: { slug: params.tenant },
    select: { id: true, name: true, isActive: true, primaryColor: true },
  });

  if (!client || !client.isActive) notFound();

  return (
    <IntakeFormClient
      clientSlug={params.tenant}
      clientName={client.name}
      primaryColor={client.primaryColor}
    />
  );
}
