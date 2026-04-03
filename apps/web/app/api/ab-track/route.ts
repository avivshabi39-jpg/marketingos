import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/ab-track — track A/B test event (no auth required, called from public landing page)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as {
    clientId?: string;
    version?: "A" | "B";
    event?: "view" | "submit";
  };

  const { clientId, version, event } = body;
  if (!clientId || !version || !event) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (version !== "A" && version !== "B") return NextResponse.json({ error: "Invalid version" }, { status: 400 });
  if (event !== "view" && event !== "submit") return NextResponse.json({ error: "Invalid event" }, { status: 400 });

  // Only track if client has A/B test enabled
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { abTestEnabled: true },
  });
  if (!client?.abTestEnabled) return NextResponse.json({ ok: true, skipped: true });

  await prisma.abTestEvent.create({ data: { clientId, version, event } });

  return NextResponse.json({ ok: true });
}
