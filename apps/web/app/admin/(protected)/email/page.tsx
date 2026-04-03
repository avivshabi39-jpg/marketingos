import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EmailPageClient } from "./EmailPageClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "מיילים | MarketingOS",
};

export default async function EmailPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const session = await getSession();
  const isSuperAdmin = session?.role === "SUPER_ADMIN";

  const clients = await prisma.client.findMany({
    where: isSuperAdmin
      ? { isActive: true }
      : { ownerId: session?.userId, isActive: true },
    select: { id: true, name: true, slug: true, primaryColor: true },
    orderBy: { name: "asc" },
  });

  return (
    <EmailPageClient
      clients={clients}
      initialTab={searchParams.tab === "sequences" ? "sequences" : "templates"}
    />
  );
}
