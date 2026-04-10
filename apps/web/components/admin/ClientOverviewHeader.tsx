"use client";

import Link from "next/link";
import {
  ArrowRight,
  Users,
  TrendingUp,
  Globe,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Eye,
  Pencil,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  client: {
    id: string;
    name: string;
    slug: string;
    primaryColor: string;
    industry: string | null;
    isActive: boolean;
    pagePublished: boolean;
    whatsappNumber: string | null;
  };
  stats: {
    totalLeads: number;
    leadsThisMonth: number;
    leads7d: number;
    wonLeads: number;
    conversionRate: number;
  };
}

// ---------------------------------------------------------------------------
// Industry labels
// ---------------------------------------------------------------------------

const INDUSTRY_HE: Record<string, string> = {
  REAL_ESTATE: 'נדל"ן', ROOFING: "גגות", ALUMINUM: "אלומיניום",
  COSMETICS: "קוסמטיקה", CLEANING: "ניקיון", SOLAR: "סולארי",
  FINANCE: "פיננסים", LEGAL: "משפטי", MEDICAL: "רפואה",
  FOOD: "מזון", FITNESS: "כושר", EDUCATION: "חינוך",
  GENERAL: "כללי", OTHER: "אחר",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ClientOverviewHeader({ client, stats }: Props) {
  // Status logic
  const status: { label: string; color: string } = !client.pagePublished
    ? { label: "דרוש הגדרה", color: "bg-slate-100 text-slate-600" }
    : stats.leads7d > 0
    ? { label: "פעיל", color: "bg-green-50 text-green-700" }
    : stats.totalLeads > 0
    ? { label: "שקט", color: "bg-amber-50 text-amber-700" }
    : { label: "לא פעיל", color: "bg-red-50 text-red-600" };

  // Priority logic
  const priority: { label: string; color: string; dot: string } = !client.pagePublished
    ? { label: "קריטי", color: "text-red-600", dot: "bg-red-500" }
    : client.pagePublished && stats.totalLeads === 0
    ? { label: "קריטי", color: "text-red-600", dot: "bg-red-500" }
    : client.pagePublished && stats.leads7d === 0
    ? { label: "מעקב", color: "text-amber-600", dot: "bg-amber-400" }
    : { label: "תקין", color: "text-green-600", dot: "bg-green-500" };

  // Recommendation logic — one clear next action
  const recommendation: { text: string; icon: typeof Globe; color: string; href?: string } =
    !client.pagePublished
      ? { text: "בנה דף נחיתה כדי להתחיל לקבל לידים", icon: Globe, color: "text-blue-600 bg-blue-50", href: `/admin/page-builder/${client.id}` }
      : stats.totalLeads === 0
      ? { text: "שתף את דף הנחיתה — עדיין לא הגיעו לידים", icon: TrendingUp, color: "text-amber-600 bg-amber-50" }
      : stats.leads7d === 0
      ? { text: "שפר את התנועה — אין לידים חדשים השבוע", icon: AlertTriangle, color: "text-amber-600 bg-amber-50" }
      : stats.wonLeads === 0
      ? { text: "עקוב אחרי הלידים — אין עסקאות שנסגרו עדיין", icon: Users, color: "text-purple-600 bg-purple-50", href: `/admin/leads?clientId=${client.id}` }
      : { text: "הלקוח בריא — המשך לעקוב אחרי ביצועים", icon: CheckCircle, color: "text-green-600 bg-green-50" };

  // Warnings
  const warnings: string[] = [];
  if (!client.pagePublished) warnings.push("אין דף נחיתה מפורסם");
  if (client.pagePublished && stats.totalLeads === 0) warnings.push("דף מפורסם אבל 0 לידים");
  if (stats.leads7d === 0 && stats.totalLeads > 0) warnings.push("אין לידים חדשים ב-7 ימים האחרונים");
  if (!client.whatsappNumber) warnings.push("וואצאפ לא מחובר");

  const initials = client.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
  const RecommendationIcon = recommendation.icon;

  return (
    <div className="space-y-5">
      {/* ── Back link ── */}
      <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors">
        <ArrowRight size={14} />
        חזרה למרכז בקרה
      </Link>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 1 — Client Summary                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-start gap-4 flex-wrap">
          {/* Avatar */}
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
            style={{ backgroundColor: client.primaryColor || "#6366f1" }}
          >
            {initials}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${status.color}`}>
                {status.label}
              </span>
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${priority.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                {priority.label}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {INDUSTRY_HE[client.industry ?? ""] ?? client.industry ?? "כללי"} · {client.slug}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100">
          <div>
            <p className="text-2xl font-bold text-slate-900">{stats.totalLeads}</p>
            <p className="text-xs text-slate-500">סה"כ לידים</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{stats.leads7d}</p>
            <p className="text-xs text-slate-500">לידים 7 ימים</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{stats.conversionRate}%</p>
            <p className="text-xs text-slate-500">שיעור המרה</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">
              {client.pagePublished ? (
                <span className="inline-flex items-center gap-1.5 text-green-600">
                  <div className="w-2 h-2 rounded-full bg-green-500" /> פורסם
                </span>
              ) : (
                <span className="text-slate-400">טיוטה</span>
              )}
            </p>
            <p className="text-xs text-slate-500">דף נחיתה</p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 2 — Recommended Next Action                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${recommendation.color}`}>
          <Lightbulb size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-400 mb-0.5">הפעולה הבאה המומלצת</p>
          <p className="text-sm font-medium text-slate-900">{recommendation.text}</p>
        </div>
        {recommendation.href && (
          <Link
            href={recommendation.href}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors flex-shrink-0"
          >
            בצע →
          </Link>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 3 — Quick Access                                         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      <div className="flex flex-wrap gap-2.5">
        <Link
          href={`/client/${client.slug}`}
          target="_blank"
          className="inline-flex items-center gap-2 text-sm font-medium bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <ExternalLink size={14} />
          כנס כלקוח
        </Link>
        <Link
          href={`/admin/leads?clientId=${client.id}`}
          className="inline-flex items-center gap-2 text-sm font-medium bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <Eye size={14} />
          צפה בלידים
        </Link>
        {client.pagePublished ? (
          <Link
            href={`/admin/clients/${client.id}/builder`}
            className="inline-flex items-center gap-2 text-sm font-medium bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Pencil size={14} />
            ערוך דף
          </Link>
        ) : (
          <Link
            href={`/admin/page-builder/${client.id}`}
            className="inline-flex items-center gap-2 text-sm font-medium bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Globe size={14} />
            בנה דף נחיתה
          </Link>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 4 — Issues / Warnings                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {warnings.length > 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-amber-700 mb-2">⚠️ נקודות לטיפול</p>
          <div className="space-y-1.5">
            {warnings.map((w) => (
              <div key={w} className="flex items-center gap-2">
                <AlertTriangle size={12} className="text-amber-500 flex-shrink-0" />
                <p className="text-xs text-amber-800">{w}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
          <p className="text-sm font-medium text-green-700">אין בעיות קריטיות — הלקוח תקין</p>
        </div>
      )}
    </div>
  );
}
