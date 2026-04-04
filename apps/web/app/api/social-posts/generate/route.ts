import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { callClaude, checkAiRateLimit, trackAiUsage } from "@/lib/ai";

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

  const rate = await checkAiRateLimit(session.userId);
  if (!rate.ok) {
    return NextResponse.json(
      { error: `הגעת למגבלת ${rate.limit} קריאות AI ליום.` },
      { status: 429 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    clientId?: string;
    topic?: string;
    imageUrl?: string;
    style?: string;
    platform?: string;
    language?: string;
  };

  const {
    clientId,
    topic = "",
    imageUrl = "",
    style = "professional",
    platform = "facebook",
    language = "hebrew",
  } = body;

  if (!clientId) {
    return NextResponse.json({ error: "clientId חסר" }, { status: 400 });
  }

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

  const prompt = `אתה מומחה שיווק דיגיטלי. צור פוסט שיווקי מושלם.

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
