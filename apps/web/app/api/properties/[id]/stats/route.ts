import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id },
    select: {
      clientId: true,
      views: true,
      waClicks: true,
      soldAt: true,
      directLeads: {
        select: { status: true },
      },
    },
  });

  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.clientId && session.clientId !== property.clientId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const leadsCount = property.directLeads.length;

  const leadsByStatus: Record<string, number> = {};
  for (const lead of property.directLeads) {
    const s = lead.status ?? "UNKNOWN";
    leadsByStatus[s] = (leadsByStatus[s] ?? 0) + 1;
  }

  return NextResponse.json({
    views: property.views,
    waClicks: property.waClicks,
    leadsCount,
    leadsByStatus,
    soldAt: property.soldAt,
  });
}
