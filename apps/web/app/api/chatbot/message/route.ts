import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callClaude } from "@/lib/ai";

interface ChatbotSchedule {
  start: string;
  end: string;
  alwaysOn?: boolean;
  days?: number[];
}

interface FAQItem {
  q: string;
  a: string;
}

function isWithinSchedule(schedule: ChatbotSchedule): boolean {
  if (schedule.alwaysOn) return true;

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sunday, 6=Saturday

  const activeDays = schedule.days ?? [0, 1, 2, 3, 4, 5];
  if (!activeDays.includes(dayOfWeek)) return false;

  const [startH, startM] = (schedule.start ?? "09:00").split(":").map(Number);
  const [endH, endM] = (schedule.end ?? "22:00").split(":").map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

function findFaqAnswer(faq: FAQItem[], message: string): string | null {
  const lower = message.toLowerCase();
  for (const item of faq) {
    const qLower = item.q.toLowerCase();
    const words = qLower.split(/\s+/).filter((w) => w.length > 2);
    const matches = words.filter((w) => lower.includes(w));
    if (matches.length > 0 && matches.length / words.length >= 0.4) {
      return item.a;
    }
  }
  return null;
}

// POST /api/chatbot/message
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { clientSlug, message, sessionId } = body as {
    clientSlug?: string;
    message?: string;
    sessionId?: string;
  };

  if (!clientSlug || !message) {
    return NextResponse.json({ error: "clientSlug and message are required" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({
    where: { slug: clientSlug },
    select: {
      id: true,
      name: true,
      industry: true,
      chatbotEnabled: true,
      chatbotGreeting: true,
      chatbotFAQ: true,
      chatbotSchedule: true,
      chatbotAutoReply: true,
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  if (!client.chatbotEnabled) {
    return NextResponse.json({ reply: "הצ'אטבוט אינו פעיל כרגע.", leadCreated: false });
  }

  const schedule = (client.chatbotSchedule as ChatbotSchedule | null) ?? {
    start: "09:00",
    end: "22:00",
    alwaysOn: false,
    days: [0, 1, 2, 3, 4, 5],
  };

  if (!isWithinSchedule(schedule)) {
    return NextResponse.json({
      reply: "אנחנו סגורים כרגע, נחזור אליך מחר בשעות הפעילות שלנו.",
    });
  }

  const faq = (client.chatbotFAQ as FAQItem[] | null) ?? [];

  // Auto-create lead if message contains a phone number
  let leadCreated = false;
  const phoneMatch = message.match(/0[5-9]\d[-\s]?\d{3}[-\s]?\d{4}|05\d{8}/);
  if (phoneMatch && sessionId) {
    const existingLead = await prisma.lead.findFirst({
      where: { clientId: client.id, phone: phoneMatch[0].replace(/[-\s]/g, "") },
    });
    if (!existingLead) {
      await prisma.lead.create({
        data: {
          clientId: client.id,
          firstName: "ליד צ'אטבוט",
          lastName: "",
          phone: phoneMatch[0].replace(/[-\s]/g, ""),
          source: "chatbot",
          status: "NEW",
        },
      }).catch(() => null);
      leadCreated = true;
    }
  }

  // Try FAQ match first
  const faqAnswer = findFaqAnswer(faq, message);
  if (faqAnswer) {
    return NextResponse.json({ reply: faqAnswer, leadCreated });
  }

  // Auto-reply disabled — return default message
  if (!client.chatbotAutoReply) {
    return NextResponse.json({
      reply: "תודה על פנייתך! נציג שלנו יחזור אליך בקרוב.",
      leadCreated,
    });
  }

  // Check API key
  if (!process.env.ANTHROPIC_API_KEY) {
    const fallback =
      faq.length > 0
        ? `תודה על פנייתך! לשאלות נפוצות: ${faq.map((f) => f.q).slice(0, 3).join(", ")}.`
        : "תודה על פנייתך! נציג שלנו יחזור אליך בקרוב.";
    return NextResponse.json({ reply: fallback });
  }

  const industryMap: Record<string, string> = {
    ROOFING: "גגות ואיטום",
    ALUMINUM: "אלומיניום ושמשות",
    COSMETICS: "קוסמטיקה",
    CLEANING: "ניקיון",
    REAL_ESTATE: "נדל\"ן",
    OTHER: "שירותים",
    AVIATION: "תעופה",
    TOURISM: "תיירות",
    FINANCE: "פיננסים",
    LEGAL: "משפטי",
    MEDICAL: "רפואה",
    FOOD: "מזון ומסעדנות",
    FITNESS: "כושר ובריאות",
    EDUCATION: "חינוך",
    GENERAL: "כללי",
  };

  const industryHe = client.industry ? (industryMap[client.industry] ?? client.industry) : "שירותים";
  const faqContext =
    faq.length > 0
      ? faq.map((f) => `ש: ${f.q}\nת: ${f.a}`).join("\n\n")
      : "אין שאלות ותשובות מוגדרות";

  const prompt = `אתה נציג שירות של ${client.name}, עסק בתחום ${industryHe}.

שאלות ותשובות נפוצות:
${faqContext}

שאלת הלקוח: ${message}

ענה בעברית, קצר ומקצועי (עד 3 משפטים). אם אינך יודע את התשובה, הפנה לפנות ישירות לעסק.`;

  try {
    const result = await callClaude(prompt, 256);
    return NextResponse.json({ reply: result.text.trim() });
  } catch {
    return NextResponse.json({
      reply: "תודה על פנייתך! נציג שלנו יחזור אליך בקרוב.",
    });
  }
}
