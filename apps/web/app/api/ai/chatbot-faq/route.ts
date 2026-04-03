import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { callClaude, parseJsonSafe, checkAiRateLimit } from "@/lib/ai";

interface FAQItem {
  q: string;
  a: string;
}

// POST /api/ai/chatbot-faq
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rate = await checkAiRateLimit(session.userId);
  if (!rate.ok) {
    return NextResponse.json({ error: `הגעת למגבלת ${rate.limit} קריאות AI ליום.` }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { clientId } = body as { clientId?: string };
  if (!clientId) return NextResponse.json({ error: "clientId is required" }, { status: 400 });

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, name: true, industry: true, ownerId: true },
  });

  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI לא מוגדר בשרת" }, { status: 503 });
  }

  const industryMap: Record<string, string> = {
    ROOFING: "גגות ואיטום",
    ALUMINUM: "אלומיניום ושמשות",
    COSMETICS: "קוסמטיקה",
    CLEANING: "ניקיון",
    REAL_ESTATE: "נדל\"ן",
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

  const industryHe = client.industry
    ? (industryMap[client.industry] ?? client.industry)
    : "שירותים";

  const prompt = `צור 5 שאלות ותשובות נפוצות (FAQ) לצ'אטבוט של עסק בשם "${client.name}" בתחום ${industryHe}.

החזר JSON בלבד, ללא הסברים:
[
  { "q": "שאלה נפוצה 1?", "a": "תשובה קצרה ומקצועית" },
  { "q": "שאלה נפוצה 2?", "a": "תשובה קצרה ומקצועית" },
  { "q": "שאלה נפוצה 3?", "a": "תשובה קצרה ומקצועית" },
  { "q": "שאלה נפוצה 4?", "a": "תשובה קצרה ומקצועית" },
  { "q": "שאלה נפוצה 5?", "a": "תשובה קצרה ומקצועית" }
]

השאלות צריכות להיות רלוונטיות לתחום ${industryHe}, בעברית, ריאליות ושימושיות ללקוח.`;

  try {
    const result = await callClaude(prompt, 1024);
    const parsed = parseJsonSafe<FAQItem[]>(result.text);
    if (!parsed || !Array.isArray(parsed)) {
      return NextResponse.json({ error: "שגיאה בעיבוד תשובת AI, נסה שוב" }, { status: 502 });
    }
    return NextResponse.json({ faq: parsed });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "AI_NOT_CONFIGURED") {
      return NextResponse.json({ error: "AI לא מוגדר" }, { status: 503 });
    }
    return NextResponse.json({ error: "שגיאה ביצירת שאלות, נסה שוב" }, { status: 502 });
  }
}
