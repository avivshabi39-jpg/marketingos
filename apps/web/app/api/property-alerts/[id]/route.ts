import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const alert = await prisma.propertyAlert.findUnique({
    where: { id: params.id },
    include: { client: { select: { ownerId: true } } },
  });
  if (!alert) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (alert.client.ownerId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.propertyAlert.update({ where: { id: params.id }, data: { isActive: false } });
  return new NextResponse(null, { status: 204 });
}
