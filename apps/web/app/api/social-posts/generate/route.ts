import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { callClaude, checkAiRateLimit, trackAiUsage } from "@/lib/ai";
import { rateLimit, getIp } from "@/lib/rateLimit";
import { sanitizeText } from "@/lib/sanitize";

const generateSchema = z.object({
  clientId: z.string().min(1, "clientId חובה"),
  topic: z.string().max(200).optional().default(""),
  imageUrl: z.string().max(500).optional().default(""),
  style: z.string().max(50).optional().default("professional"),
  platform: z.enum(["facebook", "instagram", "linkedin", "whatsapp"]).optional().default("facebook"),
  language: z.enum(["hebrew", "arabic", "english"]).optional().default("hebrew"),
});

const LANGUAGE_INSTRUCTION: Record<string, string> = {
  hebrew: "כתוב בעברית בלבד, שוטפת וטבעית",
  arabic: "اكتب باللغة العربية فقط",
  english: "Write in English only",
};

const STYLE_INSTRUCTION: Record<string, string> = {
  professional: "מקצועי, רשמי ואמין — שפה עניינית עם ערך",
  fun: "כיפי ומשעשע — הרבה אמוג'ים, שפה קלילה",
  sales: "מכירתי וממוקד המרה — CTA חזק, דחיפות",
  inspiring: "מעורר השראה — ציטוטים, מוטיבציה",
  urgent: "דחיפות — מבצע מוגבל בזמן, הזדמנות אחת בלבד",
};

const PLATFORM_GUIDE: Record<string, string> = {
  facebook: "פוסט פייסבוק — עד 500 תווים, 3 האשטגים, שפה חברתית",
  instagram: "פוסט אינסטגרם — עד 300 תווים, 5-8 האשטגים, ויזואלי",
  linkedin: "פוסט לינקדאין — מקצועי, עד 700 תווים, 3 האשטגים",
  whatsapp: "הודעת וואצאפ — קצרה ואישית, ללא האשטגים, עד 200 תווים",
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ipLimited = rateLimit(getIp(req), "ai");
  if (ipLimited) {
    return NextResponse.json({ error: "יותר ��די בקשות AI. המתן דקה." }, { status: 429 });
  }

  const rate = await checkAiRateLimit(session.userId);
  if (!rate.ok) {
    return NextResponse.json(
      { error: `הגעת למגבלת ${rate.limit} קריאות AI ליום.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return NextResponse.json({ error: first.message }, { status: 400 });
  }

  const { clientId, imageUrl, style, platform, language } = parsed.data;
  const topic = sanitizeText(parsed.data.topic || "", 200);

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { name: true, industry: true },
  });

  if (!client) {
    return NextResponse.json({ error: "לקוח לא נמצא" }, { status: 404 });
  }

  const langInst = LANGUAGE_INSTRUCTION[language] ?? LANGUAGE_INSTRUCTION.hebrew;
  const styleInst = STYLE_INSTRUCTION[style] ?? STYLE_INSTRUCTION.professional;
  const platGuide = PLATFORM_GUIDE[platform] ?? PLATFORM_GUIDE.facebook;

  const prompt = `אתה מומחה שיווק בכיר עם 60 שנות ניסיון בשוק הישראלי. שמך מיכאל.
כתבת אלפי פוסטים שהביאו מיליוני שקלים במכירות.

כללי הזהב שלך:
- Hook (שורה 1): חייב לעצור גלילה תוך 1.5 שניות — שאלה מאתגרת / מספר מפתיע / הצהרה בולדה
- לעולם לא מתחיל ב"שלום" או בשם העסק
- Body: בעיה שהקהל מכיר → פתרון → הוכחה. פסקאות קצרות (2-3 שורות)
- CTA: פעולה אחת ברורה בסוף. ישיר: "כתוב לי עכשיו", "לחץ קישור", "התקשר"
- מילות כוח: "בלעדי", "מוגבל", "חינם", "מיידי", "מוכח", "גלה", "סוד"

${langInst}

פרטי העסק:
- שם: ${client.name}
- ענף: ${client.industry ?? "כללי"}
${topic ? `- נושא: ${topic}` : ""}
${imageUrl ? "- יש תמונה מצורפת לפוסט" : ""}

דרישות:
- סגנון: ${styleInst}
- פלטפורמה: ${platGuide}
- קריאה לפעולה ברורה בסוף
- אל תוסיף כותרות או סימוני markdown
- ${platform !== "whatsapp" ? "כולל האשטגים רלוונטיים" : "ללא האשטגים"}
- אימוג'ים אסטרטגיים — לא יותר מ-3

החזר את הפוסט בלבד, ללא הסברים.`.trim();

  let result;
  try {
    result = await callClaude(prompt, 600);
  } catch {
    return NextResponse.json({ error: "שגיאה ביצירת פוסט" }, { status: 502 });
  }

  await trackAiUsage(session.userId, "social-post", result.inputTokens + result.outputTokens).catch(() => {});

  return NextResponse.json({ post: result.text.trim(), platform });
}
