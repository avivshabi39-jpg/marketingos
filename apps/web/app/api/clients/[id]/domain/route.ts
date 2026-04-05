import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  const clientSession = !session ? await getClientSession() : null;
  if (!session && !clientSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (clientSession && clientSession.clientId !== params.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
  const session = await getSession();
  const clientSession = !session ? await getClientSession() : null;
  if (!session && !clientSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (clientSession && clientSession.clientId !== params.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
  const session = await getSession();
  const clientSession = !session ? await getClientSession() : null;
  if (!session && !clientSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (clientSession && clientSession.clientId !== params.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.client.update({
    where: { id: params.id },
    data: { customDomain: null, customDomainVerified: false },
  });

  return NextResponse.json({ ok: true });
}
