import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || !isSuperAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const checks: Record<string, { status: "ok" | "warning" | "error"; message: string; latencyMs?: number }> = {};

  // 1. Database
  try {
    const start = Date.now();
    await Promise.race([prisma.$queryRaw`SELECT 1`, new Promise<never>((_, r) => setTimeout(() => r(new Error("timeout")), 5000))]);
    checks.database = { status: "ok", message: "מחובר ✅", latencyMs: Date.now() - start };
  } catch {
    checks.database = { status: "error", message: "לא מחובר ❌" };
  }

  // 2. AI
  checks.ai = { status: process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes("placeholder") ? "ok" : "error", message: process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes("placeholder") ? "מפתח מוגדר ✅" : "מפתח חסר ❌" };

  // 3. WhatsApp
  const instanceId = process.env.GREEN_API_INSTANCE_ID;
  const token = process.env.GREEN_API_TOKEN;
  if (!instanceId || !token) {
    checks.whatsapp = { status: "warning", message: "לא מוגדר" };
  } else {
    try {
      const url = process.env.GREEN_API_URL ?? "https://api.green-api.com";
      const res = await fetch(`${url}/waInstance${instanceId}/getStateInstance/${token}`, { signal: AbortSignal.timeout(5000) });
      const data = (await res.json()) as { stateInstance?: string };
      checks.whatsapp = { status: data.stateInstance === "authorized" ? "ok" : "warning", message: data.stateInstance === "authorized" ? "מחובר ✅" : `סטטוס: ${data.stateInstance}` };
    } catch {
      checks.whatsapp = { status: "warning", message: "לא נגיש" };
    }
  }

  // 4. Email
  checks.email = { status: process.env.RESEND_API_KEY ? "ok" : "warning", message: process.env.RESEND_API_KEY ? "מפתח מוגדר ✅" : "מפתח חסר" };

  // 5. Cloudinary
  checks.cloudinary = { status: process.env.CLOUDINARY_API_KEY ? "ok" : "warning", message: process.env.CLOUDINARY_API_KEY ? "מחובר ✅" : "לא מוגדר" };

  // 6. Push
  checks.push = { status: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? "ok" : "warning", message: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? "VAPID מוגדר ✅" : "לא מוגדר" };

  // Stats
  const [totalUsers, totalClients, totalLeads, todayLeads, totalAppointments, totalReports] = await Promise.all([
    prisma.user.count(),
    prisma.client.count(),
    prisma.lead.count(),
    prisma.lead.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    prisma.appointment.count(),
    prisma.report.count(),
  ]);

  // Monthly leads (6 months)
  const MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const count = await prisma.lead.count({ where: { createdAt: { gte: start, lte: end } } });
    monthlyData.push({ month: MONTHS[d.getMonth()], leads: count });
  }

  const hasError = Object.values(checks).some((c) => c.status === "error");
  const hasWarning = Object.values(checks).some((c) => c.status === "warning");

  return NextResponse.json({
    status: hasError ? "error" : hasWarning ? "warning" : "ok",
    checks,
    stats: { totalUsers, totalClients, totalLeads, todayLeads, totalAppointments, totalReports },
    monthlyData,
    timestamp: new Date().toISOString(),
  });
}
