import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// DELETE /api/offices/:id/agents/:agentId — remove agent from office
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; agentId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const office = await prisma.office.findUnique({ where: { id: params.id }, select: { ownerId: true } });
  if (!office || office.ownerId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.client.update({
    where: { id: params.agentId },
    data: { officeId: null },
  });

  return new NextResponse(null, { status: 204 });
}
