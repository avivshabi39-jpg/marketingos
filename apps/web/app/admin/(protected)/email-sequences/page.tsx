import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Mail } from "lucide-react";
import { EmailSequencesClient } from "./EmailSequencesClient";

export default async function EmailSequencesPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  // Fetch clients this user can access
  let clients: { id: string; name: string; primaryColor: string }[];

  if (session.role === "SUPER_ADMIN") {
    clients = await prisma.client.findMany({
      select: { id: true, name: true, primaryColor: true },
      orderBy: { name: "asc" },
    });
  } else if (session.clientId) {
    const c = await prisma.client.findUnique({
      where: { id: session.clientId },
      select: { id: true, name: true, primaryColor: true },
    });
    clients = c ? [c] : [];
  } else {
    clients = await prisma.client.findMany({
      where: { ownerId: session.userId },
      select: { id: true, name: true, primaryColor: true },
      orderBy: { name: "asc" },
    });
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Mail size={22} className="text-indigo-500" /> רצפי מייל
        </h1>
        <p className="text-sm text-gray-500 mt-1">אוטומציות מייל מבוססות טריגר</p>
      </div>

      <EmailSequencesClient
        clients={clients}
        initialClientId={clients[0]?.id}
      />
    </div>
  );
}
