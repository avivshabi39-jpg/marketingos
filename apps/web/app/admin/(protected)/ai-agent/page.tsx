import { getSession, isSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AiAgentPage } from "./AiAgentPage";

export default async function AdminAiAgentPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const superAdmin = isSuperAdmin(session);
  const clients = await prisma.client.findMany({
    where: superAdmin ? { isActive: true } : { isActive: true, ownerId: session.userId },
    select: { id: true, name: true, industry: true, pagePublished: true },
    orderBy: { createdAt: "desc" },
  });

  return <AiAgentPage clients={clients} />;
}
