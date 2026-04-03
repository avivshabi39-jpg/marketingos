import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, getIp } from "@/lib/rateLimit";

const schema = z.object({
  clientSlug: z.string().min(1),
  page: z.string().min(1),
  source: z.string().optional(),
});

// POST /api/track — fast page view tracking, no auth required
export async function POST(req: NextRequest) {
  // Rate limit by IP to prevent spam (100 per minute)
  const ip = getIp(req);
  const limited = rateLimit(ip, "intake"); // reuse intake preset (20/min)
  if (limited) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { clientSlug, page, source } = parsed.data;

  const client = await prisma.client.findUnique({
    where: { slug: clientSlug },
    select: { id: true, isActive: true },
  });

  if (!client || !client.isActive) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  await prisma.pageView.create({
    data: { clientId: client.id, page, source: source ?? null },
  });

  return NextResponse.json({ ok: true });
}
