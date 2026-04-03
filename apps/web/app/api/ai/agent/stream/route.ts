import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { getSession, isSuperAdmin } from "@/lib/auth";
import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";
import { checkAiRateLimit } from "@/lib/ai";

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
  const { clientId, message, conversationHistory = [] } = body;
  if (!clientId || !message?.trim()) {
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

  const systemPrompt = `אתה סוכן AI אישי חכם של MarketingOS. אתה יכול לדבר וגם לבצע פעולות אמיתיות.

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
- BUILD_PAGE: בנה דף נחיתה חדש (צור pageBlocks)
- UPDATE_HERO: עדכן כותרת ראשית
- UPDATE_COLOR: שנה צבע (updates: {color: "#hex"})
- UPDATE_TITLE: שנה כותרת (updates: {title: "..."})
- ADD_BLOCK: הוסף בלוק חדש
- CHANGE_CTA: שנה כפתור CTA
- UPDATE_FEATURES: עדכן יתרונות
- PUBLISH: פרסם דף נחיתה
- CREATE_REPORT: צור דוח ביצועים
- BROADCAST: שלח שידור וואצאפ (updates: {broadcastMessage: "..."})
- ADD_LEAD: הוסף ליד (updates: {firstName: "...", phone: "..."})
- BROADCAST: שלח שידור וואצאפ (updates: {broadcastMessage: "הודעה לשלוח"})
- GENERATE_POST: צור פוסט לסושיאל (updates: {content: "תוכן הפוסט", platform: "facebook"})
- SHOW_STATS: הצג סטטיסטיקות
- NONE: רק תשובה טקסטואלית

חוקים:
- תמיד ענה בעברית חמה ומקצועית
- כשמבקשים פעולה — בצע אותה (action ≠ NONE)
- כשמבקשים סטטיסטיקות — תן את הנתונים האמיתיים מלמעלה
- כשמבקשים דוח — השתמש ב-CREATE_REPORT
- כשמבקשים שידור — השתמש ב-BROADCAST עם הודעה שיווקית מתאימה לענף
- כשמבקשים להוסיף ליד — השתמש ב-ADD_LEAD
- כשמבקשים פרסום — השתמש ב-PUBLISH
- כשמבקשים פוסט — השתמש ב-GENERATE_POST עם תוכן מקצועי
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

        // Try multiple cleaning strategies
        const cleanStrategies = [
          fullText.trim(),
          fullText.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim(),
          // Extract JSON from inside any text
          (() => {
            const match = fullText.match(/\{[\s\S]*"message"[\s\S]*\}/);
            return match ? match[0] : "";
          })(),
        ];

        for (const cleaned of cleanStrategies) {
          if (!cleaned) continue;
          try {
            parsed = JSON.parse(cleaned);
            if (parsed?.message) break;
          } catch {
            parsed = null;
          }
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
