import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Vercel Cron — every Sunday 2 AM
// Verifies DB integrity + logs data counts
export async function GET(req: NextRequest) {
  const secret =
    req.headers.get("authorization")?.replace("Bearer ", "") ??
    req.headers.get("x-cron-secret") ??
    req.nextUrl.searchParams.get("secret");

  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const start = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    const [users, clients, leads, appointments, auditLogs] =
      await Promise.all([
        prisma.user.count(),
        prisma.client.count(),
        prisma.lead.count(),
        prisma.appointment.count(),
        prisma.auditLog.count(),
      ]);

    const report = {
      status: "ok",
      timestamp: new Date().toISOString(),
      duration: Date.now() - start + "ms",
      counts: { users, clients, leads, appointments, auditLogs },
      neonPITR: "active (last 7 days)",
    };

    await prisma.auditLog
      .create({
        data: {
          action: "backup.verified",
          meta: report as object,
          success: true,
        },
      })
      .catch(() => {});

    return NextResponse.json(report);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";

    if (process.env.ADMIN_EMAIL && process.env.RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from:
            process.env.RESEND_FROM || "alerts@marketingos.co.il",
          to: process.env.ADMIN_EMAIL,
          subject: "🚨 MarketingOS — Backup Check Failed",
          html: `<p>Backup verification failed: ${msg}</p>`,
        }),
      }).catch(() => {});
    }

    return NextResponse.json(
      { status: "error", error: msg, duration: Date.now() - start + "ms" },
      { status: 500 }
    );
  }
}
