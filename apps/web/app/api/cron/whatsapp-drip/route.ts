import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsApp } from "@/lib/whatsapp";
import { decrypt } from "@/lib/encrypt";

const TERMINAL_STATUSES = ["WON", "LOST", "QUALIFIED", "PROPOSAL"];

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  console.log("[automation] whatsapp-drip cron started");

  const now = Date.now();
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const skippedReasons: string[] = [];

  // ─── Day 1 follow-up: NEW leads from ~24h ago that got auto-reply ───
  let day1: Awaited<ReturnType<typeof prisma.lead.findMany>> = [];
  try {
    day1 = await prisma.lead.findMany({
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
  } catch (err) {
    console.error("[automation] failed to fetch Day 1 leads:", err);
    // Continue to Day 3 — don't abort entire cron
  }

  for (const lead of day1) {
    if (!lead.phone || !lead.client.greenApiInstanceId || !lead.client.greenApiToken) {
      skipped++;
      skippedReasons.push(`${lead.id}: missing config`);
      continue;
    }

    if (lead.activities.length > 0) {
      skipped++;
      skippedReasons.push(`${lead.id}: day1 already sent`);
      continue;
    }

    const msSinceCreation = now - new Date(lead.createdAt).getTime();
    const msSinceUpdate = now - new Date(lead.updatedAt).getTime();
    if (msSinceCreation - msSinceUpdate > 60000) {
      skipped++;
      skippedReasons.push(`${lead.id}: manually updated`);
      continue;
    }

    const message = `שלום ${lead.firstName}! 👋\n\nפנית אלינו ב${lead.client.name} ורצינו לוודא שקיבלת מענה.\nאנחנו כאן לעזור — מתי נוח לך לדבר? 📞`;

    let rawToken: string;
    try {
      rawToken = decrypt(lead.client.greenApiToken!);
    } catch (err) {
      skipped++;
      skippedReasons.push(`${lead.id}: decrypt failed`);
      console.error(`[automation] Day 1 decrypt failed for lead ${lead.id}:`, err);
      continue;
    }

    const result = await sendWhatsApp(lead.phone, message, lead.client.greenApiInstanceId!, rawToken);
    if (result.ok) {
      try {
        await prisma.lead.update({ where: { id: lead.id }, data: { status: "CONTACTED" } });
      } catch (err) {
        console.error(`[automation] Day 1 status update failed for lead ${lead.id}:`, err);
        // Message was sent but status not updated — log and continue
      }
      prisma.leadActivity.create({
        data: { leadId: lead.id, type: "status_change", content: "מעקב אוטומטי יום 1 — הודעת וואצאפ נשלחה" },
      }).catch((err) => console.error(`[automation] Day 1 activity log failed for lead ${lead.id}:`, err));
      sent++;
      console.log(`[automation] Day 1 sent to lead ${lead.id}`);
    } else {
      failed++;
      console.error(`[automation] Day 1 send failed for lead ${lead.id}: ${result.error}`);
    }
  }

  // ─── Day 3 follow-up: CONTACTED leads from ~72h ago ───
  let day3: Awaited<ReturnType<typeof prisma.lead.findMany>> = [];
  try {
    day3 = await prisma.lead.findMany({
      where: {
        status: "CONTACTED",
        phone: { not: "" },
        createdAt: { gte: new Date(now - 73 * 3600000), lte: new Date(now - 71 * 3600000) },
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
  } catch (err) {
    console.error("[automation] failed to fetch Day 3 leads:", err);
  }

  for (const lead of day3) {
    if (!lead.phone || !lead.client.greenApiInstanceId || !lead.client.greenApiToken) {
      skipped++;
      skippedReasons.push(`${lead.id}: missing config`);
      continue;
    }

    if (lead.activities.length > 0) {
      skipped++;
      skippedReasons.push(`${lead.id}: day3 already sent`);
      continue;
    }

    let day1Activity;
    try {
      day1Activity = await prisma.leadActivity.findFirst({
        where: { leadId: lead.id, content: { contains: "מעקב אוטומטי יום 1" } },
        select: { id: true },
      });
    } catch (err) {
      skipped++;
      skippedReasons.push(`${lead.id}: activity query failed`);
      console.error(`[automation] Day 3 activity check failed for lead ${lead.id}:`, err);
      continue;
    }
    if (!day1Activity) {
      skipped++;
      skippedReasons.push(`${lead.id}: manually contacted`);
      continue;
    }

    const message = `שלום ${lead.firstName}! 😊\n\nפנית אלינו ב${lead.client.name} לפני כמה ימים.\nעדיין מתעניין/ת? נשמח לתאם שיחה קצרה 🙏\n\nפשוט שלח/י "כן" ונחזור אליך.`;

    let rawToken3: string;
    try {
      rawToken3 = decrypt(lead.client.greenApiToken!);
    } catch (err) {
      skipped++;
      skippedReasons.push(`${lead.id}: decrypt failed`);
      console.error(`[automation] Day 3 decrypt failed for lead ${lead.id}:`, err);
      continue;
    }

    const result = await sendWhatsApp(lead.phone, message, lead.client.greenApiInstanceId!, rawToken3);
    if (result.ok) {
      prisma.leadActivity.create({
        data: { leadId: lead.id, type: "status_change", content: "מעקב אוטומטי יום 3 — הודעת תזכורת נשלחה" },
      }).catch((err) => console.error(`[automation] Day 3 activity log failed for lead ${lead.id}:`, err));
      sent++;
      console.log(`[automation] Day 3 sent to lead ${lead.id}`);
    } else {
      failed++;
      console.error(`[automation] Day 3 send failed for lead ${lead.id}: ${result.error}`);
    }
  }

  console.log(`[automation] whatsapp-drip complete: sent=${sent} failed=${failed} skipped=${skipped}`);

  return NextResponse.json({
    ok: true,
    sent,
    failed,
    skipped,
    skippedReasons: skippedReasons.slice(0, 10),
    processed: { day1: day1.length, day3: day3.length },
  });
}
