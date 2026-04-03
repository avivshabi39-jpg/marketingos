import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { callClaude, checkAiRateLimit } from "@/lib/ai";

const TRIGGER_LABELS: Record<string, string> = {
  new_lead: "ליד חדש",
  won_lead: "ליד שנסגר",
  no_reply_3days: "ללא תגובה 3 ימים",
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rate = await checkAiRateLimit(session.userId);
  if (!rate.ok) {
    return NextResponse.json({ error: `הגעת למגבלת ${rate.limit} קריאות AI ליום.` }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { trigger, stepNumber, subject, clientName } = body as {
    trigger?: string;
    stepNumber?: number;
    subject?: string;
    clientName?: string;
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    const placeholder = `שלום {name},\n\nתודה על פנייתך אל ${clientName ?? "העסק שלנו"}.\n\nנחזור אליך בהקדם האפשרי.\n\nבברכה,\nצוות ${clientName ?? "העסק"}`;
    return NextResponse.json({ body: placeholder });
  }

  const triggerLabel = TRIGGER_LABELS[trigger ?? ""] ?? trigger ?? "";

  const prompt = `כתוב גוף מייל קצר בעברית לרצף שיווקי אוטומטי.

פרטים:
- טריגר: ${triggerLabel}
- מספר שלב ברצף: ${stepNumber ?? 1}
- נושא המייל: ${subject ?? "ללא נושא"}
- שם הלקוח (העסק): ${clientName ?? "העסק שלנו"}

הנחיות:
- כתוב בעברית, RTL
- קצר ומקצועי (3-5 שורות)
- השתמש במשתנה {name} לשם הנמען
- אל תכלול שורת פתיחה "נושא:" או כותרת
- החזר רק את גוף המייל בלי הסברים נוספים
- סיים עם "בברכה" ושם העסק`;

  try {
    const result = await callClaude(prompt, 400);
    return NextResponse.json({ body: result.text.trim() });
  } catch {
    const fallback = `שלום {name},\n\nתודה על פנייתך אל ${clientName ?? "העסק שלנו"}.\n\nנחזור אליך בהקדם.\n\nבברכה,\nצוות ${clientName ?? "העסק"}`;
    return NextResponse.json({ body: fallback });
  }
}
