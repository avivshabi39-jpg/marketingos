import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const markId = searchParams.get("markId");

  // Owned client IDs
  let clientIds: string[];
  if (isSuperAdmin(session)) {
    const all = await prisma.client.findMany({ select: { id: true } });
    clientIds = all.map((c) => c.id);
  } else if (session.clientId) {
    clientIds = [session.clientId];
  } else {
    const owned = await prisma.client.findMany({
      where: { ownerId: session.userId },
      select: { id: true },
    });
    clientIds = owned.map((c) => c.id);
  }

  if (clientIds.length === 0) return NextResponse.json({ items: [], unread: 0 });

  // Fetch latest leads (as "new lead" items)
  const [leads, appointments, intakeForms] = await Promise.all([
    prisma.lead.findMany({
      where: { clientId: { in: clientIds } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true, firstName: true, lastName: true, phone: true,
        source: true, status: true, createdAt: true,
        client: { select: { id: true, name: true, primaryColor: true } },
      },
    }),
    prisma.appointment.findMany({
      where: { clientId: { in: clientIds } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true, name: true, phone: true, scheduledAt: true, status: true, notes: true, createdAt: true,
        client: { select: { id: true, name: true, primaryColor: true } },
      },
    }),
    prisma.intakeForm.findMany({
      where: { clientId: { in: clientIds } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true, fullName: true, businessName: true, phone: true, email: true,
        formType: true, mainGoal: true, createdAt: true,
        client: { select: { id: true, name: true, primaryColor: true } },
      },
    }),
  ]);

  type InboxItem = {
    id: string;
    type: "lead_created" | "appointment" | "form_submitted";
    title: string;
    subtitle: string;
    detail: string;
    phone: string | null;
    clientName: string;
    clientColor: string;
    clientId: string;
    createdAt: string;
  };

  const items: InboxItem[] = [
    ...leads.map((l) => ({
      id:          `lead-${l.id}`,
      type:        "lead_created" as const,
      title:       `${l.firstName} ${l.lastName}`,
      subtitle:    `ליד חדש — ${l.source ?? "ללא מקור"}`,
      detail:      `סטטוס: ${l.status}`,
      phone:       l.phone,
      clientName:  l.client.name,
      clientColor: l.client.primaryColor,
      clientId:    l.client.id,
      createdAt:   l.createdAt.toISOString(),
    })),
    ...appointments.map((a) => ({
      id:          `appt-${a.id}`,
      type:        "appointment" as const,
      title:       a.name,
      subtitle:    `תור — ${new Date(a.scheduledAt).toLocaleDateString("he-IL")}`,
      detail:      a.notes ?? `סטטוס: ${a.status}`,
      phone:       a.phone,
      clientName:  a.client.name,
      clientColor: a.client.primaryColor,
      clientId:    a.client.id,
      createdAt:   a.createdAt.toISOString(),
    })),
    ...intakeForms.map((f) => ({
      id:          `form-${f.id}`,
      type:        "form_submitted" as const,
      title:       f.fullName,
      subtitle:    `טופס קבלה — ${f.businessName}`,
      detail:      f.mainGoal ?? (f.formType === "CLIENT_ONBOARDING" ? "טופס קבלת לקוח" : "טופס אפיון לאתר"),
      phone:       f.phone,
      clientName:  f.client.name,
      clientColor: f.client.primaryColor,
      clientId:    f.client.id,
      createdAt:   f.createdAt.toISOString(),
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
   .slice(0, 50);

  // Count unread InboxEvents for this user
  const unread = await prisma.inboxEvent.count({
    where: { userId: session.userId, isRead: false },
  });

  return NextResponse.json({ items, unread });
}

// PATCH /api/inbox — mark all InboxEvents as read
export async function PATCH(_req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.inboxEvent.updateMany({
    where: { userId: session.userId, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}
