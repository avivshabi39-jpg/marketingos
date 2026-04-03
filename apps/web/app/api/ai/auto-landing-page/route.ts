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
    return NextResponse.json(
      { error: `הגעת למגבלת ${rate.limit} קריאות AI ליום.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({})) as {
    clientId?: string;
    formId?: string;
  };

  const { clientId, formId } = body;
  if (!clientId) return NextResponse.json({ error: "חסר clientId" }, { status: 400 });

  // Ownership check
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, name: true, slug: true, industry: true, ownerId: true },
  });
  if (!client) return NextResponse.json({ error: "לקוח לא נמצא" }, { status: 404 });
  if (!isSuperAdmin(session) && client.ownerId !== session.userId) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  // Get the intake form answers
  let answers: Record<string, string> = {};
  if (formId) {
    const form = await prisma.intakeForm.findUnique({
      where: { id: formId },
      select: {
        businessName: true, businessType: true, targetAudience: true,
        uniqueSellingPoint: true, mainGoal: true, description: true,
        painPoints: true, marketingChannels: true, budgetRange: true,
        operatingAreas: true, goals: true, extraData: true,
      },
    });
    if (form) {
      const extra = (typeof form.extraData === "object" && form.extraData)
        ? form.extraData as Record<string, string>
        : {};
      answers = {
        businessName:        form.businessName ?? "",
        businessType:        form.businessType ?? "",
        targetAudience:      form.targetAudience ?? "",
        uniqueSellingPoint:  form.uniqueSellingPoint ?? "",
        mainGoal:            form.mainGoal ?? "",
        description:         form.description ?? "",
        painPoints:          form.painPoints ?? "",
        marketingChannels:   form.marketingChannels ?? "",
        budgetRange:         form.budgetRange ?? "",
        operatingAreas:      form.operatingAreas ?? "",
        goals:               form.goals ?? "",
        ...extra,
      };
    }
  }

  const industryMap: Record<string, string> = {
    ROOFING:      "גגות ואלומיניום",
    ALUMINUM:     "גגות ואלומיניום",
    COSMETICS:    "קוסמטיקה ויופי",
    CLEANING:     "ניקיון",
    REAL_ESTATE:  "נדל\"ן",
    OTHER:        "כללי",
    AVIATION:     "תעופה",
    TOURISM:      "תיירות",
    FINANCE:      "פיננסים",
    LEGAL:        "משפטי",
    MEDICAL:      "רפואה",
    FOOD:         "מזון ומסעדנות",
    FITNESS:      "כושר ובריאות",
    EDUCATION:    "חינוך",
    GENERAL:      "כללי",
  };
  const industryHe = industryMap[client.industry ?? ""] ?? "כללי";

  const answersText = Object.entries(answers)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  const prompt = `אתה מעצב דפי נחיתה מקצועי. צור דף נחיתה שלם בעברית עבור העסק "${client.name}" בתחום "${industryHe}".

תשובות מטופס קבלת לקוח:
${answersText || "לא סופקו תשובות — צור דף מבוסס על שם העסק ותחום הפעילות"}

החזר JSON בלבד (ללא markdown) עם מפתח "blocks" — מערך של בלוקים לדף הנחיתה:

{
  "blocks": [
    {
      "type": "hero",
      "data": {
        "headline": "...",
        "subheadline": "...",
        "ctaText": "צור קשר עכשיו",
        "ctaPhone": ""
      }
    },
    {
      "type": "features",
      "data": {
        "title": "למה לבחור בנו?",
        "items": [
          {"icon": "✅", "title": "...", "desc": "..."},
          {"icon": "⭐", "title": "...", "desc": "..."},
          {"icon": "🏆", "title": "...", "desc": "..."}
        ]
      }
    },
    {
      "type": "about",
      "data": {
        "title": "...",
        "text": "..."
      }
    },
    {
      "type": "cta",
      "data": {
        "headline": "...",
        "buttonText": "השאר פרטים ונחזור אליך"
      }
    }
  ]
}

הדף צריך להיות ספציפי לתחום ${industryHe}. כתוב בעברית, RTL, טון שיווקי ומקצועי.`;

  let result;
  try {
    result = await callClaude(prompt, 1200);
  } catch {
    return NextResponse.json({ error: "שגיאת AI" }, { status: 502 });
  }

  await trackAiUsage(session.userId, "auto-landing-page", result.inputTokens + result.outputTokens);

  const parsed = parseJsonSafe<{ blocks: unknown[] }>(result.text);
  if (!parsed?.blocks) {
    return NextResponse.json({ error: "שגיאה בפרסור תוצאת AI" }, { status: 500 });
  }

  // Save to client.pageBlocks and publish
  await prisma.client.update({
    where: { id: clientId },
    data: {
      pageBlocks:    JSON.parse(JSON.stringify(parsed.blocks)),
      pagePublished: true,
    },
  });

  return NextResponse.json({ ok: true, slug: client.slug, blocksCount: parsed.blocks.length });
}
