import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ReportPDF } from "@/components/admin/ReportPDF";
import React from "react";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const report = await prisma.report.findUnique({
    where: { id: params.id },
    include: { client: { select: { name: true, primaryColor: true, ownerId: true } } },
  });

  if (!report) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  const allowed =
    session.clientId === report.clientId ||
    report.client.ownerId === session.userId ||
    session.role === "SUPER_ADMIN";

  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { renderToBuffer } = await import("@react-pdf/renderer") as { renderToBuffer: (doc: React.ReactElement) => Promise<Uint8Array> };
  const uint8 = await renderToBuffer(React.createElement(ReportPDF, { report }));
  const buffer = Buffer.from(uint8);

  const filename = `report-${report.client.name.replace(/\s+/g, "-")}-${report.period}.pdf`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(buffer.byteLength),
    },
  });
}
