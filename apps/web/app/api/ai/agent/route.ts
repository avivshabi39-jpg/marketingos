import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";
import { getClientSession } from "@/lib/clientAuth";
import { callClaude, trackAiUsage, parseJsonSafe, checkAiRateLimit } from "@/lib/ai";
import type { Block } from "@/types/builder";

type AgentResponse = {
  message: string;
  action: string;
  updates?: Record<string, unknown>;
  pageBlocks?: Block[];
  suggestions?: string[];
};

type ConversationMessage = { role: "user" | "assistant"; content: string };

const INDUSTRY_HE: Record<string, string> = {
  ROOFING: "גגות", ALUMINUM: "אלומיניום", COSMETICS: "קוסמטיקה",
  CLEANING: "ניקיון", REAL_ESTATE: "נדל\"ן", OTHER: "אחר",
  AVIATION: "תעופה", TOURISM: "תיירות", FINANCE: "פיננסים",
  LEGAL: "משפטי", MEDICAL: "רפואה", FOOD: "מזון ומסעדנות",
  FITNESS: "כושר ובריאות", EDUCATION: "חינוך", GENERAL: "כללי",
};

export async function POST(req: NextRequest) {
  // Support both admin session and client portal session
  const adminSession = await getSession();
  const clientPortal = adminSession ? null : await getClientSession();

  if (!adminSession && !clientPortal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (adminSession) {
    const rate = await checkAiRateLimit(adminSession.userId);
    if (!rate.ok) {
      return NextResponse.json({ error: `הגעת למגבלת ${rate.limit} קריאות AI ליום.` }, { status: 429 });
    }
  }

  const aiKey = process.env.ANTHROPIC_API_KEY;
  if (!aiKey || aiKey.startsWith("sk-ant-placeholder")) {
    return NextResponse.json(
      { error: "AI לא זמין — הוסף ANTHROPIC_API_KEY ל-.env.local" },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({})) as {
    clientId?: string;
    message?: string;
    conversationHistory?: ConversationMessage[];
  };
  const { clientId, message, conversationHistory = [] } = body;

  if (!clientId || !message?.trim()) {
    return NextResponse.json({ error: "חסרים פרמטרים" }, { status: 400 });
  }

  // Ownership check
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      id: true, name: true, slug: true, ownerId: true,
      industry: true, pageBlocks: true, pagePublished: true,
      abTestEnabled: true, landingPageTitle: true, landingPageColor: true,
      aiAgentEnabled: true,
    },
  });
  if (!client) return NextResponse.json({ error: "לקוח לא נמצא" }, { status: 404 });
  if (!client.aiAgentEnabled) return NextResponse.json({ error: "סוכן AI לא פעיל עבור לקוח זה" }, { status: 403 });

  // Admin auth check
  if (adminSession && !isSuperAdmin(adminSession) && client.ownerId !== adminSession.userId) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  // Client portal auth check — only their own client
  if (clientPortal && clientPortal.clientId !== clientId) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const industryHe = INDUSTRY_HE[client.industry ?? ""] ?? client.industry ?? "לא ידוע";
  const currentBlocks = client.pageBlocks ? JSON.stringify(client.pageBlocks).slice(0, 2000) : "אין דף קיים";

  const systemPrompt = `אתה סוכן AI אישי לבניית דפי נחיתה בעברית.
יש לך גישה לנתוני הלקוח:
- שם: ${client.name}
- ענף: ${industryHe}
- דף נוכחי מפורסם: ${client.pagePublished ? "כן" : "לא"}
- כותרת נוכחית: ${client.landingPageTitle ?? "אין"}
- A/B test פעיל: ${client.abTestEnabled ? "כן" : "לא"}
- בלוקים נוכחיים (קטועים): ${currentBlocks}

אתה יכול לבצע פעולות:
1. BUILD_PAGE - בנה דף שלם מחדש עם 4 בלוקים: hero, features, form, whatsapp
2. UPDATE_HERO - עדכן כותרת ראשית
3. UPDATE_COLOR - שנה צבע ראשי
4. ADD_BLOCK - הוסף בלוק חדש לסוף הדף
5. CHANGE_CTA - שנה כפתור קריאה לפעולה
6. UPDATE_FEATURES - עדכן בלוק יתרונות
7. PUBLISH - פרסם את הדף
8. NONE - שיחה רגילה ללא שינוי דף

כאשר אתה בונה/מעדכן בלוקים, השתמש במבנה זה:
{ "id": "b1", "type": "hero|features|form|whatsapp|testimonials", "content": {...}, "settings": { "backgroundColor": "#hex", "textColor": "#hex", "padding": "sm|md|lg", "alignment": "center|right|left" } }

תשובה חייבת להיות JSON תקין בלבד (ללא markdown):
{
  "message": "תשובה קצרה ובעברית — מה עשית",
  "action": "BUILD_PAGE|UPDATE_HERO|UPDATE_COLOR|ADD_BLOCK|CHANGE_CTA|UPDATE_FEATURES|PUBLISH|NONE",
  "updates": {},
  "pageBlocks": [...] // רק אם שינית/בנית בלוקים
  "suggestions": ["הצעה 1", "הצעה 2", "הצעה 3"]
}`;

  // Build messages array for Claude (system prompt as first user message for compatibility)
  const historyText = conversationHistory.slice(-6).map((m) =>
    `${m.role === "user" ? "משתמש" : "סוכן"}: ${m.content}`
  ).join("\n");

  const fullPrompt = `${systemPrompt}

${historyText ? `היסטוריית שיחה:\n${historyText}\n` : ""}
משתמש: ${message}

החזר JSON תקין בלבד:`;

  let result;
  try {
    result = await callClaude(fullPrompt, 2000);
  } catch {
    return NextResponse.json({ error: "שגיאת AI" }, { status: 502 });
  }

  const userId = adminSession?.userId ?? clientPortal?.clientId ?? "unknown";
  if (adminSession) {
    await trackAiUsage(adminSession.userId, "ai-agent", result.inputTokens + result.outputTokens);
  }

  const parsed = parseJsonSafe<AgentResponse>(result.text);
  if (!parsed) {
    return NextResponse.json({
      message: "אירעה שגיאה בעיבוד התשובה. נסה שוב.",
      action: "NONE",
      suggestions: ["נסה שוב", "נסח מחדש את הבקשה"],
    });
  }

  // Save conversation to DB (fire-and-forget)
  prisma.aiConversation.create({ data: { clientId, role: "user", content: message } }).catch(() => {});
  prisma.aiConversation.create({
    data: { clientId, role: "assistant", content: parsed.message, action: parsed.action },
  }).catch(() => {});

  // Perform actions
  const action = parsed.action;

  if (action === "BUILD_PAGE" && parsed.pageBlocks?.length) {
    const blocksWithIds = parsed.pageBlocks.map((b, i) => ({
      ...b,
      id: (b as Record<string, unknown>).id ?? `block-${Date.now()}-${i}`,
    }));
    const title = (parsed.pageBlocks[0]?.content as Record<string, string>)?.title ?? client.landingPageTitle;
    await prisma.client.update({
      where: { id: clientId },
      data: {
        pageBlocks:       JSON.parse(JSON.stringify(blocksWithIds)),
        pagePublished:    true,
        landingPageTitle: title ?? null,
        ...(parsed.updates?.landingPageColor ? { landingPageColor: parsed.updates.landingPageColor as string } : {}),
      },
    });
  } else if ((action === "UPDATE_HERO" || action === "UPDATE_FEATURES" || action === "ADD_BLOCK" || action === "CHANGE_CTA") && parsed.pageBlocks?.length) {
    const blocksWithIds = parsed.pageBlocks.map((b, i) => ({
      ...b,
      id: (b as Record<string, unknown>).id ?? `block-${Date.now()}-${i}`,
    }));
    await prisma.client.update({
      where: { id: clientId },
      data: { pageBlocks: JSON.parse(JSON.stringify(blocksWithIds)) },
    });
  } else if (action === "UPDATE_COLOR" && parsed.updates?.color) {
    await prisma.client.update({
      where: { id: clientId },
      data: { landingPageColor: parsed.updates.color as string, primaryColor: parsed.updates.color as string },
    });
  } else if (action === "PUBLISH") {
    await prisma.client.update({
      where: { id: clientId },
      data: { pagePublished: true },
    });
  }

  void userId; // suppress unused warning

  return NextResponse.json({
    message:     parsed.message,
    action:      parsed.action,
    updates:     parsed.updates ?? {},
    pageBlocks:  parsed.pageBlocks ?? null,
    suggestions: parsed.suggestions ?? [],
    previewUrl:  `/${client.slug}`,
  });
}
