const CLAUDE_MODEL = "claude-haiku-4-5-20251001";

interface AiResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

/** Call Claude via direct API fetch. Throws on error. */
export async function callClaude(prompt: string, maxTokens = 1024): Promise<AiResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.startsWith("sk-ant-placeholder")) throw new Error("AI_NOT_CONFIGURED");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as object;
    throw new Error(`AI_SERVICE_ERROR: ${JSON.stringify(err)}`);
  }

  const data = await res.json() as {
    content?: Array<{ type: string; text: string }>;
    usage?: { input_tokens: number; output_tokens: number };
  };

  return {
    text: data.content?.[0]?.text ?? "",
    inputTokens: data.usage?.input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
  };
}

/** Check AI rate limit: 20 calls/day for BASIC, unlimited for PRO/AGENCY. */
export async function checkAiRateLimit(
  userId: string
): Promise<{ ok: boolean; used: number; limit: number }> {
  const { prisma } = await import("@/lib/prisma");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { agencyPlan: true },
  });

  const plan = user?.agencyPlan ?? "BASIC";
  const limit = plan === "BASIC" ? 20 : 1000;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const used = await prisma.aiUsage.count({
    where: { userId, createdAt: { gte: today } },
  });

  return { ok: used < limit, used, limit };
}

/** Record an AI call in the usage log. */
export async function trackAiUsage(
  userId: string,
  type: string,
  tokens: number
): Promise<void> {
  const { prisma } = await import("@/lib/prisma");
  await prisma.aiUsage.create({ data: { userId, type, tokens } });
}

/** Parse a JSON string from Claude output, stripping markdown fences if present. */
export function parseJsonSafe<T>(text: string): T | null {
  const cleaned = text.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}
