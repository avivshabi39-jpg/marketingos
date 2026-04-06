import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { checkN8nHealth } from "@/lib/n8n";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await checkN8nHealth();

  return NextResponse.json({
    status: result.healthy ? "online" : "offline",
    responseMs: result.responseMs,
    error: result.error ?? null,
    url: process.env.N8N_WEBHOOK_BASE_URL ?? "not configured",
    checkedAt: new Date().toISOString(),
  });
}
