import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsApp } from "@/lib/whatsapp";
import { decrypt } from "@/lib/encrypt";

// Terminal statuses — never send follow-ups to these
const TERMINAL_STATUSES = ["WON", "LOST", "QUALIFIED", "PROPOSAL"];

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = Date.now();
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const skippedReasons: string[] = [];

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
      activities: {
        where: { content: { contains: "מעקב אוטומטי יום 1" } },
        select: { id: true },
        take: 1,
      },
    },
    take: 50,
  });

  for (const lead of day1) {
    // Skip: missing WhatsApp credentials
    if (!lead.phone || !lead.client.greenApiInstanceId || !lead.client.greenApiToken) {
      skipped++;
      skippedReasons.push(`${lead.id}: no WhatsApp config`);
      continue;
    }

    // Duplicate prevention: check if Day 1 already sent via activity log
    if (lead.activities.length > 0) {
      skipped++;
      skippedReasons.push(`${lead.id}: day1 already sent`);
      continue;
    }

    // Stop condition: if lead was manually updated after creation (user already handling)
    const msSinceCreation = now - new Date(lead.createdAt).getTime();
    const msSinceUpdate = now - new Date(lead.updatedAt).getTime();
    if (msSinceCreation - msSinceUpdate > 60000) {
      // updatedAt is significantly newer than createdAt — someone touched this lead
      skipped++;
      skippedReasons.push(`${lead.id}: manually updated`);
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
      // Exclude leads that moved past CONTACTED (terminal statuses won't match anyway)
      NOT: { status: { in: TERMINAL_STATUSES } },
    },
    include: {
      client: {
        select: { name: true, greenApiInstanceId: true, greenApiToken: true },
      },
      activities: {
        where: { content: { contains: "מעקב אוטומטי יום 3" } },
        select: { id: true },
        take: 1,
      },
    },
    take: 50,
  });

  for (const lead of day3) {
    // Skip: missing WhatsApp credentials
    if (!lead.phone || !lead.client.greenApiInstanceId || !lead.client.greenApiToken) {
      skipped++;
      skippedReasons.push(`${lead.id}: no WhatsApp config`);
      continue;
    }

    // Duplicate prevention: check if Day 3 already sent
    if (lead.activities.length > 0) {
      skipped++;
      skippedReasons.push(`${lead.id}: day3 already sent`);
      continue;
    }

    // Stop condition: if lead was moved to CONTACTED manually (not by Day 1 drip)
    // Check if there's a Day 1 activity — if not, the lead was manually contacted
    const day1Activity = await prisma.leadActivity.findFirst({
      where: { leadId: lead.id, content: { contains: "מעקב אוטומטי יום 1" } },
      select: { id: true },
    });
    if (!day1Activity) {
      // Lead was manually moved to CONTACTED — respect that, don't auto-follow-up
      skipped++;
      skippedReasons.push(`${lead.id}: manually contacted`);
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
    skippedReasons: skippedReasons.slice(0, 10), // limit response size
    processed: { day1: day1.length, day3: day3.length },
  });
}
