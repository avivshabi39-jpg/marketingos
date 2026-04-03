import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";

const createSchema = z.object({
  clientId: z.string().min(1),
  content:  z.string().min(1).max(5000),
  platform: z.string().min(1),
  imageUrl: z.string().url().optional().or(z.literal("")),
  status:   z.enum(["draft", "published", "scheduled"]).optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");

  const where = isSuperAdmin(session)
    ? clientId ? { clientId } : {}
    : { client: { ownerId: session.userId }, ...(clientId ? { clientId } : {}) };

  const posts = await prisma.socialPost.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true, clientId: true, content: true, platform: true,
      status: true, imageUrl: true, createdAt: true,
      client: { select: { name: true } },
    },
  });

  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "קלט לא תקין" }, { status: 400 });

  const { clientId, content, platform, imageUrl, status } = parsed.data;

  // Ownership check
  if (!isSuperAdmin(session)) {
    const client = await prisma.client.findUnique({ where: { id: clientId }, select: { ownerId: true } });
    if (!client || client.ownerId !== session.userId) {
      return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
    }
  }

  const post = await prisma.socialPost.create({
    data: {
      clientId,
      content,
      platform,
      imageUrl: imageUrl || null,
      status: status ?? "draft",
    },
    select: {
      id: true, clientId: true, content: true, platform: true,
      status: true, imageUrl: true, createdAt: true,
      client: { select: { name: true } },
    },
  });

  return NextResponse.json({ post }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "חסר id" }, { status: 400 });

  // Ownership check
  if (!isSuperAdmin(session)) {
    const post = await prisma.socialPost.findUnique({
      where: { id },
      select: { client: { select: { ownerId: true } } },
    });
    if (!post || post.client.ownerId !== session.userId) {
      return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
    }
  }

  await prisma.socialPost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
