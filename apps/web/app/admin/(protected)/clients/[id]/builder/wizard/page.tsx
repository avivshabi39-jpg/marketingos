import { redirect, notFound } from "next/navigation";
import { getSession, isSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WizardClient } from "./WizardClient";

export default async function BuilderWizardPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      slug: true,
      industry: true,
      pagePublished: true,
      phone: true,
      whatsappNumber: true,
      ownerId: true,
    },
  });

  if (!client) notFound();
  if (!isSuperAdmin(session) && client.ownerId !== session.userId) {
    redirect("/admin/dashboard");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <WizardClient
      client={{
        id: client.id,
        name: client.name,
        slug: client.slug,
        industry: client.industry ?? "GENERAL",
        pagePublished: client.pagePublished,
        phone: client.phone ?? "",
      }}
      appUrl={appUrl}
    />
  );
}
