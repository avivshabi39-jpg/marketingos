import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsApp } from "@/lib/whatsapp";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = Date.now();
  let sent = 0;
  let failed = 0;

  // Day 1 follow-up — NEW leads from ~24h ago
  const day1 = await prisma.lead.findMany({
    where: {
      status: "NEW",
      autoReplied: true,
      phone: { not: "" },
      createdAt: { gte: new Date(now - 25 * 3600000), lte: new Date(now - 23 * 3600000) },
    },
    include: { client: { select: { name: true, greenApiInstanceId: true, greenApiToken: true } } },
    take: 50,
  });

  for (const lead of day1) {
    if (!lead.phone) continue;
    const result = await sendWhatsApp(lead.phone, `שלום ${lead.firstName}! 👋\n\nראיתי שפנית אלינו ב${lead.client.name}.\nרצינו לוודא שקיבלת מענה — אנחנו כאן לעזור!\n\nמתי נוח לדבר? 📞`, lead.client);
    if (result.ok) {
      await prisma.lead.update({ where: { id: lead.id }, data: { status: "CONTACTED" } });
      sent++;
    } else {
      failed++;
      console.error(`[whatsapp-drip] Day 1 failed for lead ${lead.id}: ${result.error}`);
    }
  }

  // Day 3 — CONTACTED leads from ~72h ago
  const day3 = await prisma.lead.findMany({
    where: {
      status: "CONTACTED",
      phone: { not: "" },
      createdAt: { gte: new Date(now - 73 * 3600000), lte: new Date(now - 71 * 3600000) },
    },
    include: { client: { select: { name: true, greenApiInstanceId: true, greenApiToken: true } } },
    take: 50,
  });

  for (const lead of day3) {
    if (!lead.phone) continue;
    const result = await sendWhatsApp(lead.phone, `שלום ${lead.firstName}! 😊\n\nאנחנו מ${lead.client.name}.\nפנית אלינו לפני מספר ימים — עדיין מתעניין/ת?\n\nנשמח לתאם שיחה קצרה 🙏`, lead.client);
    if (result.ok) {
      sent++;
    } else {
      failed++;
      console.error(`[whatsapp-drip] Day 3 failed for lead ${lead.id}: ${result.error}`);
    }
  }

  return NextResponse.json({ ok: true, sent, failed });
}
