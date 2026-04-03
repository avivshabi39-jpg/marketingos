import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { callClaude, checkAiRateLimit, trackAiUsage, parseJsonSafe } from "@/lib/ai";

interface ReportSummaryResult {
  summary: string;
  recommendations: string[];
}

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
    clientName?: string;
    leads?: number;
    conversions?: number;
    topSource?: string;
  };

  const { clientName = "הלקוח", leads = 0, conversions = 0, topSource = "לא ידוע" } = body;

  const prompt = `כתוב סיכום שבועי קצר בעברית עבור ${clientName}
${leads} לידים, ${conversions} נסגרו, מקור עיקרי: ${topSource}
תן 2 המלצות לשיפור, ממוקדות ומעשיות.
פורמט JSON בלבד:
{
  "summary": "2-3 משפטי סיכום",
  "recommendations": ["המלצה 1", "המלצה 2"]
}`;

  let result;
  try {
    result = await callClaude(prompt, 512);
  } catch {
    return NextResponse.json({ error: "שגיאה ביצירת תוכן, נסה שוב" }, { status: 502 });
  }

  const parsed = parseJsonSafe<ReportSummaryResult>(result.text);
  if (!parsed) {
    return NextResponse.json({ error: "שגיאה בעיבוד תשובת AI, נסה שוב" }, { status: 502 });
  }

  await trackAiUsage(session.userId, "weekly-report", result.inputTokens + result.outputTokens).catch(() => {});

  return NextResponse.json(parsed);
}
