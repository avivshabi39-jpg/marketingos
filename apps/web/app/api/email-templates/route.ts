import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name:     z.string().min(1).max(100),
  subject:  z.string().min(1).max(300),
  bodyHtml: z.string().min(1),
  type:     z.enum(["welcome", "followup", "report", "property-alert", "custom"]),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await prisma.emailTemplate.findMany({
    where: { ownerId: session.userId },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const template = await prisma.emailTemplate.create({
    data: { ...parsed.data, ownerId: session.userId },
  });
  return NextResponse.json({ template }, { status: 201 });
}
