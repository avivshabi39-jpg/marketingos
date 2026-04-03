import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { callClaude } from "@/lib/ai";
import { rateLimit, getIp } from "@/lib/rateLimit";

const schema = z.object({
  from:        z.string().min(1),   // sender phone number
  message:     z.string().min(1).max(2000),
  clientSlug:  z.string().optional(), // optional direct slug
  instanceId:  z.string().optional(), // Green API instance
});

export async function POST(req: NextRequest) {
  // Rate limit: 30 messages per minute per IP
  const limited = rateLimit(getIp(req), "api");
  if (limited) {
    return NextResponse.json({ error: "יותר מדי הודעות" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "קלט לא תקין" }, { status: 400 });
  }

  const { from, message, clientSlug } = parsed.data;

  // Find client by slug or by whatsapp number matching the sender
  const client = await prisma.client.findFirst({
    where: clientSlug
      ? { slug: clientSlug, isActive: true }
      : { whatsappNumber: from, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      industry: true,
      whatsappNumber: true,
      pagePublished: true,
      landingPageTitle: true,
      aiAgentEnabled: true,
      _count: { select: { leads: true } },
    },
  });

  if (!client) {
    return NextResponse.json({ reply: "לא נמצא לקוח מחובר למספר זה" }, { status: 200 });
  }

  if (!client.aiAgentEnabled) {
    return NextResponse.json({ reply: "שירות ה-AI אינו פעיל" }, { status: 200 });
  }

  // Gather context for Claude
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart  = new Date(now.getTime() - 7 * 86400000);

  const [leadsToday, leadsWeek, newLeads, wonLeads, totalLeads] = await Promise.all([
    prisma.lead.count({ where: { clientId: client.id, createdAt: { gte: todayStart } } }),
    prisma.lead.count({ where: { clientId: client.id, createdAt: { gte: weekStart } } }),
    prisma.lead.count({ where: { clientId: client.id, status: "NEW" } }),
    prisma.lead.count({ where: { clientId: client.id, status: "WON" } }),
    prisma.lead.count({ where: { clientId: client.id } }),
  ]);

  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const systemPrompt = `אתה מנהל השיווק האישי של ${client.name}.
יש לך גישה מלאה לנתונים:
- לידים: ${totalLeads} סה"כ, ${leadsToday} היום, ${leadsWeek} השבוע
- לידים חדשים (ממתינים): ${newLeads}
- שיעור המרה: ${conversionRate}%
- דף נחיתה: ${client.pagePublished ? "פורסם ✅" : "לא פורסם ❌"}
- כתובת הדף: ${appUrl}/${client.slug}

אתה יכול לבצע פעולות (ענה ב-JSON אם נדרשת פעולה):
- ACTION: BUILD_PAGE — בנה/עדכן דף נחיתה
- ACTION: SHOW_LEADS — הצג לידים חדשים
- ACTION: SEND_REPORT — שלח דוח ביצועים
- ACTION: UPDATE_CTA — שנה כפתור CTA

ענה בעברית, קצר וברור. אם לא נדרשת פעולה, ענה רק טקסט.
אם נדרשת פעולה, ענה: {"action": "ACTION_NAME", "reply": "ההודעה לשלוח"}`;

  const aiKey = process.env.ANTHROPIC_API_KEY;
  if (!aiKey || aiKey.startsWith("sk-ant-placeholder")) {
    // Fallback without AI
    const fallback = newLeads > 0
      ? `יש לך ${newLeads} לידים חדשים שממתינים! כנס לדשבורד: ${appUrl}/client/${client.slug}`
      : `שלום! ביצועים: ${leadsWeek} לידים השבוע, ${conversionRate}% המרה.`;
    return NextResponse.json({ reply: fallback });
  }

  let aiReply: string;
  try {
    const result = await callClaude(`${systemPrompt}\n\nהודעת המשתמש: ${message}`, 512);
    // Try to parse JSON action
    const jsonMatch = result.text.match(/\{[\s\S]*"action"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as { action?: string; reply?: string };
      aiReply = parsed.reply ?? result.text;
    } else {
      aiReply = result.text;
    }
  } catch {
    aiReply = `שלום! ביצועים: ${leadsWeek} לידים השבוע, ${conversionRate}% המרה. ${newLeads > 0 ? `${newLeads} לידים חדשים ממתינים!` : ""}`;
  }

  // Store conversation in DB
  await prisma.aiConversation.createMany({
    data: [
      { clientId: client.id, role: "user",      content: message  },
      { clientId: client.id, role: "assistant", content: aiReply  },
    ],
  });

  return NextResponse.json({ reply: aiReply });
}
