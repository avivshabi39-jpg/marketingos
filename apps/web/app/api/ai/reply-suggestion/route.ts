import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { callClaude, checkAiRateLimit } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rate = await checkAiRateLimit(session.userId);
  if (!rate.ok) {
    return NextResponse.json({ error: `הגעת למגבלת ${rate.limit} קריאות AI ליום.` }, { status: 429 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI לא מוגדר" }, { status: 503 });
  }

  const body = await req.json().catch(() => ({})) as {
    leadName?: string;
    industry?: string;
    source?: string;
  };

  const { leadName = "הלקוח", industry = "שירותים", source = "landing_page" } = body;

  const prompt = `כתוב הודעת וואצאפ קצרה ואישית בעברית ללקוח פוטנציאלי.
שם: ${leadName}
ענף: ${industry}
מקור הפנייה: ${source}

ההודעה צריכה:
- להיות קצרה (2-3 שורות)
- לפנות בשם
- להביע עניין ולהציע לתאם שיחה
- לכלול אמוג'י אחד
- להיות טבעית ואנושית

החזר את טקסט ההודעה בלבד, ללא הסברים.`;

  try {
    const result = await callClaude(prompt, 200);
    return NextResponse.json({ message: result.text.trim() });
  } catch {
    return NextResponse.json({ error: "שגיאת AI" }, { status: 502 });
  }
}
