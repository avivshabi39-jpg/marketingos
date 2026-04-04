import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getClientSession } from "@/lib/clientAuth";
import { callClaude, checkAiRateLimit, trackAiUsage } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const adminSession = await getSession();
  const clientSession = adminSession ? null : await getClientSession();
  if (!adminSession && !clientSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (adminSession) {
    const rate = await checkAiRateLimit(adminSession.userId);
    if (!rate.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });
  }

  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "AI not configured" }, { status: 503 });

  const { block, clientName } = (await req.json()) as { block?: { type: string; content: Record<string, string> }; clientName?: string };
  if (!block) return NextResponse.json({ error: "Missing block" }, { status: 400 });

  const prompt = `שפר את הבלוק הבא עבור העסק "${clientName ?? ""}".
סוג: ${block.type}
תוכן: ${JSON.stringify(block.content)}

החזר JSON בלבד: {"improved": {שדות משופרים}}
כתוב עברית שיווקית משכנעת. שמור על אותם שדות.`;

  try {
    const result = await callClaude(prompt, 400);
    if (adminSession) await trackAiUsage(adminSession.userId, "improve-block", result.inputTokens + result.outputTokens);
    const clean = result.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return NextResponse.json(JSON.parse(match[0]));
  } catch { /* ignore */ }

  return NextResponse.json({ improved: null });
}
