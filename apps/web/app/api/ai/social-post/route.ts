import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getClientSession } from "@/lib/clientAuth";
import { callClaude, checkAiRateLimit, trackAiUsage } from "@/lib/ai";

const PLATFORM_INSTRUCTIONS: Record<string, string> = {
  facebook: "פוסט פייסבוק (400-600 תווים, שואל שאלה, מעודד תגובות)",
  instagram: "פוסט אינסטגרם (200-300 תווים + 20 האשטאגים רלוונטיים)",
  story: "סטורי (עד 100 תווים, קצר, מושך, עם אמוג׳ים בולטים)",
  whatsapp: "הודעת ווצאפ (ישיר, אישי, עם CTA ברור, עד 200 תווים)",
};

export async function POST(req: NextRequest) {
  const [adminSession, clientSession] = await Promise.all([getSession(), getClientSession()]);
  if (!adminSession && !clientSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (adminSession) {
    const rate = await checkAiRateLimit(adminSession.userId);
    if (!rate.ok) {
      return NextResponse.json({ error: `הגעת למגבלת ${rate.limit} קריאות AI ליום.` }, { status: 429 });
    }
  }

  const body = await req.json().catch(() => ({})) as {
    clientName?: string;
    industry?: string;
    propertyOrService?: string;
    platform?: string;
    tone?: string;
    propertyTitle?: string;
    propertyPrice?: number;
    propertyRooms?: number;
    propertyCity?: string;
  };

  const {
    clientName = "העסק",
    industry = "שירותים",
    propertyOrService = "",
    platform = "facebook",
    tone = "professional",
    propertyTitle,
    propertyPrice,
    propertyRooms,
    propertyCity,
  } = body;

  const platformInstructions = PLATFORM_INSTRUCTIONS[platform] ?? PLATFORM_INSTRUCTIONS.facebook;
  const toneMap: Record<string, string> = {
    professional: "מקצועי ואמין", friendly: "ידידותי וחמים",
    exciting: "נרגש ומלהיב", informative: "אינפורמטיבי ועובדתי",
  };

  const propertySection = propertyTitle
    ? `\nנכס: ${propertyTitle}${propertyPrice ? ` | מחיר: ₪${propertyPrice.toLocaleString("he-IL")}` : ""}${propertyRooms ? ` | ${propertyRooms} חדרים` : ""}${propertyCity ? ` | ${propertyCity}` : ""}`
    : propertyOrService ? `\nנושא: ${propertyOrService}` : "";

  const prompt = `אתה מומחה שיווק דיגיטלי ישראלי. כתוב תוכן שיווקי בעברית עבור:
עסק: ${clientName} | תחום: ${industry} | פלטפורמה: ${platformInstructions} | טון: ${toneMap[tone] ?? "מקצועי"}${propertySection}

החזר JSON בפורמט הבא בלבד:
{
  "caption": "הטקסט המוכן לפרסום עם אמוג׳ים",
  "hashtags": "#האשטאג1 #האשטאג2 ...",
  "timing": "מתי לפרסם ולמה",
  "tip": "טיפ אחד קצר לשיפור ביצועים"
}`;

  let result;
  try {
    result = await callClaude(prompt, 800);
  } catch {
    return NextResponse.json({ error: "שגיאה ביצירת תוכן, נסה שוב" }, { status: 502 });
  }

  if (adminSession) {
    await trackAiUsage(adminSession.userId, "social-post", result.inputTokens + result.outputTokens).catch(() => {});
  }

  // Try structured JSON parse
  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return NextResponse.json({
        caption: parsed.caption ?? result.text,
        hashtags: parsed.hashtags ?? "",
        timing: parsed.timing ?? "",
        tip: parsed.tip ?? "",
        post: parsed.caption ?? result.text, // backwards compat
        platform,
      });
    }
  } catch { /* fall through */ }

  return NextResponse.json({ post: result.text, caption: result.text, hashtags: "", timing: "", tip: "", platform });
}
