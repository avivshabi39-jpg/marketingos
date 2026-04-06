import { NextResponse } from "next/server";
import { checkN8nHealth } from "@/lib/n8n";

export async function GET() {
  const healthy = await checkN8nHealth();
  return NextResponse.json({
    status: healthy ? "online" : "offline",
    url: process.env.N8N_WEBHOOK_BASE_URL ?? "not configured",
    timestamp: new Date().toISOString(),
  });
}
