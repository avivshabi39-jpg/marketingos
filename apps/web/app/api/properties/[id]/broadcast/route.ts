import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const property = await prisma.property.findUnique({
    where: { id: params.id },
    include: { client: { select: { id: true, ownerId: true, greenApiInstanceId: true, greenApiToken: true } } },
  });

  if (!property) return NextResponse.json({ error: "נכס לא נמצא" }, { status: 404 });
  if (!isSuperAdmin(session) && property.client.ownerId !== session.userId) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  // Get all leads for this client that have a phone number
  const leads = await prisma.lead.findMany({
    where: { clientId: property.clientId, phone: { not: null } },
    select: { id: true, firstName: true, phone: true },
  });

  if (leads.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "אין לידים עם מספר טלפון" });
  }

  const priceFormatted = property.price.toLocaleString("he-IL");
  const details = [
    property.rooms ? `${property.rooms} חדרים` : null,
    property.area ? `${property.area} מ"ר` : null,
    property.city,
    property.neighborhood,
  ].filter(Boolean).join(", ");

  const message = `🏠 נכס חדש שעשוי לעניין אותך:\n\n${property.title}\n💰 ₪${priceFormatted}\n📍 ${details}\n\nליצירת קשר ופרטים נוספים חזור/י אלינו.`;

  let sent = 0;
  const { greenApiInstanceId, greenApiToken } = property.client;

  for (const lead of leads) {
    // Create PropertyLead record
    await prisma.propertyLead.upsert({
      where: { leadId_propertyId: { leadId: lead.id, propertyId: property.id } },
      create: { leadId: lead.id, propertyId: property.id, matchScore: 100 },
      update: { matchScore: 100 },
    }).catch(() => {});

    // Send WhatsApp via Green API if configured
    if (greenApiInstanceId && greenApiToken && lead.phone) {
      const phone = lead.phone.replace(/\D/g, "");
      const chatId = phone.startsWith("972") ? `${phone}@c.us` : `972${phone.replace(/^0/, "")}@c.us`;
      try {
        await fetch(
          `https://api.green-api.com/waInstance${greenApiInstanceId}/sendMessage/${greenApiToken}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chatId, message }),
          }
        );
        sent++;
      } catch { /* ignore individual send errors */ }
    } else {
      sent++;
    }
  }

  return NextResponse.json({ ok: true, sent, total: leads.length });
}
