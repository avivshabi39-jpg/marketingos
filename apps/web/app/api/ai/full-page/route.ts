import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { callClaude, checkAiRateLimit, trackAiUsage, parseJsonSafe } from "@/lib/ai";

const schema = z.object({
  industry: z.string().min(1),
  businessName: z.string().min(1),
  whatsappNumber: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateCheck = await checkAiRateLimit(session.userId);
  if (!rateCheck.ok) {
    return NextResponse.json({ error: "חרגת ממגבלת השימוש היומית ב-AI" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { industry, businessName, whatsappNumber } = parsed.data;

  const prompt = `אתה מומחה לדפי נחיתה בעברית. צור מבנה דף נחיתה מלא עבור עסק בתחום "${industry}" בשם "${businessName}".
החזר JSON array בלבד (בלי markdown, בלי הסברים) של בלוקים בפורמט הבא:
[{"id":"unique-id","type":"hero|text|form|features|whatsapp|cta|testimonial","content":{...},"settings":{"padding":"lg","alignment":"center"}}]

סוגי בלוקים אפשריים:
- hero: title, subtitle, cta, ctaColor
- text: text
- form: title, button, buttonColor, successMessage
- features: f1_emoji, f1_title, f1_desc, f2_emoji, f2_title, f2_desc, f3_emoji, f3_title, f3_desc
- whatsapp: text, message${whatsappNumber ? `, phone: "${whatsappNumber}"` : ""}
- cta: title, button, buttonColor
- testimonial: quote, author, role

צור דף עם 4-6 בלוקים מותאם לתעשיית ${industry}. כל id חייב להיות ייחודי (השתמש בפורמט כמו "block-1"). הטקסט חייב להיות בעברית.`;

  try {
    const result = await callClaude(prompt, 2048);
    await trackAiUsage(session.userId, "landing-page", result.inputTokens + result.outputTokens);

    const blocks = parseJsonSafe<unknown[]>(result.text);
    if (!blocks || !Array.isArray(blocks)) {
      return NextResponse.json({ error: "Failed to generate valid page structure" }, { status: 500 });
    }
    return NextResponse.json({ blocks });
  } catch (err) {
    console.error("AI full-page error:", err);
    const message = err instanceof Error && err.message === "AI_NOT_CONFIGURED"
      ? "AI לא מוגדר. הגדר ANTHROPIC_API_KEY."
      : "שגיאה ביצירת דף AI";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
