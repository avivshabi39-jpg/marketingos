import { NextRequest, NextResponse } from "next/server";
import { checkAndRefreshTokens } from "@/lib/metaToken";

// Vercel Cron — every Monday 9 AM
export async function GET(req: NextRequest) {
  const secret =
    req.headers.get("authorization")?.replace("Bearer ", "") ??
    req.headers.get("x-cron-secret") ??
    req.nextUrl.searchParams.get("secret");

  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await checkAndRefreshTokens();

  return NextResponse.json({
    status: "Token refresh check complete",
    ...results,
    timestamp: new Date().toISOString(),
  });
}
