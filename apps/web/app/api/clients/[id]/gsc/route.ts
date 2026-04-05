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
      name: true,
      customDomain: true,
      customDomainVerified: true,
      pagePublished: true,
      gscConnected: true,
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const siteUrl =
    client.customDomain && client.customDomainVerified
      ? `https://${client.customDomain}`
      : `${appUrl}/${client.slug}`;
  const sitemapUrl = `${appUrl}/sitemap.xml`;

  return NextResponse.json({
    siteUrl,
    sitemapUrl,
    pagePublished: client.pagePublished,
    gscConnected: client.gscConnected,
    steps: [
      {
        id: 1,
        title: "פתח Google Search Console",
        description:
          "היכנס לחשבון גוגל שלך ופתח את Search Console",
        url: "https://search.google.com/search-console",
        action: "פתח GSC",
      },
      {
        id: 2,
        title: "הוסף נכס (Property)",
        description: `לחץ "הוסף נכס" והכנס את הכתובת:\n${siteUrl}`,
        url: "https://search.google.com/search-console/welcome",
        action: "הוסף נכס",
      },
      {
        id: 3,
        title: "אמת בעלות",
        description:
          'בחר "HTML tag" → העתק את התג → הכנס למטה',
        url: null,
        action: null,
      },
      {
        id: 4,
        title: "הגש Sitemap",
        description: `לחץ על "Sitemaps" ב-GSC והכנס:\n${sitemapUrl}`,
        url: "https://search.google.com/search-console/sitemaps",
        action: "פתח Sitemaps",
      },
      {
        id: 5,
        title: "בקש אינדוקס",
        description: `העתק: ${siteUrl}\n\nלחץ "בדיקת כתובת URL" והגש לאינדוקס`,
        url: "https://search.google.com/search-console/inspect",
        action: "פתח כלי בדיקה",
      },
    ],
    tips: [
      !client.pagePublished &&
        "⚠️ פרסם את הדף שלך קודם — גוגל לא יכול לאנדקס דף שלא פורסם",
      client.customDomain &&
        !client.customDomainVerified &&
        "⚠️ הדומיין המותאם שלך עדיין לא מאומת",
      "✅ הדף שלך כולל sitemap.xml אוטומטי",
      "✅ JSON-LD (מידע עסקי) מוגדר אוטומטית",
      "⏳ אינדוקס לוקח בדרך כלל 24-72 שעות",
    ].filter(Boolean),
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
  const verificationTag = body?.verificationTag as string | undefined;

  if (verificationTag) {
    await prisma.client.update({
      where: { id: params.id },
      data: { gscVerificationTag: verificationTag },
    });
  }

  return NextResponse.json({
    ok: true,
    message: "תג האימות נשמר — כעת אמת ב-Google Search Console",
  });
}
