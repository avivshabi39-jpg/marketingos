import { NextRequest, NextResponse } from "next/server";
import { getSession, isSuperAdmin } from "@/lib/auth";
import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";

// Shared ownership check for all handlers in this route
async function verifyAccess(params: { id: string }) {
  const session = await getSession();
  const clientSession = !session ? await getClientSession() : null;
  if (!session && !clientSession) return { error: "Unauthorized", status: 401 } as const;

  // Client portal: must match their own clientId
  if (clientSession && clientSession.clientId !== params.id) {
    return { error: "Forbidden", status: 403 } as const;
  }

  // Admin: super-admin can access any, regular admin must own the client
  if (session && !isSuperAdmin(session)) {
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      select: { ownerId: true },
    });
    if (!client || client.ownerId !== session.userId) {
      return { error: "Forbidden", status: 403 } as const;
    }
  }

  return { ok: true } as const;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await verifyAccess(params);
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    select: {
      slug: true,
      customDomain: true,
      customDomainVerified: true,
      subdomainActive: true,
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rootDomain =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN || "marketingos.co.il";

  return NextResponse.json({
    subdomain: `${client.slug}.${rootDomain}`,
    customDomain: client.customDomain,
    customDomainVerified: client.customDomainVerified,
    subdomainActive: client.subdomainActive,
    rootDomain,
    dnsInstructions: client.customDomain
      ? {
          type: "CNAME",
          name: "@",
          value: "cname.vercel-dns.com",
          ttl: 3600,
        }
      : null,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await verifyAccess(params);
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const body = await req.json().catch(() => null);
  const customDomain = body?.customDomain as string | undefined;

  if (!customDomain) {
    return NextResponse.json({ error: "חסר דומיין" }, { status: 400 });
  }

  const domainRegex =
    /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
  if (!domainRegex.test(customDomain)) {
    return NextResponse.json(
      { error: "פורמט דומיין לא תקין" },
      { status: 400 }
    );
  }

  const existing = await prisma.client.findFirst({
    where: { customDomain, id: { not: params.id } },
  });

  if (existing) {
    return NextResponse.json(
      { error: "הדומיין כבר בשימוש" },
      { status: 409 }
    );
  }

  await prisma.client.update({
    where: { id: params.id },
    data: { customDomain, customDomainVerified: false },
  });

  return NextResponse.json({
    ok: true,
    message: "הדומיין נשמר — עקוב אחרי הוראות ה-DNS",
    dnsInstructions: {
      type: "CNAME",
      name: "@",
      value: "cname.vercel-dns.com",
      ttl: 3600,
    },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await verifyAccess(params);
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  await prisma.client.update({
    where: { id: params.id },
    data: { customDomain: null, customDomainVerified: false },
  });

  return NextResponse.json({ ok: true });
}
