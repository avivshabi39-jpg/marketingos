import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { decrypt } from "@/lib/encrypt";

export const dynamic = "force-dynamic";

// POST /api/broadcast/:id/send — streaming send of WhatsApp messages
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const log = await prisma.broadcastLog.findUnique({
    where: { id: params.id },
    include: {
      client: {
        select: {
          id: true,
          ownerId: true,
          greenApiInstanceId: true,
          greenApiToken: true,
        },
      },
    },
  });

  if (!log) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  if (log.client.ownerId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (log.status === "running") return NextResponse.json({ error: "כבר רץ" }, { status: 409 });

  const instanceId = log.client.greenApiInstanceId!;
  const rawToken = decrypt(log.client.greenApiToken!);

  // Fetch recipients
  const leads = await prisma.lead.findMany({
    where: { clientId: log.clientId, phone: { not: null } },
    select: { phone: true },
    distinct: ["phone"],
  });
  const phones = leads.map((l) => l.phone!).filter(Boolean);

  // Update status to running
  await prisma.broadcastLog.update({
    where: { id: log.id },
    data: { status: "running", totalCount: phones.length },
  });

  // Streaming SSE response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let sent = 0;
      let failed = 0;

      function push(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      push({ type: "start", total: phones.length });

      for (const phone of phones) {
        const normalized = phone.replace(/[^0-9]/g, "");
        const chatId = normalized.startsWith("972")
          ? `${normalized}@c.us`
          : `972${normalized.replace(/^0/, "")}@c.us`;

        try {
          const res = await fetch(
            `https://api.green-api.com/waInstance${instanceId}/sendMessage/${rawToken}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chatId, message: log.message }),
            }
          );
          if (res.ok) {
            sent++;
            push({ type: "progress", sent, failed, phone });
          } else {
            failed++;
            push({ type: "progress", sent, failed, phone, error: true });
          }
        } catch {
          failed++;
          push({ type: "progress", sent, failed, phone, error: true });
        }

        // Throttle: 1 message per second to avoid rate limits
        await new Promise((r) => setTimeout(r, 1000));
      }

      await prisma.broadcastLog.update({
        where: { id: log.id },
        data: {
          status: "done",
          sentCount: sent,
          failCount: failed,
          completedAt: new Date(),
        },
      });

      push({ type: "done", sent, failed });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
