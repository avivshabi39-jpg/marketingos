import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientSession } from "@/lib/clientAuth";
import { getSession } from "@/lib/auth";
import { callClaude, parseJsonSafe } from "@/lib/ai";

type Recommendation = { title: string; description: string; action: string; priority: "high" | "medium" | "low" };

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const adminSession = await getSession();
  const clientPortal = adminSession ? null : await getClientSession();
  if (!adminSession && !clientPortal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ recommendations: [] });
  }

  const client = await prisma.client.findUnique({
    where: { slug: params.slug },
    select: { id: true, isActive: true, name: true, industry: true, pagePublished: true, abTestEnabled: true },
  });
  if (!client || !client.isActive) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  if (clientPortal && clientPortal.clientId !== client.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Get performance data quickly
  const weekStart = new Date(Date.now() - 7 * 86400000);
  const [leadsWeek, totalLeads, wonLeads] = await Promise.all([
    prisma.lead.count({ where: { clientId: client.id, createdAt: { gte: weekStart } } }),
    prisma.lead.count({ where: { clientId: client.id } }),
    prisma.lead.count({ where: { clientId: client.id, status: "WON" } }),
  ]);

  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;
  const performanceData = {
    leadsThisWeek: leadsWeek,
    totalLeads,
    conversionRate,
    pagePublished: client.pagePublished,
    abTestActive: client.abTestEnabled,
    industry: client.industry,
  };

  // Check cache — don't regenerate more than once per hour per client
  const cacheKey = `ai-rec:${client.id}`;
  const { cacheGet, cacheSet } = await import("@/lib/cache");
  const cached = cacheGet<{ recommendations: Recommendation[] }>(cacheKey);
  if (cached) return NextResponse.json(cached);

  const prompt = `הנה נתוני ביצוע של דף נחיתה:
${JSON.stringify(performanceData, null, 2)}

תן 3 המלצות ספציפיות לשיפור הדף בעברית.
פורמט JSON בלבד (ללא markdown):
{"recommendations":[{"title":"כותרת קצרה","description":"הסבר ב-1-2 משפטים","action":"שם פעולה קצר לביצוע","priority":"high|medium|low"}]}`;

  let recommendations: Recommendation[] = [];
  try {
    const result = await callClaude(prompt, 600);
    const parsed = parseJsonSafe<{ recommendations: Recommendation[] }>(result.text);
    recommendations = parsed?.recommendations ?? [];
  } catch {
    recommendations = [];
  }

  const payload = { recommendations };
  cacheSet(cacheKey, payload, 3600); // 1 hour cache
  return NextResponse.json(payload);
}
