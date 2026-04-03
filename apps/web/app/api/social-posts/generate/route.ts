import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  const body = await req.json().catch(() => ({})) as {
    clientId?: string;
    topic?: string;
    imageUrl?: string;
    style?: string;
    platform?: string;
  };

  const { clientId, topic = "", imageUrl = "", style = "professional", platform = "facebook" } = body;

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

  const prompt = `
צור פוסט שיווקי מקצועי בעברית.
שם העסק: ${client.name}
ענף: ${client.industry ?? "כללי"}
${topic ? `נושא: ${topic}` : ""}
${imageUrl ? "יש תמונה מצורפת לפוסט" : ""}
סגנון: ${style}
פלטפורמה: ${platform}

דרישות:
- עברית שוטפת ומשכנעת
- כולל 3-5 האשטגים רלוונטיים
- קריאה לפעולה ברורה בסוף
- מותאם ל${platform}
- ${platform === "instagram" ? "עד 150 מילה" : "עד 100 מילה"}
- אל תוסיף כותרות או סימוני markdown

החזר את הפוסט בלבד.
`.trim();

  let result;
  try {
    result = await callClaude(prompt, 600);
  } catch {
    return NextResponse.json({ error: "שגיאה ביצירת פוסט" }, { status: 502 });
  }

  await trackAiUsage(session.userId, "social-post", result.inputTokens + result.outputTokens).catch(() => {});

  return NextResponse.json({ post: result.text.trim(), platform });
}
