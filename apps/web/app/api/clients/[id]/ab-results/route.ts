import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    select: { ownerId: true, abTestEnabled: true, pagePublished: true, pagePublishedB: true },
  });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isSuperAdmin(session) && client.ownerId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const events = await prisma.abTestEvent.findMany({
    where: { clientId: params.id },
    select: { version: true, event: true },
  });

  const result = {
    A: { views: 0, submits: 0 },
    B: { views: 0, submits: 0 },
  };

  for (const e of events) {
    const v = e.version as "A" | "B";
    if (v !== "A" && v !== "B") continue;
    if (e.event === "view") result[v].views++;
    else if (e.event === "submit") result[v].submits++;
  }

  const convA = result.A.views > 0 ? ((result.A.submits / result.A.views) * 100).toFixed(1) : "0.0";
  const convB = result.B.views > 0 ? ((result.B.submits / result.B.views) * 100).toFixed(1) : "0.0";

  return NextResponse.json({
    abTestEnabled: client.abTestEnabled,
    A: { ...result.A, conversion: convA },
    B: { ...result.B, conversion: convB },
    winner: parseFloat(convA) > parseFloat(convB) ? "A" : parseFloat(convB) > parseFloat(convA) ? "B" : null,
  });
}
