import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    daysOld?: number;
    statuses?: string[];
    clientId?: string;
    dryRun?: boolean;
  };

  const { daysOld = 90, statuses = ["LOST"], clientId, dryRun = true } = body;

  const statusFilter = statuses as ("NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "WON" | "LOST")[];

  const where = {
    client: { ownerId: session.userId },
    status: { in: statusFilter },
    createdAt: { lt: new Date(Date.now() - daysOld * 86400000) },
    ...(clientId ? { clientId } : {}),
  };

  const count = await prisma.lead.count({ where });

  if (dryRun) {
    return NextResponse.json({ dryRun: true, wouldDelete: count, message: `יימחקו ${count} לידים` });
  }

  const deleted = await prisma.lead.deleteMany({ where });

  return NextResponse.json({ dryRun: false, deleted: deleted.count, message: `✅ נמחקו ${deleted.count} לידים ישנים` });
}
