import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";
import { emitPagePublished } from "@/lib/automationHooks";

const blockSchema = z.object({
  id: z.string(),
  type: z.enum(["hero", "text", "image", "form", "features", "testimonial", "cta", "whatsapp", "gallery"]),
  content: z.record(z.string()),
  settings: z.object({
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
    padding: z.enum(["sm", "md", "lg"]).optional(),
    alignment: z.enum(["right", "center", "left"]).optional(),
  }),
});

const updateSchema = z.object({
  pageBlocks:     z.array(blockSchema).optional(),
  pagePublished:  z.boolean().optional(),
  pageBlocksB:    z.array(blockSchema).optional(),
  pagePublishedB: z.boolean().optional(),
  abTestEnabled:  z.boolean().optional(),
});

async function verifyOwnership(clientId: string, session: { userId: string; email: string; role: string; clientId: string | null }) {
  if (isSuperAdmin(session)) return true;
  if (session.clientId) return session.clientId === clientId;
  const owned = await prisma.client.findFirst({
    where: { id: clientId, ownerId: session.userId },
    select: { id: true },
  });
  return !!owned;
}

// GET /api/clients/[id]/builder — get page blocks
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await verifyOwnership(params.id, session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      slug: true,
      pageBlocks: true,
      pagePublished: true,
      pageBlocksB: true,
      pagePublishedB: true,
      abTestEnabled: true,
      industry: true,
      whatsappNumber: true,
      primaryColor: true,
    },
  });

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ client });
}

// PUT /api/clients/[id]/builder — save page blocks
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await verifyOwnership(params.id, session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.pageBlocks !== undefined)     data.pageBlocks     = parsed.data.pageBlocks;
  if (parsed.data.pagePublished !== undefined)  data.pagePublished  = parsed.data.pagePublished;
  if (parsed.data.pageBlocksB !== undefined)    data.pageBlocksB    = parsed.data.pageBlocksB;
  if (parsed.data.pagePublishedB !== undefined) data.pagePublishedB = parsed.data.pagePublishedB;
  if (parsed.data.abTestEnabled !== undefined)  data.abTestEnabled  = parsed.data.abTestEnabled;

  const client = await prisma.client.update({
    where: { id: params.id },
    data,
    select: { id: true, pageBlocks: true, pagePublished: true, pageBlocksB: true, pagePublishedB: true, abTestEnabled: true },
  });

  // Emit page.published hook if page was just published
  if (parsed.data.pagePublished === true) {
    emitPagePublished(params.id);
  }

  return NextResponse.json({ client });
}
