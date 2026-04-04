import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deletedLeads = await prisma.lead.deleteMany({
    where: { status: "LOST", createdAt: { lt: new Date(Date.now() - 180 * 86400000) } },
  });

  const deletedReports = await prisma.report.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - 365 * 86400000) } },
  });

  return NextResponse.json({ ok: true, deletedLeads: deletedLeads.count, deletedReports: deletedReports.count });
}
