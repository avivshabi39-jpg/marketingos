import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Receive callbacks FROM n8n back to MarketingOS
export async function POST(
  req: NextRequest,
  { params }: { params: { event: string } }
) {
  try {
    const body = await req.json();
    const { leadId, data } = body as {
      clientId?: string;
      leadId?: string;
      action?: string;
      data?: Record<string, unknown>;
    };

    switch (params.event) {
      case "followup-sent":
        if (leadId) {
          await prisma.lead
            .update({
              where: { id: leadId },
              data: { autoReplied: true },
            })
            .catch(() => {});
        }
        break;

      case "update-lead":
        if (leadId && data?.status) {
          await prisma.lead
            .update({
              where: { id: leadId },
              data: { status: data.status as "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "WON" | "LOST" },
            })
            .catch(() => {});
        }
        break;

      case "add-note":
        if (leadId && data?.note) {
          const lead = await prisma.lead.findUnique({
            where: { id: leadId },
            select: { notes: true },
          });
          await prisma.lead
            .update({
              where: { id: leadId },
              data: {
                notes: [lead?.notes, data.note as string]
                  .filter(Boolean)
                  .join("\n\n"),
              },
            })
            .catch(() => {});
        }
        break;
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
