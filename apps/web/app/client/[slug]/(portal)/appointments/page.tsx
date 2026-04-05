import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PortalCalendar } from "./PortalCalendar";

export default async function PortalAppointmentsPage({ params }: { params: { slug: string } }) {
  const session = await getClientSession();
  if (!session || session.slug !== params.slug) redirect(`/client/${params.slug}/login`);

  const client = await prisma.client.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true },
  });
  if (!client) redirect("/");

  const appointments = await prisma.appointment.findMany({
    where: { clientId: client.id },
    orderBy: { scheduledAt: "asc" },
    select: { id: true, name: true, scheduledAt: true, status: true, notes: true, phone: true },
  });

  return <PortalCalendar clientId={client.id} clientName={client.name} appointments={appointments.map((a) => ({ ...a, scheduledAt: a.scheduledAt.toISOString() }))} />;
}
