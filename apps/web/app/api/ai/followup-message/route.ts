import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getClientSession } from "@/lib/clientAuth";
import { callClaude, checkAiRateLimit, trackAiUsage, parseJsonSafe } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const [adminSession, clientSession] = await Promise.all([
    getSession(),
    getClientSession(),
  ]);

  if (!adminSession && !clientSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI לא מוגדר בשרת" }, { status: 503 });
  }

  if (adminSession) {
    const rate = await checkAiRateLimit(adminSession.userId);
    if (!rate.ok) {
      return NextResponse.json(
        { error: `הגעת למגבלת ${rate.limit} קריאות AI ליום.` },
        { status: 429 }
      );
    }
  }

  const body = await req.json().catch(() => ({})) as {
    leadName?: string;
    service?: string;
    daysSinceContact?: number;
  };

  const { leadName = "הלקוח", service = "השירות", daysSinceContact = 3 } = body;

  const prompt = `כתוב הודעת פולו-אפ בעברית
ל: ${leadName} שהתעניין ב: ${service}
עברו ${daysSinceContact} ימים מהפנייה האחרונה
קצר, לא לחוץ, עם שאלה אחת בסוף. עד 4 משפטים.
פורמט JSON בלבד: {"message": "ההודעה"}`;

  let result;
  try {
    result = await callClaude(prompt, 256);
  } catch {
    return NextResponse.json({ error: "שגיאה ביצירת תוכן, נסה שוב" }, { status: 502 });
  }

  const parsed = parseJsonSafe<{ message: string }>(result.text);
  const message = parsed?.message ?? result.text;

  if (adminSession) {
    await trackAiUsage(adminSession.userId, "followup", result.inputTokens + result.outputTokens).catch(() => {});
  }

  return NextResponse.json({ message });
}
