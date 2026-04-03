import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// POST — select A or B as winner, copy its blocks to pageBlocks, disable A/B test
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { winner } = await req.json().catch(() => ({})) as { winner?: "A" | "B" };
  if (winner !== "A" && winner !== "B") {
    return NextResponse.json({ error: "winner must be A or B" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    select: { ownerId: true, pageBlocks: true, pageBlocksB: true },
  });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isSuperAdmin(session) && client.ownerId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const winningBlocks = winner === "A" ? client.pageBlocks : client.pageBlocksB;

  await prisma.client.update({
    where: { id: params.id },
    data: {
      pageBlocks:    winningBlocks ?? Prisma.JsonNull,
      pagePublished: true,
      abTestEnabled: false,
      pageBlocksB:   Prisma.JsonNull,
      pagePublishedB: false,
    },
  });

  return NextResponse.json({ ok: true, winner });
}
