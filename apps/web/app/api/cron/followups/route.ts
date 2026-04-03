import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { triggerN8nWebhook } from "@/lib/webhooks";

/**
 * Cron: daily at 09:00 (set in vercel.json)
 * Fires `lead.followup_due` webhook for all leads whose followUpAt is today
 * and whose status is not WON or LOST.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const leads = await prisma.lead.findMany({
    where: {
      followUpAt: { gte: startOfDay, lte: endOfDay },
      status:     { notIn: ["WON", "LOST"] },
    },
    select: {
      id: true, firstName: true, lastName: true,
      phone: true, email: true, source: true, status: true,
      clientId: true, followUpAt: true,
    },
  });

  let fired = 0;
  for (const lead of leads) {
    triggerN8nWebhook(lead.clientId, "lead.followup_due", {
      lead: {
        id: lead.id,
        name: `${lead.firstName} ${lead.lastName}`,
        phone: lead.phone,
        email: lead.email,
        source: lead.source,
        status: lead.status,
        followUpAt: lead.followUpAt,
      },
    }).catch(() => {});
    fired++;
  }

  return NextResponse.json({ fired, date: now.toISOString() });
}
