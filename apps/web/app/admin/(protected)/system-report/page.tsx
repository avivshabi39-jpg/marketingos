import { getSession, isSuperAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LayoutDashboard, Database, Shield, Plug, BookOpen, Server } from "lucide-react";

export const dynamic = "force-dynamic";

const DB_MODELS = [
  { name: "Client",          description: "לקוחות עסקיים — הישות המרכזית של המערכת",  fields: "id, name, slug, primaryColor, industry, isActive, greenApiInstanceId, greenApiToken, whatsappNumber, aiAgentEnabled, n8nWebhookUrl, ownerId" },
  { name: "User",            description: "משתמשי מנהל — admin + super admin",           fields: "id, email, passwordHash, role, clientId, isActive, lastLoginAt, onboardingCompleted" },
  { name: "Lead",            description: "לידים / פניות פוטנציאליות",                  fields: "id, clientId, firstName, lastName, email, phone, status, source, createdAt" },
  { name: "Appointment",     description: "תורים עם לידים",                              fields: "id, clientId, leadId, scheduledAt, status, notes" },
  { name: "IntakeForm",      description: "טפסי קבלת לקוח",                              fields: "id, clientId, fields, submissions" },
  { name: "LandingPage",     description: "דפי נחיתה עם עורך ויזואלי (drag & drop)",    fields: "id, clientId, slug, title, blocks, isPublished, customDomain" },
  { name: "Report",          description: "דוחות ביצועים שבועיים / חודשיים",            fields: "id, clientId, type, period, totalLeads, wonLeads, conversionRate, topSource, revenue" },
  { name: "Automation",      description: "כללי אוטומציה (trigger + action)",            fields: "id, clientId, trigger, action, isActive" },
  { name: "Template",        description: "תבניות הודעות WhatsApp",                      fields: "id, clientId, name, body, variables" },
  { name: "EmailTemplate",   description: "תבניות אימייל",                               fields: "id, clientId, name, subject, body" },
  { name: "AuditLog",        description: "לוג פעולות לביקורת אבטחה",                   fields: "id, userId, action, entityId, meta, createdAt" },
  { name: "RefreshToken",    description: "טוקני רענון JWT — לביטול סשן",               fields: "id, userId, token, expiresAt, createdAt" },
  { name: "AiConversation",  description: "שיחות עם AI agent",                           fields: "id, clientId, userId, messages, createdAt" },
  { name: "AiUsage",         description: "מעקב שימוש ב-AI לפי לקוח",                   fields: "id, clientId, tokens, model, createdAt" },
  { name: "BroadcastLog",    description: "לוג שידורי WhatsApp המוני",                   fields: "id, clientId, message, totalCount, sentCount, failCount, status" },
  { name: "InboxEvent",      description: "אירועים נכנסים בתיבת ההודעות",               fields: "id, clientId, type, title, phone, readAt, createdAt" },
  { name: "PageView",        description: "מעקב צפיות בדפי נחיתה",                      fields: "id, clientId, pageId, ip, createdAt" },
  { name: "Subscription",    description: "מנויי Stripe ללקוחות",                        fields: "id, userId, stripeCustomerId, status, plan, currentPeriodEnd" },
  { name: "Property",        description: "נכסים (מודול נדל\"ן)",                        fields: "id, clientId, officeId, title, price, rooms, city, isPublished" },
  { name: "Office",          description: "סניפי משרד (נדל\"ן)",                         fields: "id, clientId, name, phone, city" },
  { name: "SocialPost",      description: "פוסטים לרשתות חברתיות",                      fields: "id, clientId, content, platform, imageUrl, status" },
  { name: "AbTestEvent",     description: "אירועי A/B בדיקה לדפי נחיתה",               fields: "id, clientId, pageId, variant, event, createdAt" },
];

