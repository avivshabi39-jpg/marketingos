import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";
import { triggerN8nWebhook } from "@/lib/webhooks";

const schema = z.object({
  clientId: z.string().min(1),
  period:   z.enum(["WEEKLY", "MONTHLY", "weekly", "monthly"])
              .transform((p) => p.toUpperCase() as "WEEKLY" | "MONTHLY"),
});

function getPeriodRange(period: "WEEKLY" | "MONTHLY"): {
  start: Date;
  end: Date;
  label: string;
} {
  const now = new Date();
  if (period === "WEEKLY") {
    const day = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    const year = start.getFullYear();
    const week = Math.ceil(
      ((start.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7
    );
    return { start, end, label: `${year}-W${String(week).padStart(2, "0")}` };
  } else {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const label = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return { start, end, label };
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { clientId, period } = parsed.data;

  // Scope check: scoped agent, super-admin, or verify ownership
  if (session.clientId && session.clientId !== clientId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, name: true, reportEmail: true, ownerId: true },
  });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  // Regular admin must own the client
  if (!session.clientId && !isSuperAdmin(session) && client.ownerId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { start, end, label } = getPeriodRange(period);

  const leads = await prisma.lead.findMany({
    where: { clientId, createdAt: { gte: start, lte: end } },
    select: { status: true, source: true, value: true },
  });

  const totalLeads = leads.length;
  const wonLeads = leads.filter((l) => l.status === "WON").length;
  const lostLeads = leads.filter((l) => l.status === "LOST").length;
  const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;
  const revenue = leads
    .filter((l) => l.status === "WON")
    .reduce((sum, l) => sum + (l.value ?? 0), 0);

  // Source breakdown
  const sourceCount: Record<string, number> = {};
  for (const l of leads) {
    const src = l.source ?? "other";
    sourceCount[src] = (sourceCount[src] ?? 0) + 1;
  }
  const topSource = Object.entries(sourceCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const report = await prisma.report.create({
    data: {
      clientId,
      type: period,
      period: label,
      totalLeads,
      wonLeads,
      lostLeads,
      conversionRate,
      topSource,
      revenue: revenue > 0 ? revenue : null,
    },
  });

  // Trigger n8n webhook
  triggerN8nWebhook(clientId, "report.generated", {
    report: {
      id: report.id,
      type: period,
      period: label,
      totalLeads,
      wonLeads,
      conversionRate: conversionRate.toFixed(1),
      revenue,
      topSource,
    },
  }).catch(() => {});

  return NextResponse.json({ report, sourceBreakdown: sourceCount });
}
