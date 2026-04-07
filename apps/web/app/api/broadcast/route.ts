import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { rateLimit, getIp } from "@/lib/rateLimit";
import { sanitizeText } from "@/lib/sanitize";
import { triggerN8nWebhook as triggerN8nDirect } from "@/lib/n8n";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  clientId: z.string().min(1),
  message: z.string().min(1).max(4096),
  filter: z.enum(["all", "new", "won", "lost"]).default("all"),
});

// GET /api/broadcast — list recent broadcast logs for this user's clients
export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientIds = session.clientId
    ? [session.clientId]
    : await prisma.client
        .findMany({ where: { ownerId: session.userId }, select: { id: true } })
        .then((cs) => cs.map((c) => c.id));

  const logs = await prisma.broadcastLog.findMany({
    where: { clientId: { in: clientIds } },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { client: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ logs });
}

// POST /api/broadcast — create and start a broadcast job
export async function POST(req: NextRequest) {
  const limited = rateLimit(getIp(req), "broadcast");
  if (limited) return NextResponse.json({ error: "יותר מדי בקשות. נסה שוב בעוד קצת." }, { status: 429 });

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { clientId, filter } = parsed.data;
  const message = sanitizeText(parsed.data.message, 4096);

  // Ownership check
  const client = await prisma.client.findFirst({
    where: { id: clientId, ownerId: session.userId },
    select: { id: true, greenApiInstanceId: true, greenApiToken: true },
  });
  if (!client) return NextResponse.json({ error: "לקוח לא נמצא" }, { status: 404 });
  if (!client.greenApiInstanceId || !client.greenApiToken) {
    return NextResponse.json({ error: "Green API לא מוגדר עבור לקוח זה" }, { status: 400 });
  }

  // Collect recipient phone numbers from leads
  const statusFilter = filter === "all" ? undefined
    : filter === "new" ? "NEW"
    : filter === "won" ? "WON"
    : "LOST";

  const leads = await prisma.lead.findMany({
    where: {
      clientId,
      phone: { not: null },
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    select: { phone: true },
    distinct: ["phone"],
  });

  const phones = leads.map((l) => l.phone!).filter(Boolean);

  if (phones.length === 0) {
    return NextResponse.json({ error: "אין לידים עם מספר טלפון" }, { status: 400 });
  }

  // Create the broadcast log
  const log = await prisma.broadcastLog.create({
    data: {
      clientId,
      message,
      totalCount: phones.length,
      status: "pending",
    },
  });

  // Fire n8n Railway direct webhook
  triggerN8nDirect("broadcast", {
    broadcastId: log.id,
    clientId,
    message,
    totalLeads: phones.length,
    phones,
    createdAt: log.createdAt.toISOString(),
  }).catch(() => {});

  createNotification({
    clientId,
    type: "broadcast_sent",
    title: "שידור נשלח",
    body: `נשלח ל-${phones.length} אנשי קשר`,
  }).catch(() => {});

  return NextResponse.json({ broadcastId: log.id, totalCount: phones.length }, { status: 201 });
}
