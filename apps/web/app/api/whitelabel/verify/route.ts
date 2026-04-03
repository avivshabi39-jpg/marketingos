import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";

// TODO: real DNS CNAME lookup with dns.resolve() — verify that `domain` has a CNAME pointing to marketingos.co.il

const verifySchema = z.object({
  clientId: z.string().min(1),
  domain:   z.string().min(3),
});

// POST /api/whitelabel/verify
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { clientId, domain } = parsed.data;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { ownerId: true },
  });

  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  if (!isSuperAdmin(session) && client.ownerId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.client.update({
    where: { id: clientId },
    data: { customDomain: domain },
  });

  return NextResponse.json({ ok: true, verified: true });
}
