import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type SequenceStep = {
  delay_days: number;
  subject: string;
  body: string;
};

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  let processed = 0;

  // Fetch all active sequences with their clients
  const sequences = await prisma.emailSequence.findMany({
    where: { isActive: true },
    include: { client: { select: { id: true, name: true } } },
  });

  for (const sequence of sequences) {
    const steps = sequence.steps as SequenceStep[];
    if (!steps || steps.length === 0) continue;

    // Find leads matching the trigger
    let leads: Array<{ id: string; firstName: string; lastName: string; email: string | null; createdAt: Date; status: string; updatedAt: Date }> = [];

    if (sequence.trigger === "new_lead") {
      leads = await prisma.lead.findMany({
        where: { clientId: sequence.clientId },
        select: { id: true, firstName: true, lastName: true, email: true, createdAt: true, status: true, updatedAt: true },
      });
    } else if (sequence.trigger === "won_lead") {
      leads = await prisma.lead.findMany({
        where: { clientId: sequence.clientId, status: "WON" },
        select: { id: true, firstName: true, lastName: true, email: true, createdAt: true, status: true, updatedAt: true },
      });
    } else if (sequence.trigger === "no_reply_3days") {
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      leads = await prisma.lead.findMany({
        where: {
          clientId: sequence.clientId,
          status: { notIn: ["WON", "LOST"] },
          updatedAt: { lte: threeDaysAgo },
        },
        select: { id: true, firstName: true, lastName: true, email: true, createdAt: true, status: true, updatedAt: true },
      });
    }

    for (const lead of leads) {
      if (!lead.email) continue;

      // Find how many steps have already been sent to this lead
      const sentLogs = await prisma.emailSequenceLog.findMany({
        where: { sequenceId: sequence.id, leadId: lead.id },
        orderBy: { sentAt: "desc" },
      });

      const nextStepIndex = sentLogs.length;
      if (nextStepIndex >= steps.length) continue; // All steps sent

      const step = steps[nextStepIndex];
      const delayDays = step.delay_days ?? 0;

      // Determine when this step should be triggered from
      let referenceDate: Date;
      if (nextStepIndex === 0) {
        referenceDate = lead.createdAt;
      } else {
        referenceDate = sentLogs[0].sentAt; // last sent
      }

      const sendAfter = new Date(referenceDate.getTime() + delayDays * 24 * 60 * 60 * 1000);

      if (now >= sendAfter) {
        // Log the step (actual Resend sending is a future integration)
        await prisma.emailSequenceLog.create({
          data: {
            sequenceId: sequence.id,
            leadId: lead.id,
            step: nextStepIndex,
            status: "sent",
          },
        });
        processed++;
      }
    }
  }

  return NextResponse.json({ processed, timestamp: now.toISOString() });
}
