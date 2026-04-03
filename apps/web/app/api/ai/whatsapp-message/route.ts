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
    clientName?: string;
    leadName?: string;
    service?: string;
  };

  const { clientName = "העסק", leadName = "הלקוח", service = "השירות" } = body;

  const prompt = `כתוב הודעת וואצאפ מקצועית בעברית
מ: ${clientName}
אל: ${leadName} שהתעניין ב: ${service}
קצר, חם, עם CTA ברור. עד 3 משפטים.
פורמט JSON בלבד: {"message": "ההודעה כאן"}`;

  let result;
  try {
    result = await callClaude(prompt, 256);
  } catch {
    return NextResponse.json({ error: "שגיאה ביצירת תוכן, נסה שוב" }, { status: 502 });
  }

  const parsed = parseJsonSafe<{ message: string }>(result.text);
  const message = parsed?.message ?? result.text;

  await trackAiUsage(session.userId, "whatsapp", result.inputTokens + result.outputTokens).catch(() => {});

  return NextResponse.json({ message });
}
