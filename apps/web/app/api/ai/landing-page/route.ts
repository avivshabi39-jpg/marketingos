import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { callClaude, checkAiRateLimit, trackAiUsage, parseJsonSafe } from "@/lib/ai";

interface LandingPageResult {
  title: string;
  subtitle: string;
  benefits: string[];
  cta: string;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const aiKey = process.env.ANTHROPIC_API_KEY;
  if (!aiKey || aiKey.startsWith("sk-ant-placeholder")) {
    return NextResponse.json(
      { error: "AI לא זמין — הוסף ANTHROPIC_API_KEY ל-.env.local" },
      { status: 503 }
    );
  }

  const rate = await checkAiRateLimit(session.userId);
  if (!rate.ok) {
    return NextResponse.json(
      { error: `הגעת למגבלת ${rate.limit} קריאות AI ליום. שדרג את התוכנית להמשיך.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({})) as {
    clientId?: string;
    clientName?: string;
    industry?: string;
    city?: string;
    services?: string;
  };

  let clientName = body.clientName ?? "";
  let industry = body.industry ?? "";
  let city = body.city ?? "";
  let services = body.services ?? "";

  // Look up from DB if clientId provided
  if (body.clientId) {
    const client = await prisma.client.findUnique({
      where: { id: body.clientId },
      select: { name: true, industry: true, agentCity: true },
    });
    if (client) {
      clientName = clientName || client.name;
      industry = industry || (client.industry ?? "");
      city = city || (client.agentCity ?? "");
    }
  }

  if (!clientName) {
    return NextResponse.json({ error: "שם לקוח נדרש" }, { status: 400 });
  }

  const industryMap: Record<string, string> = {
    ROOFING: "גגות ואיטום",
    ALUMINUM: "אלומיניום ושמשות",
    COSMETICS: "קוסמטיקה",
    CLEANING: "ניקיון",
    REAL_ESTATE: "נדלן",
    OTHER: "שירותים",
    AVIATION: "תעופה",
    TOURISM: "תיירות",
    FINANCE: "פיננסים",
    LEGAL: "משפטי",
    MEDICAL: "רפואה",
    FOOD: "מזון ומסעדנות",
    FITNESS: "כושר ובריאות",
    EDUCATION: "חינוך",
    GENERAL: "כללי",
  };
  const industryHe = industryMap[industry] || industry || "שירותים";

  const prompt = `כתוב תוכן לדף נחיתה בעברית עבור עסק בתחום ${industryHe}
שם העסק: ${clientName}${city ? `, עיר: ${city}` : ""}${services ? `, שירותים: ${services}` : ""}

צור: כותרת ראשית, כותרת משנה, 3 יתרונות, CTA
פורמט JSON בלבד, ללא הסברים:
{
  "title": "כותרת ראשית מושכת",
  "subtitle": "כותרת משנה שמסבירה את הערך",
  "benefits": ["יתרון 1", "יתרון 2", "יתרון 3"],
  "cta": "טקסט לכפתור פעולה"
}`;

  let result: AiResult;
  try {
    result = await callClaude(prompt, 512);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "AI_NOT_CONFIGURED") {
      return NextResponse.json({ error: "AI לא מוגדר" }, { status: 503 });
    }
    return NextResponse.json({ error: "שגיאה ביצירת תוכן, נסה שוב" }, { status: 502 });
  }

  const parsed = parseJsonSafe<LandingPageResult>(result.text);
  if (!parsed) {
    return NextResponse.json({ error: "שגיאה בעיבוד תשובת AI, נסה שוב" }, { status: 502 });
  }

  await trackAiUsage(session.userId, "landing-page", result.inputTokens + result.outputTokens).catch(() => {});

  return NextResponse.json(parsed);
}

// need AiResult type inline since we re-use it
type AiResult = Awaited<ReturnType<typeof callClaude>>;
