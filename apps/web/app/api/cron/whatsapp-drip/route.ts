import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsApp } from "@/lib/whatsapp";
import { decrypt } from "@/lib/encrypt";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = Date.now();
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  // ─── Day 1 follow-up: NEW leads from ~24h ago that got auto-reply ───
  const day1 = await prisma.lead.findMany({
    where: {
      status: "NEW",
      autoReplied: true,
      phone: { not: "" },
      createdAt: { gte: new Date(now - 25 * 3600000), lte: new Date(now - 23 * 3600000) },
    },
    include: {
      client: {
        select: { name: true, greenApiInstanceId: true, greenApiToken: true },
      },
    },
    take: 50,
  });

  for (const lead of day1) {
    if (!lead.phone || !lead.client.greenApiInstanceId || !lead.client.greenApiToken) {
      skipped++;
      continue;
    }

    const message = `שלום ${lead.firstName}! 👋

פנית אלינו ב${lead.client.name} ורצינו לוודא שקיבלת מענה.
אנחנו כאן לעזור — מתי נוח לך לדבר? 📞`;

    const rawToken = decrypt(lead.client.greenApiToken!);
    const result = await sendWhatsApp(lead.phone, message, lead.client.greenApiInstanceId!, rawToken);
    if (result.ok) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { status: "CONTACTED" },
      });
      prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          type: "status_change",
          content: "מעקב אוטומטי יום 1 — הודעת וואצאפ נשלחה",
        },
      }).catch((err) => console.error("[drip-day1-activity]", err));
      sent++;
    } else {
      failed++;
      console.error(`[whatsapp-drip] Day 1 failed for lead ${lead.id}: ${result.error}`);
    }
  }

  // ─── Day 3 follow-up: CONTACTED leads from ~72h ago ───
  const day3 = await prisma.lead.findMany({
    where: {
      status: "CONTACTED",
      phone: { not: "" },
      createdAt: { gte: new Date(now - 73 * 3600000), lte: new Date(now - 71 * 3600000) },
    },
    include: {
      client: {
        select: { name: true, greenApiInstanceId: true, greenApiToken: true },
      },
    },
    take: 50,
  });

  for (const lead of day3) {
    if (!lead.phone || !lead.client.greenApiInstanceId || !lead.client.greenApiToken) {
      skipped++;
      continue;
    }

    const message = `שלום ${lead.firstName}! 😊

פנית אלינו ב${lead.client.name} לפני כמה ימים.
עדיין מתעניין/ת? נשמח לתאם שיחה קצרה 🙏

פשוט שלח/י "כן" ונחזור אליך.`;

    const rawToken3 = decrypt(lead.client.greenApiToken!);
    const result = await sendWhatsApp(lead.phone, message, lead.client.greenApiInstanceId!, rawToken3);
    if (result.ok) {
      prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          type: "status_change",
          content: "מעקב אוטומטי יום 3 — הודעת תזכורת נשלחה",
        },
      }).catch((err) => console.error("[drip-day3-activity]", err));
      sent++;
    } else {
      failed++;
      console.error(`[whatsapp-drip] Day 3 failed for lead ${lead.id}: ${result.error}`);
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    failed,
    skipped,
    processed: { day1: day1.length, day3: day3.length },
  });
}
