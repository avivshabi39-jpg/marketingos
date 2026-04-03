import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AiDesignerClient } from "./AiDesignerClient";

export default async function AiDesignerPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const isSuperAdmin = session.role === "SUPER_ADMIN";
  const clients = await prisma.client.findMany({
    where: isSuperAdmin ? { isActive: true } : { isActive: true, ownerId: session.userId },
    select: { id: true, name: true, industry: true, primaryColor: true },
    orderBy: { name: "asc" },
  });

  return <AiDesignerClient clients={clients} />;
}
