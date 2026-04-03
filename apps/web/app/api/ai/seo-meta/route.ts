import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
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
    title?: string;
    description?: string;
    industry?: string;
    city?: string;
  };

  const { title = "", description = "", industry = "", city = "" } = body;

  const prompt = `כתוב כותרת SEO ותיאור מטא בעברית עבור דף עסקי.
${title ? `שם העסק: ${title}` : ""}${industry ? `\nתחום: ${industry}` : ""}${city ? `\nעיר: ${city}` : ""}${description ? `\nתיאור: ${description}` : ""}
דרישות: כותרת עד 60 תווים, תיאור מטא 120-160 תווים, עם מילות מפתח רלוונטיות.
פורמט JSON בלבד:
{
  "seoTitle": "כותרת SEO עד 60 תווים",
  "seoDescription": "תיאור מטא 120-160 תווים"
}`;

  let result;
  try {
    result = await callClaude(prompt, 256);
  } catch {
    return NextResponse.json({ error: "שגיאה ביצירת תוכן, נסה שוב" }, { status: 502 });
  }

  const parsed = parseJsonSafe<{ seoTitle: string; seoDescription: string }>(result.text);
  if (!parsed) {
    return NextResponse.json({ error: "שגיאה בעיבוד תשובת AI" }, { status: 502 });
  }

  await trackAiUsage(session.userId, "seo-meta", result.inputTokens + result.outputTokens).catch(() => {});

  return NextResponse.json(parsed);
}
