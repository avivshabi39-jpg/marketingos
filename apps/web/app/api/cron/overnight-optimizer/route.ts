import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { callClaude, parseJsonSafe } from "@/lib/ai";

interface BlockChange {
  block_id: string;
  field: string;
  new_value: string;
  reason: string;
}

interface OptimizerResult {
  changes: BlockChange[];
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (secret !== process.env.CRON_SECRET && bearer !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const aiKey = process.env.ANTHROPIC_API_KEY;
  if (!aiKey || aiKey.startsWith("sk-ant-placeholder")) {
    return NextResponse.json({ skipped: true, reason: "AI not configured" });
  }

  // Find clients with low conversion rate (< 5%) and a published page
  const clients = await prisma.client.findMany({
    where: { isActive: true, pagePublished: true, pageBlocks: { not: Prisma.JsonNull } },
    select: {
      id: true,
      name: true,
      slug: true,
      pageBlocks: true,
      whatsappNumber: true,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const results: { clientId: string; status: string; changesApplied?: number }[] = [];

  for (const client of clients) {
    try {
      const totalLeads = await prisma.lead.count({ where: { clientId: client.id } });
      const wonLeads   = await prisma.lead.count({ where: { clientId: client.id, status: "WON" } });
      const convRate   = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

      // Only optimize pages with real traffic (>2 leads) and low conversion (<5%)
      if (totalLeads < 2 || convRate >= 5) {
        results.push({ clientId: client.id, status: "skipped" });
        continue;
      }

      const blocksJson = JSON.stringify(client.pageBlocks).slice(0, 3000);
      const prompt = `הנה דף נחיתה עם שיעור המרה נמוך (${convRate.toFixed(1)}%).
שם העסק: ${client.name}
Blocks (JSON):
${blocksJson}

מה 3 שינויים ספציפיים שישפרו את ההמרה?
החזר JSON בלבד:
{
  "changes": [
    { "block_id": "id של הבלוק", "field": "שם השדה (title/subtitle/cta/button)", "new_value": "הערך החדש בעברית", "reason": "סיבה קצרה" }
  ]
}`;

      let changesApplied = 0;
      const result = await callClaude(prompt, 600);
      const parsed = parseJsonSafe<OptimizerResult>(result.text);

      if (parsed?.changes && Array.isArray(parsed.changes)) {
        // Apply changes to pageBlocks
        const blocks = (client.pageBlocks as Array<{
          id: string;
          content: Record<string, string>;
        }>);

        let modified = false;
        for (const change of parsed.changes.slice(0, 3)) {
          const block = blocks.find((b) => b.id === change.block_id);
          if (block && change.field && change.new_value) {
            block.content[change.field] = change.new_value;
            modified = true;
            changesApplied++;
          }
        }

        if (modified) {
          await prisma.client.update({
            where: { id: client.id },
            data: { pageBlocks: blocks },
          });

          // Save suggestion to DB
          await prisma.aiSuggestion.create({
            data: {
              clientId: client.id,
              suggestion: `הדף שלך עודכן הלילה ע"י AI: ${changesApplied} שיפורים הוחלו לשיפור שיעור ההמרה.`,
              type: "improve_title",
            },
          });
        }
      }

      results.push({ clientId: client.id, status: "ok", changesApplied });
    } catch {
      results.push({ clientId: client.id, status: "error" });
    }
  }

  return NextResponse.json({
    processed: results.length,
    optimized: results.filter((r) => r.status === "ok" && (r.changesApplied ?? 0) > 0).length,
    results,
  });
}
