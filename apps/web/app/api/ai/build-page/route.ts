import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";
import { callClaude, checkAiRateLimit, trackAiUsage, parseJsonSafe } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI לא מוגדר בשרת" }, { status: 503 });
  }

  const rate = await checkAiRateLimit(session.userId);
  if (!rate.ok) {
    return NextResponse.json({ error: `הגעת למגבלת ${rate.limit} קריאות AI ליום.` }, { status: 429 });
  }

  const body = await req.json().catch(() => ({})) as { description?: string; clientId?: string };
  const { description, clientId } = body;

  if (!description || !clientId) {
    return NextResponse.json({ error: "חסר תיאור עסק או לקוח" }, { status: 400 });
  }

  // Ownership check
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, name: true, slug: true, ownerId: true },
  });
  if (!client) return NextResponse.json({ error: "לקוח לא נמצא" }, { status: 404 });
  if (!isSuperAdmin(session) && client.ownerId !== session.userId) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const prompt = `אתה מומחה שיווק ישראלי. בנה דף נחיתה שלם בעברית.

תיאור העסק: ${description}

החזר JSON בלבד (ללא markdown):
{
  "landingPageTitle": "כותרת ראשית",
  "landingPageSubtitle": "כותרת משנה",
  "landingPageCta": "טקסט כפתור קריאה לפעולה",
  "landingPageColor": "#xxxxxx (hex color)",
  "whatsappTemplate": "הודעת וואצאפ עם {name}",
  "blocks": [
    { "type": "hero", "content": { "title": "...", "subtitle": "...", "cta": "..." }, "settings": { "backgroundColor": "#ffffff", "textColor": "#000000", "padding": "lg", "alignment": "center" } },
    { "type": "features", "content": { "title": "...", "item1Title": "...", "item1Desc": "...", "item2Title": "...", "item2Desc": "...", "item3Title": "...", "item3Desc": "..." }, "settings": { "backgroundColor": "#f8fafc", "textColor": "#111827", "padding": "md", "alignment": "center" } },
    { "type": "form", "content": { "title": "צור קשר", "subtitle": "מלא את הפרטים ונחזור אליך", "button": "שלח פרטים" }, "settings": { "backgroundColor": "#ffffff", "textColor": "#111827", "padding": "md", "alignment": "center" } },
    { "type": "whatsapp", "content": { "text": "דבר איתנו עכשיו בוואצאפ", "phone": "" }, "settings": { "backgroundColor": "#25d366", "textColor": "#ffffff", "padding": "sm", "alignment": "center" } }
  ],
  "seoTitle": "...",
  "seoDescription": "..."
}

חוקים:
- עברית בלבד
- CTA חזק ומעורר פעולה
- 3 יתרונות ספציפיים לעסק
- צבע מתאים לענף (hex color)
- blocks חייבים לכלול id ייחודי לכל בלוק`;

  let result;
  try {
    result = await callClaude(prompt, 1500);
  } catch {
    return NextResponse.json({ error: "שגיאת AI" }, { status: 502 });
  }

  await trackAiUsage(session.userId, "build-page", result.inputTokens + result.outputTokens);

  type BuildResult = {
    landingPageTitle?: string;
    landingPageSubtitle?: string;
    landingPageCta?: string;
    landingPageColor?: string;
    whatsappTemplate?: string;
    blocks?: unknown[];
    seoTitle?: string;
    seoDescription?: string;
  };

  const parsed = parseJsonSafe<BuildResult>(result.text);
  if (!parsed?.blocks) {
    return NextResponse.json({ error: "שגיאה בפרסור תוצאת AI" }, { status: 500 });
  }

  // Add IDs to blocks if missing
  const blocksWithIds = (parsed.blocks as Array<Record<string, unknown>>).map((b, i) => ({
    ...b,
    id: (b.id as string) || `block-${Date.now()}-${i}`,
  }));

  // Apply all fields to client
  await prisma.client.update({
    where: { id: clientId },
    data: {
      landingPageTitle:    parsed.landingPageTitle ?? null,
      landingPageSubtitle: parsed.landingPageSubtitle ?? null,
      landingPageCta:      parsed.landingPageCta ?? null,
      landingPageColor:    parsed.landingPageColor ?? null,
      whatsappTemplate:    parsed.whatsappTemplate ?? null,
      pageBlocks:          JSON.parse(JSON.stringify(blocksWithIds)),
      pagePublished:       true,
    },
  });

  return NextResponse.json({
    ok: true,
    slug: client.slug,
    previewUrl: `/${client.slug}`,
    landingPageTitle: parsed.landingPageTitle,
    landingPageSubtitle: parsed.landingPageSubtitle,
    landingPageCta: parsed.landingPageCta,
    landingPageColor: parsed.landingPageColor,
    seoTitle: parsed.seoTitle,
    seoDescription: parsed.seoDescription,
    blocksCount: blocksWithIds.length,
  });
}