const FEATURES = [
  { name: "ניהול לידים",               status: "✅ פעיל",  desc: "CRM מלא עם שלבי מכירה, פעילויות, ייצוא CSV" },
  { name: "AI Agent (streaming)",       status: "✅ פעיל",  desc: "SSE streaming עם claude-haiku, בניית עמוד, AI conversation history" },
  { name: "AI המלצות ביצועים",         status: "✅ פעיל",  desc: "ניתוח לידים ו-page views + המלצות AI עם cache שעה" },
  { name: "תיבת הודעות (Inbox)",        status: "✅ פעיל",  desc: "לידים + תורים + טפסים, תשובה WhatsApp inline + AI הצעת הודעה" },
  { name: "עורך דפי נחיתה",            status: "✅ פעיל",  desc: "Drag & drop עם @dnd-kit, בלוקים, תבניות, A/B testing" },
  { name: "WhatsApp (Green API)",       status: "✅ פעיל",  desc: "שליחת הודעות מוצפנות, broadcast המוני, follow-ups אוטומטיים" },
  { name: "דוחות ביצועים",             status: "✅ פעיל",  desc: "שבועי / חודשי, PDF, שליחה, AI סיכום, גרף לידים SVG" },
  { name: "טפסי קבלה",                 status: "✅ פעיל",  desc: "טפסים דינמיים ל-intake, webhook n8n, ליד אוטומטי" },
  { name: "אוטומציות",                 status: "✅ פעיל",  desc: "trigger/action, follow-up messages, כללים מותאמים" },
  { name: "תבניות ענף (Snapshots)",    status: "✅ פעיל",  desc: "4 תבניות: גגות, קוסמטיקה, ניקיון, נדל\"ן — preview + החלה בלחיצה" },
  { name: "נדל\"ן (Properties)",        status: "✅ פעיל",  desc: "ניהול נכסים, סניפים, property alerts, broadcast לרוכשים" },
  { name: "Billing (Stripe)",           status: "✅ פעיל",  desc: "checkout, portal, webhook, subscription sync" },
  { name: "שיתוף עמוד ציבורי",         status: "✅ פעיל",  desc: "דפי נחיתה פרסומיים עם tracking, WhatsApp CTA, A/B testing" },
  { name: "פורטל לקוח",                status: "✅ פעיל",  desc: "slug-based portal, לידים, דוחות, AI tools, agent AI, performance" },
  { name: "Social Posts AI",            status: "✅ פעיל",  desc: "יצירת פוסט + תמונה AI לפלטפורמות שונות" },
  { name: "2FA (TOTP)",                 status: "✅ פעיל",  desc: "two-factor authentication ל-super admin" },
];

const SECURITY_LAYERS = [
  { layer: "JWT Access Token",         detail: "HS256, 1 שעה, httpOnly cookie" },
  { layer: "JWT Refresh Token",        detail: "HS256, 30 ימים, DB-persisted לביטול, httpOnly cookie" },
  { layer: "Rate Limiting",            detail: "in-memory per IP + endpoint, 429 עם Retry-After header" },
  { layer: "Brute Force Protection",   detail: "5 ניסיונות כניסה → נעילה 15 דק׳ (by email + by IP)" },
  { layer: "Multi-tenant Isolation",   detail: "כל endpoint מוודא ownerId/clientId ownership" },
  { layer: "Input Validation (Zod)",   detail: "כל POST/PATCH ב-API route מוודא schema עם Zod" },
  { layer: "AES-256-GCM Encryption",  detail: "Green API tokens מוצפנים ב-DB עם ENCRYPTION_KEY" },
  { layer: "Audit Log",               detail: "login.success/failed, password.reset, client.create, lead.delete" },
  { layer: "Session Revocation",      detail: "password reset מוחק את כל RefreshTokens של המשתמש" },
  { layer: "CSRF Protection",         detail: "SameSite=Lax cookies + Next.js built-in CSRF" },
  { layer: "Secure Cookies",          detail: "httpOnly=true, secure=true (production), SameSite=lax" },
  { layer: "SQL Injection Prevention", detail: "Prisma ORM — parameterized queries בלבד" },
  { layer: "XSS Prevention",          detail: "React JSX auto-escaping + no dangerouslySetInnerHTML" },
  { layer: "Timing Attack Prevention", detail: "bcrypt תמיד רץ גם אם user לא קיים (dummy hash)" },
];

