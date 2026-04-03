import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { SettingsClient } from "./SettingsClient";

export const metadata = { title: "הגדרות — MarketingOS" };

export default async function SettingsPage() {
  const session = await getSession();
  const isSuperAdmin = session?.role === "SUPER_ADMIN";

  const [users, clients, systemSettings, messageTemplates] = await Promise.all([
    isSuperAdmin
      ? prisma.user.findMany({
          select: {
            id: true, email: true, name: true, role: true,
            isActive: true, lastLoginAt: true, createdAt: true,
            client: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),

    isSuperAdmin
      ? prisma.client.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
      : prisma.client.findMany({
          where:   { ownerId: session?.userId },
          select:  { id: true, name: true },
          orderBy: { name: "asc" },
        }),

    session?.userId
      ? prisma.systemSettings.findUnique({ where: { userId: session.userId } })
      : null,

    session?.userId
      ? prisma.messageTemplate.findMany({ where: { userId: session.userId } })
      : [],
  ]);

  return (
    <SettingsClient
      users={users}
      clients={clients}
      isSuperAdmin={isSuperAdmin}
      currentUserId={session?.userId ?? ""}
      initialSettings={systemSettings}
      initialTemplates={messageTemplates}
    />
  );
}
