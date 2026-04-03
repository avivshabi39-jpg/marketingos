import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const client = await prisma.client.findFirst({
    where: { slug, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      phone: true,
      primaryColor: true,
      industry: true,
      whatsappNumber: true,
      agentPhone: true,
      agentBio: true,
      agentPhoto: true,
      agentCity: true,
      agentExperience: true,
      landingPageLogo: true,
    },
  });

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [activeProperties, soldProperties] = await Promise.all([
    prisma.property.count({ where: { clientId: client.id, status: "AVAILABLE" } }),
    prisma.property.count({ where: { clientId: client.id, status: "SOLD" } }),
  ]);

  return NextResponse.json({
    agent: { ...client, activeProperties, soldProperties },
  });
}
