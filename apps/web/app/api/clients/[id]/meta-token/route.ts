import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";
import { exchangeForLongLivedToken, getPageToken, inspectToken } from "@/lib/metaToken";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  const clientSession = !session ? await getClientSession() : null;
  if (!session && !clientSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    select: { facebookAccessToken: true, facebookLeadsEnabled: true },
  });

  if (!client?.facebookAccessToken) {
    return NextResponse.json({ hasToken: false, isValid: false, status: "אין טוקן" });
  }

  const info = await inspectToken(client.facebookAccessToken);

  return NextResponse.json({
    hasToken: true,
    ...info,
    needsRefresh: info.daysUntilExpiry !== null && info.daysUntilExpiry < 14,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shortLivedToken, action } = (await req.json().catch(() => ({}))) as {
    shortLivedToken?: string;
    action?: string;
  };

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    select: { facebookAccessToken: true, facebookPageId: true },
  });

  if (action === "exchange" && shortLivedToken) {
    const longLived = await exchangeForLongLivedToken(shortLivedToken);
    if (!longLived) {
      return NextResponse.json({ error: "Failed to exchange token" }, { status: 400 });
    }

    let finalToken = longLived.token;
    if (client?.facebookPageId) {
      const pageToken = await getPageToken(longLived.token, client.facebookPageId);
      if (pageToken) finalToken = pageToken;
    }

    await prisma.client.update({
      where: { id: params.id },
      data: { facebookAccessToken: finalToken },
    });

    return NextResponse.json({ ok: true, message: "טוקן עודכן בהצלחה" });
  }

  if (action === "refresh" && client?.facebookAccessToken && client.facebookPageId) {
    const pageToken = await getPageToken(client.facebookAccessToken, client.facebookPageId);
    if (pageToken) {
      await prisma.client.update({
        where: { id: params.id },
        data: { facebookAccessToken: pageToken },
      });
      return NextResponse.json({ ok: true, message: "טוקן רוענן בהצלחה" });
    }
    return NextResponse.json({ error: "Failed to refresh" }, { status: 400 });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