const INTEGRATIONS = [
  { name: "Anthropic Claude",  env: "ANTHROPIC_API_KEY",               status: "✅", desc: "claude-haiku-4-5 — AI agent, המלצות, פוסטים, הודעות, דוחות" },
  { name: "Green API",         env: "Per-client DB (encrypted)",        status: "✅", desc: "WhatsApp — שליחת הודעות, broadcast, follow-up" },
  { name: "Stripe",            env: "STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET", status: "✅", desc: "Billing — checkout, portal, webhook subscription sync" },
  { name: "n8n Webhook",       env: "Per-client DB (n8nWebhookUrl)",    status: "✅", desc: "Automation orchestration — intake forms, lead events" },
  { name: "Cloudinary / S3",   env: "CLOUDINARY_URL",                   status: "✅", desc: "העלאת תמונות — דפי נחיתה, campaign images" },
  { name: "Resend (Email)",    env: "RESEND_API_KEY",                   status: "✅", desc: "שליחת דוחות + איפוס סיסמה באימייל" },
];

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50">
        <Icon size={18} className="text-indigo-500" />
        <h2 className="font-bold text-gray-900">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        {children}
      </div>
    </div>
  );
}

export default async function SystemReportPage() {
  const session = await getSession();
  if (!session || !isSuperAdmin(session)) redirect("/admin/dashboard");

  const [
    totalClients,
    totalLeads,
    totalUsers,
    totalReports,
    totalPages,
    totalAuditLogs,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.lead.count(),
    prisma.user.count(),
    prisma.report.count(),
    prisma.landingPage.count(),
    prisma.auditLog.count(),
  ]);

  const stats = [
    { label: "לקוחות",    value: totalClients },
    { label: "לידים",     value: totalLeads },
    { label: "משתמשים",   value: totalUsers },
    { label: "דוחות",     value: totalReports },
    { label: "דפי נחיתה", value: totalPages },
    { label: "לוג אירועים", value: totalAuditLogs },
  ];

  return (
    <div className="space-y-6 max-w-5xl" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <LayoutDashboard size={22} className="text-indigo-500" />
          דוח מערכת
        </h1>
        <p className="text-sm text-gray-500 mt-1">סקירה כוללת — מאפייני מערכת, API routes, מודלים ואבטחה</p>
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {stats.map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Features */}
      <Section title="פיצ'רים" icon={BookOpen}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-right text-xs text-gray-500 border-b border-gray-100">
              <th className="px-4 py-2 font-medium">פיצ'ר</th>
              <th className="px-4 py-2 font-medium">סטטוס</th>
              <th className="px-4 py-2 font-medium">תיאור</th>
            </tr>
          </thead>
          <tbody>
            {FEATURES.map((f) => (
              <tr key={f.name} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-2.5 font-medium text-gray-800 whitespace-nowrap">{f.name}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">{f.status}</td>
                <td className="px-4 py-2.5 text-gray-500 text-xs">{f.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* DB Models */}
      <Section title={`מודלי DB (${DB_MODELS.length})`} icon={Database}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-right text-xs text-gray-500 border-b border-gray-100">
              <th className="px-4 py-2 font-medium">מודל</th>
              <th className="px-4 py-2 font-medium">תיאור</th>
              <th className="px-4 py-2 font-medium hidden lg:table-cell">שדות עיקריים</th>
            </tr>
          </thead>
          <tbody>
            {DB_MODELS.map((m) => (
              <tr key={m.name} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-2.5 font-mono text-xs text-indigo-700 whitespace-nowrap">{m.name}</td>
                <td className="px-4 py-2.5 text-gray-700 text-xs">{m.description}</td>
                <td className="px-4 py-2.5 text-gray-400 text-[10px] font-mono hidden lg:table-cell max-w-xs truncate">{m.fields}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Security */}
      <Section title="שכבות אבטחה" icon={Shield}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-right text-xs text-gray-500 border-b border-gray-100">
              <th className="px-4 py-2 font-medium">שכבה</th>
              <th className="px-4 py-2 font-medium">פרטים</th>
            </tr>
          </thead>
          <tbody>
            {SECURITY_LAYERS.map((s) => (
              <tr key={s.layer} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-2.5 font-medium text-gray-800 whitespace-nowrap">✅ {s.layer}</td>
                <td className="px-4 py-2.5 text-gray-500 text-xs">{s.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Integrations */}
      <Section title="אינטגרציות" icon={Plug}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-right text-xs text-gray-500 border-b border-gray-100">
              <th className="px-4 py-2 font-medium">שירות</th>
              <th className="px-4 py-2 font-medium">ENV</th>
              <th className="px-4 py-2 font-medium">שימוש</th>
            </tr>
          </thead>
          <tbody>
            {INTEGRATIONS.map((i) => (
              <tr key={i.name} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-2.5 font-medium text-gray-800 whitespace-nowrap">{i.status} {i.name}</td>
                <td className="px-4 py-2.5 font-mono text-[10px] text-gray-500 whitespace-nowrap">{i.env}</td>
                <td className="px-4 py-2.5 text-gray-500 text-xs">{i.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* API Routes summary */}
      <Section title="API Routes — קטגוריות" icon={Server}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-right text-xs text-gray-500 border-b border-gray-100">
              <th className="px-4 py-2 font-medium">קטגוריה</th>
              <th className="px-4 py-2 font-medium">נתיבים</th>
            </tr>
          </thead>
          <tbody>
            {[
              { cat: "Auth",       routes: "/api/auth/login, /api/auth/logout, /api/auth/register, /api/auth/refresh, /api/auth/forgot-password, /api/auth/reset-password" },
              { cat: "AI",        routes: "/api/ai/agent, /api/ai/agent/stream, /api/ai/reply-suggestion, /api/ai/landing-page, /api/ai/social-post, /api/ai/whatsapp-message, /api/ai/followup-message, /api/ai/weekly-report-summary, /api/ai/seo-meta, /api/ai/build-page, /api/ai/full-page, /api/ai/suggestions, /api/ai/usage, /api/ai/campaign-image" },
              { cat: "Clients",   routes: "/api/clients, /api/clients/[id], /api/clients/[id]/builder, /api/clients/[id]/analytics, /api/clients/[id]/ab-results" },
              { cat: "Portal",    routes: "/api/portal/[slug]/performance, /api/portal/[slug]/ai-recommendations" },
              { cat: "Leads",     routes: "/api/leads, /api/leads/[id], /api/leads/[id]/activities, /api/leads/[id]/note, /api/leads/export, /api/leads/stats" },
              { cat: "Reports",   routes: "/api/reports/generate, /api/reports/[id]/pdf, /api/reports/[id]/send, /api/reports/leads-chart" },
              { cat: "Inbox",     routes: "/api/inbox, /api/inbox/reply" },
              { cat: "Billing",   routes: "/api/billing/create-checkout, /api/billing/portal, /api/billing/health, /api/webhooks/stripe" },
              { cat: "Real Estate", routes: "/api/properties, /api/properties/[id], /api/properties/[id]/stats, /api/offices, /api/property-alerts" },
              { cat: "Misc",      routes: "/api/broadcast, /api/intake/[clientSlug], /api/snapshots/apply, /api/upload, /api/search, /api/settings, /api/system/health, /api/track, /api/audit-logs" },
            ].map(({ cat, routes }) => (
              <tr key={cat} className="border-b border-gray-50 hover:bg-gray-50/50 align-top">
                <td className="px-4 py-2.5 font-medium text-gray-800 whitespace-nowrap">{cat}</td>
                <td className="px-4 py-2.5 text-gray-500 text-[10px] font-mono leading-relaxed">{routes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <p className="text-xs text-gray-400 text-center pb-4">
        נוצר אוטומטית · {new Date().toLocaleDateString("he-IL")}
      </p>
    </div>
  );
}
