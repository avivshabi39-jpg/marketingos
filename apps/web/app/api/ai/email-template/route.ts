import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { callClaude, checkAiRateLimit, trackAiUsage } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rate = await checkAiRateLimit(session.userId);
  if (!rate.ok) {
    return NextResponse.json(
      { error: `הגעת למגבלת ${rate.limit} קריאות AI ליום.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({})) as { topic?: string };
  if (!body.topic?.trim()) {
    return NextResponse.json({ error: "נושא חסר" }, { status: 400 });
  }

  const prompt = `כתוב תבנית מייל שיווקית בעברית בנושא: ${body.topic}

דרישות:
- עברית שוטפת ומקצועית
- נושא (subject) קצר ומושך
- גוף (body) ידידותי ומשכנע, עד 150 מילה
- השתמש במשתנים: {name} לשם הנמען, {businessName} לשם העסק
- קריאה לפעולה ברורה בסוף

החזר JSON בלבד בפורמט:
{"subject": "נושא המייל", "body": "גוף המייל"}`;

  let result;
  try {
    result = await callClaude(prompt, 500);
  } catch {
    return NextResponse.json({ error: "שגיאה ביצירת תבנית" }, { status: 502 });
  }

  await trackAiUsage(session.userId, "email-template", result.inputTokens + result.outputTokens).catch(() => {});

  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return NextResponse.json({
        subject: parsed.subject ?? "",
        body: parsed.body ?? result.text,
      });
    }
  } catch { /* fall through */ }

  return NextResponse.json({ subject: body.topic, body: result.text });
}
