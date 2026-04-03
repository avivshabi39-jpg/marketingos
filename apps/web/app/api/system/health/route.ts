import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || !isSuperAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const checks: Record<string, { status: "ok" | "error" | "warn"; detail?: string }> = {};

  // 1. Database (with 5s timeout)
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("DB timeout")), 5000)
      ),
    ]);
    checks.database = { status: "ok" };
  } catch (e) {
    checks.database = { status: "error", detail: String(e) };
  }

  // 2. Stats
  const [totalClients, activeClients, totalLeads, leadsThisMonth, totalAppointments] = await Promise.all([
    prisma.client.count(),
    prisma.client.count({ where: { isActive: true } }),
    prisma.lead.count(),
    prisma.lead.count({
      where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
    }),
    prisma.appointment.count(),
  ]);

  // 3. Green API — check if any clients have it configured
  const greenApiClients = await prisma.client.count({
    where: { greenApiInstanceId: { not: null }, greenApiToken: { not: null } },
  });

  checks.greenApi = greenApiClients > 0
    ? { status: "ok", detail: `${greenApiClients} לקוחות מחוברים` }
    : { status: "warn", detail: "אף לקוח לא מחובר ל-Green API" };

  // 4. Resend (env var)
  checks.resend = process.env.RESEND_API_KEY
    ? { status: "ok" }
    : { status: "warn", detail: "RESEND_API_KEY לא הוגדר" };

  // 5. Encryption key
  checks.encryption = process.env.ENCRYPTION_KEY
    ? { status: "ok" }
    : { status: "error", detail: "ENCRYPTION_KEY חסר — שדות רגישים לא מוגנים" };

  // 6. JWT secret
  checks.jwt = process.env.JWT_SECRET
    ? { status: "ok" }
    : { status: "error", detail: "JWT_SECRET חסר" };

  const allOk = Object.values(checks).every((c) => c.status === "ok");
  const hasErrors = Object.values(checks).some((c) => c.status === "error");

  return NextResponse.json({
    status: hasErrors ? "error" : allOk ? "ok" : "warn",
    checks,
    stats: {
      totalClients,
      activeClients,
      totalLeads,
      leadsThisMonth,
      totalAppointments,
    },
    timestamp: new Date().toISOString(),
  });
}
