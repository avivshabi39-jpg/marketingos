import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Vercel Cron — every 30 minutes
// Keeps DB warm + monitors health
export async function GET(req: NextRequest) {
  const secret =
    req.headers.get("authorization")?.replace("Bearer ", "") ??
    req.headers.get("x-cron-secret") ??
    req.nextUrl.searchParams.get("secret");

  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;

    const [clients, leads] = await Promise.all([
      prisma.client.count(),
      prisma.lead.count(),
    ]);

    return NextResponse.json({
      status: "healthy",
      db: "connected",
      responseTime: Date.now() - start + "ms",
      stats: { clients, leads },
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: err instanceof Error ? err.message : "Unknown",
      },
      { status: 500 }
    );
  }
}
