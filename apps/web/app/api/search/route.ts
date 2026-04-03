import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  if (q.length < 2) {
    return NextResponse.json({ leads: [], clients: [] });
  }

  // Determine owned client IDs
  let ownedClientIds: string[];
  if (session.role === "SUPER_ADMIN") {
    const allClients = await prisma.client.findMany({ select: { id: true } });
    ownedClientIds = allClients.map((c) => c.id);
  } else {
    const ownedClients = await prisma.client.findMany({
      where: { ownerId: session.userId },
      select: { id: true },
    });
    ownedClientIds = ownedClients.map((c) => c.id);
  }

  const [leads, clients] = await Promise.all([
    prisma.lead.findMany({
      where: {
        clientId: { in: ownedClientIds },
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
        ],
      },
      take: 5,
      include: { client: { select: { name: true } } },
    }),
    prisma.client.findMany({
      where: {
        ownerId: session.role === "SUPER_ADMIN" ? undefined : session.userId,
        name: { contains: q, mode: "insensitive" },
      },
      take: 3,
    }),
  ]);

  return NextResponse.json({
    leads: leads.map((l) => ({
      id: l.id,
      firstName: l.firstName,
      lastName: l.lastName,
      phone: l.phone,
      status: l.status,
      client: { name: l.client.name },
    })),
    clients: clients.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      primaryColor: c.primaryColor,
    })),
  });
}
