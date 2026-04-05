import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { getSession, isSuperAdmin } from "@/lib/auth";
import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";
import { checkAiRateLimit } from "@/lib/ai";
import { rateLimit, getIp } from "@/lib/rateLimit";
import { sanitizeText } from "@/lib/sanitize";

const INDUSTRY_HE: Record<string, string> = {
  ROOFING: "גגות", ALUMINUM: "אלומיניום", COSMETICS: "קוסמטיקה",
  CLEANING: "ניקיון", REAL_ESTATE: 'נדל"ן', OTHER: "אחר",
  AVIATION: "תעופה", TOURISM: "תיירות", FINANCE: "פיננסים",
  LEGAL: "משפטי", MEDICAL: "רפואה", FOOD: "מזון ומסעדנות",
  FITNESS: "כושר ובריאות", EDUCATION: "חינוך", GENERAL: "כללי",
};

type ConversationMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  // Auth
  const adminSession = await getSession();
  const clientPortal = adminSession ? null : await getClientSession();
  if (!adminSession && !clientPortal) {
    return new Response("Unauthorized", { status: 401 });
  }

  const ipLimited = rateLimit(getIp(req), "ai");
  if (ipLimited) {
    return new Response("יותר מדי בקשות AI. המתן דקה.", { status: 429 });
  }

  if (adminSession) {
    const rate = await checkAiRateLimit(adminSession.userId);
    if (!rate.ok) {
      return new Response(`הגעת למגבלת ${rate.limit} קריאות AI ליום.`, { status: 429 });
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("AI לא מוגדר", { status: 503 });
  }

  const body = await req.json().catch(() => ({})) as {
    clientId?: string;
    message?: string;
    conversationHistory?: ConversationMessage[];
  };
  const { clientId, message: rawMessage, conversationHistory = [] } = body;
  const message = sanitizeText(rawMessage || "", 2000);
  if (!clientId || !message.trim()) {
    return new Response("חסרים פרמטרים", { status: 400 });
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      id: true, name: true, slug: true, ownerId: true, industry: true,
      pageBlocks: true, pagePublished: true, abTestEnabled: true,
      landingPageTitle: true, landingPageColor: true, aiAgentEnabled: true,
    },
  });
  if (!client || !client.aiAgentEnabled) {
    return new Response("לקוח לא נמצא", { status: 404 });
  }
  if (adminSession && !isSuperAdmin(adminSession) && client.ownerId !== adminSession.userId) {
    return new Response("אין הרשאה", { status: 403 });
  }
  if (clientPortal && clientPortal.clientId !== clientId) {
    return new Response("אין הרשאה", { status: 403 });
  }

  const industryHe = INDUSTRY_HE[client.industry ?? ""] ?? client.industry ?? "לא ידוע";
  const currentBlocks = client.pageBlocks ? JSON.stringify(client.pageBlocks).slice(0, 1500) : "אין דף קיים";

  // Fetch stats for context
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const [totalLeads, newLeads7d, wonLeads, leadsWithPhone] = await Promise.all([
    prisma.lead.count({ where: { clientId } }),
    prisma.lead.count({ where: { clientId, status: "NEW", createdAt: { gte: sevenDaysAgo } } }),
    prisma.lead.count({ where: { clientId, status: "WON" } }),
    prisma.lead.count({ where: { clientId, phone: { not: "" } } }),
  ]);
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  const systemPrompt = `אתה מומחה שיווק בכיר עם 60 שנות ניסיון בשוק הישראלי.
שמך הוא "מיכאל" — יועץ שיווקי אגדי שעבד עם אלפי עסקים ישראלים.
ראית הכל. ניסחת הכל. מכרת הכל.

## הידע שלך:
- כל נוסחאות המכירה: AIDA, PAS, FAB, SPIN, 4P, PASTOR
- פסיכולוגיה עמוקה של צרכן ישראלי
- מה עובד בפייסבוק, אינסטגרם, וואצאפ, לינקדאין
- כותרות שעוצרות גלילה, urgency, scarcity, social proof
- SEO בעברית, תמחור פסיכולוגי, ניהול התנגדויות מכירה

## סגנון התגובה:
- ישיר ותכליתי — ישראלים לא אוהבים עגולות
- דוגמאות ספציפיות, לא רק עקרונות
- מספרים ונתונים כשרלוונטי
- הומור קל וביטחון עצמי גבוה
- אף פעם לא "אולי" — תמיד "כך עושים"

נתוני הלקוח:
- שם: ${client.name}
- ענף: ${industryHe}
- דף מפורסם: ${client.pagePublished ? "כן" : "לא"}
- כותרת נוכחית: ${client.landingPageTitle ?? "אין"}
- A/B test: ${client.abTestEnabled ? "פעיל" : "לא פעיל"}
- סה"כ לידים: ${totalLeads} (${newLeads7d} חדשים ב-7 ימים)
- לידים עם טלפון: ${leadsWithPhone}
- נסגרו: ${wonLeads} (${conversionRate}% המרה)
- בלוקים: ${currentBlocks}

פעולות זמינות (השתמש בהן כשהמשתמש מבקש!):
- BUILD_PAGE: אל תבנה דף ישירות! הגד למשתמש: "כדי לבנות דף נחיתה מקצועי, לחץ על 'בנה דף' בתפריט."
- UPDATE_HERO: עדכן כותרת ראשית
- UPDATE_COLOR: שנה צבע (updates: {color: "#hex"})
- UPDATE_TITLE: שנה כותרת (updates: {title: "..."})
- PUBLISH: פרסם דף נחיתה
- CREATE_REPORT: צור דוח ביצועים
- BROADCAST: שלח שידור וואצאפ (updates: {broadcastMessage: "..."})
- ADD_LEAD: הוסף ליד (updates: {firstName: "...", phone: "..."})
- GENERATE_POST: צור פוסט לסושיאל (updates: {content: "תוכן הפוסט", platform: "facebook"})
- WRITE_SCRIPT: כתוב סקריפט מכירה טלפוני (פתיחה, SPIN, התנגדויות, סגירה)
- SWOT: ניתוח SWOT לעסק (חוזקות, חולשות, הזדמנויות, איומים)
- SHOW_STATS: הצג סטטיסטיקות
- NONE: רק תשובה טקסטואלית

כשכותב תוכן שיווקי:
- השתמש במילות כוח: "בלעדי", "מוגבל", "מיידי", "מוכח"
- כלול תמיד קריאה לפעולה (CTA) ברורה
- התאם לתרבות הישראלית — ישירות, חום, יחסים אישיים

כשכותב סקריפט מכירה (WRITE_SCRIPT):
- מבנה SPIN: Situation→Problem→Implication→Need-Payoff
- כלול פתיחה חמה (10 שניות), שאלות חקר, הצגת פתרון, טיפול בהתנגדויות, סגירה

כשעושה SWOT:
- 3-4 נקודות בכל קטגוריה עם אימוג'ים
- סיכום עם המלצה אסטרטגית אחת ברורה

חוקים:
- תמיד ענה בעברית חמה ומקצועית
- כשמבקשים פעולה — בצע אותה (action ≠ NONE)
- כשמבקשים סטטיסטיקות — תן נתונים אמיתיים מלמעלה
- תמיד הוסף suggestions עם 3 המשכים אפשריים

מבנה בלוקים:
{"id":"b1","type":"hero|features|form|whatsapp|testimonials","content":{...},"settings":{"backgroundColor":"#hex","textColor":"#hex","padding":"sm|md|lg","alignment":"center|right|left"}}

החזר JSON תקין בלבד (ללא markdown):
{"message":"תשובה בעברית","action":"שם_הפעולה","updates":{},"pageBlocks":[],"suggestions":["הצעה1","הצעה2","הצעה3"]}`;

  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.slice(-8).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let fullText = "";
      try {
        const response = await anthropic.messages.stream({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 2000,
          system: systemPrompt,
          messages,
        });

        for await (const event of response) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const chunk = event.delta.text;
            fullText += chunk;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`)
            );
          }
        }

        // Parse JSON response and apply actions
        type ParsedResponse = {
          message?: string;
          action?: string;
          updates?: Record<string, unknown>;
          pageBlocks?: unknown[];
          suggestions?: string[];
        };

        let parsed: ParsedResponse | null = null;

        // Bulletproof JSON extraction — try multiple strategies
        const cleanStrategies = [
          // 1. Raw text
          fullText.trim(),
          // 2. Strip markdown code blocks
          fullText.replace(/^```json?\s*/i, "").replace(/```\s*$/g, "").trim(),
          // 3. Extract outermost JSON with "message" key
          (() => {
            const match = fullText.match(/\{[\s\S]*"message"[\s\S]*\}/);
            return match ? match[0] : "";
          })(),
          // 4. Extract outermost JSON with "action" key
          (() => {
            const match = fullText.match(/\{[\s\S]*"action"[\s\S]*\}/);
            return match ? match[0] : "";
          })(),
        ];

        for (const cleaned of cleanStrategies) {
          if (!cleaned) continue;
          try {
            parsed = JSON.parse(cleaned);
            if (parsed?.message || parsed?.action) break;
          } catch {
            parsed = null;
          }
        }

        // 5. Fallback: check for [ACTION:TYPE] tags in plain text
        if (!parsed?.action || parsed.action === "NONE") {
          const actionTag = fullText.match(/\[ACTION:(\w+)(?::([^\]]*))?\]/);
          if (actionTag) {
            parsed = {
              ...(parsed ?? {}),
              message: parsed?.message ?? fullText.replace(/\[ACTION:[^\]]+\]/g, "").trim(),
              action: actionTag[1],
              updates: actionTag[2] ? { value: actionTag[2] } : (parsed?.updates ?? {}),
            };
          }
        }

        // 6. If still no message, use raw text
        if (!parsed?.message && fullText.trim()) {
          parsed = { ...(parsed ?? {}), message: fullText.trim(), action: parsed?.action ?? "NONE" };
        }

        if (parsed?.pageBlocks?.length) {
          const blocksWithIds = (parsed.pageBlocks as Array<Record<string, unknown>>).map((b, i) => ({
            ...b,
            id: (b.id as string) || `block-${Date.now()}-${i}`,
          }));
          await prisma.client.update({
            where: { id: clientId },
            data: {
              pageBlocks: JSON.parse(JSON.stringify(blocksWithIds)),
              pagePublished: true,
              ...(parsed.action === "BUILD_PAGE" && parsed.updates?.landingPageColor
                ? { landingPageColor: parsed.updates.landingPageColor as string }
                : {}),
            },
          });
        } else if (parsed?.action === "UPDATE_COLOR" && parsed.updates?.color) {
          await prisma.client.update({
            where: { id: clientId },
            data: {
              landingPageColor: parsed.updates.color as string,
              primaryColor:     parsed.updates.color as string,
            },
          });
        } else if (parsed?.action === "PUBLISH") {
          await prisma.client.update({ where: { id: clientId }, data: { pagePublished: true } });
        } else if (parsed?.action === "UPDATE_TITLE" && parsed.updates?.title) {
          await prisma.client.update({
            where: { id: clientId },
            data: { landingPageTitle: parsed.updates.title as string },
          });
        } else if (parsed?.action === "CREATE_REPORT") {
          try {
            const reportLeads = await prisma.lead.count({ where: { clientId } });
            const reportWon = await prisma.lead.count({ where: { clientId, status: "WON" } });
            const conv = reportLeads > 0 ? Math.round((reportWon / reportLeads) * 100) : 0;
            await prisma.report.create({
              data: {
                clientId,
                type: "WEEKLY",
                period: `שבועי — ${new Date().toLocaleDateString("he-IL")}`,
                totalLeads: reportLeads,
                wonLeads: reportWon,
                conversionRate: conv,
              },
            });
          } catch { /* report creation best-effort */ }
        } else if (parsed?.action === "ADD_LEAD" && parsed.updates?.firstName) {
          try {
            await prisma.lead.create({
              data: {
                clientId,
                firstName: (parsed.updates.firstName as string) ?? "ליד חדש",
                lastName: (parsed.updates.lastName as string) ?? "",
                phone: (parsed.updates.phone as string) ?? "",
                email: (parsed.updates.email as string) ?? null,
                source: "ai_agent",
                status: "NEW",
              },
            });
          } catch { /* lead creation best-effort */ }
        } else if (parsed?.action === "UPDATE_HERO" && parsed.updates?.title) {
          await prisma.client.update({
            where: { id: clientId },
            data: { landingPageTitle: parsed.updates.title as string },
          });
        } else if (parsed?.action === "BROADCAST" && parsed.updates?.broadcastMessage) {
          try {
            const totalCount = await prisma.lead.count({
              where: { clientId, phone: { not: "" } },
            });
            await prisma.broadcastLog.create({
              data: {
                clientId,
                message: parsed.updates.broadcastMessage as string,
                status: "pending",
                totalCount,
                sentCount: 0,
                failCount: 0,
              },
            });
          } catch { /* broadcast best-effort */ }
        } else if (parsed?.action === "GENERATE_POST") {
          try {
            const postContent = parsed.updates?.content as string ?? parsed.message ?? "";
            const platform = (parsed.updates?.platform as string) ?? "facebook";
            if (postContent) {
              await prisma.socialPost.create({
                data: {
                  clientId,
                  content: postContent,
                  platform,
                  status: "DRAFT",
                },
              });
            }
          } catch { /* post creation best-effort */ }
        }

        // Save conversation
        prisma.aiConversation.create({ data: { clientId, role: "user", content: message } }).catch(() => {});
        prisma.aiConversation.create({
          data: {
            clientId,
            role: "assistant",
            content: parsed?.message ?? fullText.slice(0, 500),
            action: parsed?.action ?? "NONE",
          },
        }).catch(() => {});

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              done: true,
              parsed: parsed ?? { message: fullText, action: "NONE", suggestions: [] },
            })}\n\n`
          )
        );
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "שגיאת AI";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection":    "keep-alive",
    },
  });
}
