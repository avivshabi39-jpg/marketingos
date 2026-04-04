import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";
import { callClaude, checkAiRateLimit, trackAiUsage, parseJsonSafe } from "@/lib/ai";

interface WizardData {
  businessName?: string;
  industry?: string;
  city?: string;
  // Briefing fields
  services?: string;
  targetAudience?: string;
  problemSolved?: string;
  priceRange?: string;
  nextAction?: string;
  testimonial?: string;
  // Legacy fields
  description?: string;
  uniqueValue?: string;
  targetAge?: string;
  problem?: string;
  cta?: string;
}

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

  const body = await req.json().catch(() => ({})) as { clientId?: string; wizardData?: WizardData };
  const { clientId, wizardData } = body;

  if (!clientId || !wizardData) {
    return NextResponse.json({ error: "חסרים פרמטרים" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, name: true, slug: true, ownerId: true, industry: true, whatsappNumber: true },
  });
  if (!client) return NextResponse.json({ error: "לקוח לא נמצא" }, { status: 404 });
  if (!isSuperAdmin(session) && client.ownerId !== session.userId) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const {
    businessName = client.name,
    industry = client.industry ?? "כללי",
    city = "",
    // Briefing fields
    services = "",
    targetAudience = "",
    problemSolved = "",
    priceRange = "",
    nextAction = "call",
    testimonial = "",
    // Legacy fields (backward compat)
    description = "",
    uniqueValue = "",
    targetAge = "",
    problem = "",
    cta = "שלח פרטים",
  } = wizardData;

  const ACTION_LABELS: Record<string, string> = {
    call: "אתקשר אליו",
    whatsapp: "אשלח לו וואצאפ",
    meeting: "יקבע פגישה",
    email: "יקבל מייל",
  };

  const ctaText = cta !== "שלח פרטים" ? cta :
    nextAction === "meeting" ? "קבע פגישה" :
    nextAction === "whatsapp" ? "דבר איתנו בוואצאפ" :
    nextAction === "email" ? "קבל פרטים במייל" : "שלח פרטים";

  const prompt = `אתה מומחה שיווק ישראלי מנוסה. בנה דף נחיתה מקצועי ומשכנע בעברית.

פרטי העסק:
- שם: ${businessName}
- ענף: ${industry}
- עיר: ${city}
- מה מוכרים/נותנים: ${services || description}
- מה מיוחד: ${uniqueValue}

הלקוח המטרה:
- קהל יעד: ${targetAudience || targetAge}
- הבעיה שפותרים: ${problemSolved || problem}
- טווח מחירים: ${priceRange}
- מה קורה אחרי ליד: ${ACTION_LABELS[nextAction] ?? nextAction}
${testimonial ? `- המלצת לקוח: "${testimonial}"` : ""}
- קריאה לפעולה: ${ctaText}

החזר JSON בלבד (ללא markdown):
{
  "landingPageTitle": "כותרת ראשית חזקה ומשכנעת",
  "landingPageSubtitle": "כותרת משנה שמסבירה את הערך",
  "landingPageCta": "${ctaText}",
  "landingPageColor": "#xxxxxx",
  "whatsappTemplate": "הודעת ברכה עם {name}",
  "blocks": [
    { "type": "hero", "content": { "title": "...", "subtitle": "...", "cta": "${ctaText}" }, "settings": { "backgroundColor": "#1a1a2e", "textColor": "#ffffff", "padding": "lg", "alignment": "center" } },
    { "type": "features", "content": { "title": "למה לבחור בנו?", "item1Title": "...", "item1Desc": "...", "item2Title": "...", "item2Desc": "...", "item3Title": "...", "item3Desc": "..." }, "settings": { "backgroundColor": "#f8fafc", "textColor": "#111827", "padding": "md", "alignment": "center" } },
    { "type": "testimonial", "content": { "quote": "${testimonial || "ביקורת חיובית משכנעת מלקוח"}", "author": "שם הלקוח", "role": "תפקיד" }, "settings": { "backgroundColor": "#ffffff", "textColor": "#111827", "padding": "md", "alignment": "center" } },
    { "type": "form", "content": { "title": "צור קשר", "subtitle": "השאר פרטים ונחזור אליך", "button": "${ctaText}" }, "settings": { "backgroundColor": "#ffffff", "textColor": "#111827", "padding": "md", "alignment": "center" } },
    { "type": "whatsapp", "content": { "text": "דבר איתנו עכשיו בוואצאפ", "phone": "${client.whatsappNumber ?? ""}" }, "settings": { "backgroundColor": "#25d366", "textColor": "#ffffff", "padding": "sm", "alignment": "center" } }
  ]
}

חוקים:
- עברית בלבד, שפה שיווקית חמה ומקצועית
- כותרת ראשית קצרה (עד 8 מילים), חזקה ומעוררת פעולה
- 3 יתרונות ספציפיים ומשכנעים לעסק הזה
- צבע מתאים לענף ${industry}
- ביקורת ריאליסטית ומשכנעת
- כל בלוק חייב לכלול id ייחודי`;

  let result;
  try {
    result = await callClaude(prompt, 2000);
  } catch {
    return NextResponse.json({ error: "שגיאת AI — נסה שוב" }, { status: 502 });
  }

  await trackAiUsage(session.userId, "build-landing-page", result.inputTokens + result.outputTokens);

  type BuildResult = {
    landingPageTitle?: string;
    landingPageSubtitle?: string;
    landingPageCta?: string;
    landingPageColor?: string;
    whatsappTemplate?: string;
    blocks?: unknown[];
  };

  const parsed = parseJsonSafe<BuildResult>(result.text);
  if (!parsed?.blocks) {
    return NextResponse.json({ error: "שגיאה בפרסור תוצאת AI — נסה שוב" }, { status: 500 });
  }

  const blocksWithIds = (parsed.blocks as Array<Record<string, unknown>>).map((b, i) => ({
    ...b,
    id: (b.id as string) || `block-${Date.now()}-${i}`,
  }));

  await prisma.client.update({
    where: { id: clientId },
    data: {
      landingPageTitle: parsed.landingPageTitle ?? null,
      landingPageSubtitle: parsed.landingPageSubtitle ?? null,
      landingPageCta: parsed.landingPageCta ?? null,
      landingPageColor: parsed.landingPageColor ?? null,
      whatsappTemplate: parsed.whatsappTemplate ?? null,
      pageBlocks: JSON.parse(JSON.stringify(blocksWithIds)),
      pagePublished: true,
    },
  });

  return NextResponse.json({
    ok: true,
    slug: client.slug,
    previewUrl: `/${client.slug}`,
    landingPageTitle: parsed.landingPageTitle,
    landingPageColor: parsed.landingPageColor,
    blocksCount: blocksWithIds.length,
  });
}
