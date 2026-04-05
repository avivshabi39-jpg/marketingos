import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

export default async function CustomDomainPage({
  searchParams,
}: {
  searchParams: { domain?: string };
}) {
  const domain = searchParams.domain;
  if (!domain) notFound();

  const client = await prisma.client.findFirst({
    where: {
      customDomain: domain,
      customDomainVerified: true,
      isActive: true,
    },
    select: { slug: true },
  });

  if (!client) notFound();

  redirect(`/${client.slug}`);
}
