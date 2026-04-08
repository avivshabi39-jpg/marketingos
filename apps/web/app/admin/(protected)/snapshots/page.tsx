"use client";

import { useState, useEffect } from "react";
import { Layout, Loader2, X, CheckCircle2, ExternalLink, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { HelpButton } from "@/components/HelpButton";
import { PageHeader } from "@/components/ui/PageHeader";

type Client = { id: string; name: string };

const SNAPSHOTS = [
  {
    key: "roofing",
    icon: "🏠",
    title: "גגות ואלומיניום",
    color: "border-orange-200 bg-gradient-to-br from-orange-50 to-white",
    iconBg: "bg-orange-100",
    badgeColor: "bg-orange-50 text-orange-700 border border-orange-200",
    industry: "בנייה",
    features: [
      "הודעות WhatsApp אוטומטיות",
      "טמפלייט דף נחיתה לגגות",
      "טופס קבלת לקוח",
      "תבניות מעקב לידים",
    ],
  },
  {
    key: "construction",
    icon: "🏗️",
    title: "בנייה וקבלנות",
    color: "border-slate-200 bg-gradient-to-br from-slate-50 to-white",
    iconBg: "bg-slate-100",
    badgeColor: "bg-slate-50 text-slate-700 border border-slate-200",
    industry: "בנייה",
    features: [
      "דף נחיתה קבלן מוסמך",
      "טופס הצעת מחיר חינם",
      "הודעת וואצאפ אוטומטית",
      "המלצות לקוחות",
    ],
  },
  {
    key: "cosmetics",
    icon: "💄",
    title: "קוסמטיקה ויופי",
    color: "border-pink-200 bg-gradient-to-br from-pink-50 to-white",
    iconBg: "bg-pink-100",
    badgeColor: "bg-pink-50 text-pink-700 border border-pink-200",
    industry: "יופי",
    features: [
      "הודעות WhatsApp אוטומטיות",
      "טמפלייט דף נחיתה ליופי",
      "טופס קבלת לקוח",
      "תבניות מעקב לידים",
    ],
  },
  {
    key: "finance_pro",
    icon: "📊",
    title: "רואה חשבון / ייעוץ פיננסי",
    color: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
    iconBg: "bg-emerald-100",
    badgeColor: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    industry: "פיננסים",
    features: [
      "שירותים ומחירון",
      "חיסכון במס",
      "פגישת ייעוץ חינם",
      "מעקב לקוחות חוזרים",
    ],
  },
  {
    key: "cleaning",
    icon: "🧹",
    title: "חברת ניקיון",
    color: "border-green-200 bg-gradient-to-br from-green-50 to-white",
    iconBg: "bg-green-100",
    badgeColor: "bg-green-50 text-green-700 border border-green-200",
    industry: "שירותים",
    features: [
      "הודעות WhatsApp אוטומטיות",
      "טמפלייט דף נחיתה לניקיון",
      "טופס קבלת לקוח",
      "תבניות מעקב לידים",
    ],
  },
  {
    key: "cleaning_pro",
    icon: "✨",
    title: "ניקיון מקצועי Pro",
    color: "border-teal-200 bg-gradient-to-br from-teal-50 to-white",
    iconBg: "bg-teal-100",
    badgeColor: "bg-teal-50 text-teal-700 border border-teal-200",
    industry: "שירותים",
    features: [
      "דף נחיתה עם מחשבון מחיר",
      "חומרים ידידותיים לסביבה",
      "הצעת מחיר מיידית",
      "אוטומציית פולו-אפ",
    ],
  },
  {
    key: "real_estate",
    icon: "🏡",
    title: "סוכן נדל\"ן",
    color: "border-blue-200 bg-gradient-to-br from-blue-50 to-white",
    iconBg: "bg-blue-100",
    badgeColor: "bg-blue-50 text-blue-700 border border-blue-200",
    industry: "נדל\"ן",
    features: [
      "הודעות WhatsApp אוטומטיות",
      "טמפלייט אתר סוכן",
      "טפסי קונים ומוכרים",
      "תבניות עסקאות נדל\"ן",
    ],
  },
  {
    key: "agent_personal",
    icon: "🤝",
    title: "סוכן אישי",
    color: "border-blue-200 bg-gradient-to-br from-blue-50 to-white",
    iconBg: "bg-blue-100",
    badgeColor: "bg-blue-50 text-blue-700 border border-blue-200",
    industry: "נדל\"ן",
    features: [
      "אתר אישי לסוכן",
      "פרופיל מקצועי + ניסיון",
      "נכסים בלעדיים",
      "ליווי מלא מחיפוש לחתימה",
    ],
  },
  {
    key: "realestate_office",
    icon: "🏢",
    title: "משרד נדל\"ן",
    color: "border-slate-200 bg-gradient-to-br from-slate-50 to-white",
    iconBg: "bg-slate-100",
    badgeColor: "bg-slate-50 text-slate-700 border border-slate-200",
    industry: "נדל\"ן",
    features: [
      "דשבורד צוות סוכנים",
      "ניהול נכסים מרכזי",
      "השוואת ביצועי סוכנים",
      "ייצוג לקוחות מקנה ומוכרים",
    ],
  },
  {
    key: "fitness_trainer",
    icon: "💪",
    title: "כושר ואימון",
    color: "border-orange-200 bg-gradient-to-br from-orange-50 to-white",
    iconBg: "bg-orange-100",
    badgeColor: "bg-orange-50 text-orange-700 border border-orange-200",
    industry: "כושר",
    features: [
      "אימון ניסיון חינם",
      "תוכנית אישית לכל לקוח",
      "מעקב התקדמות שבועי",
      "ייעוץ תזונה כלול",
    ],
  },
];

const SNAPSHOT_PREVIEWS: Record<string, { color: string; title: string; subtitle: string; cta: string; features: string[] }> = {
  roofing:          { color: "#1e3a5f", title: "גגות מקצועיים — איכות ואמינות",      subtitle: "שירות מהיר, מחירים הוגנים, אחריות מלאה",     cta: "קבל הצעת מחיר חינם", features: ["✓ אחריות 10 שנה",    "✓ מחיר שקוף",          "✓ זמינות מיידית"] },
  construction:     { color: "#1c2833", title: "בנייה מקצועית — איכות שמחזיקה שנים", subtitle: "קבלן מוסמך עם 15+ שנות ניסיון",               cta: "קבל הצעת מחיר חינם", features: ["✓ רישיון קבלן",      "✓ עמידה בלוחות זמנים", "✓ אחריות מלאה"] },
  cosmetics:        { color: "#c2185b", title: "טיפולי יופי מתקדמים",                subtitle: "תוצאות מדהימות, חוויה בלתי נשכחת",           cta: "קביעת תור",           features: ["✓ ציוד מקצועי",      "✓ מטפלת מוסמכת",       "✓ תוצאות מוכחות"] },
  finance_pro:      { color: "#059669", title: "ייעוץ פיננסי מקצועי",                subtitle: "חסכון במס, תכנון פיננסי, ליווי עסקי",         cta: "קבע ייעוץ חינם",     features: ["✓ ניסיון 15+ שנה",    "✓ חסכון מוכח",          "✓ ליווי אישי"] },
  cleaning:         { color: "#00796b", title: "ניקיון מקצועי לבית ולעסק",            subtitle: "צוות אמין, מחירים נוחים, תוצאות מושלמות",   cta: "קבל הצעת מחיר",      features: ["✓ צוות מיומן",       "✓ חומרים ידידותיים",   "✓ זמינות גמישה"] },
  cleaning_pro:     { color: "#0077b6", title: "ניקיון מקצועי לבית שלך",              subtitle: "שירות אמין, יסודי ובמחיר הוגן",              cta: "קבל מחיר עכשיו",     features: ["✓ ניקיון יסודי 100%", "✓ מגיעים בזמן",        "✓ חומרים ירוקים"] },
  real_estate:      { color: "#1565c0", title: "מצא את הנכס המושלם שלך",             subtitle: "ניסיון, מקצועיות ותוצאות מוכחות",           cta: "השאר פרטים",          features: ["✓ ניסיון עשיר",      "✓ נכסים בלעדיים",      "✓ ליווי אישי"] },
  agent_personal:   { color: "#1a3c5e", title: "מוצא לך את הבית המושלם",             subtitle: "סוכן נדל\"ן מוסמך עם 10+ שנות ניסיון",      cta: "שוחח איתי עכשיו",    features: ["✓ 100+ עסקאות",      "✓ הכרת שוק מעמיקה",   "✓ ליווי מלא"] },
  realestate_office:{ color: "#2c3e50", title: "משרד נדל\"ן מוביל באזור",            subtitle: "צוות מקצועי של סוכנים מנוסים",              cta: "דבר עם סוכן עכשיו",  features: ["✓ 10+ סוכנים",       "✓ מומחי אזור",         "✓ מחירים הטובים"] },
  fitness_trainer:  { color: "#e65100", title: "תגיע לגוף שתמיד רצית",              subtitle: "מאמן אישי מוסמך — תוצאות מהירות",           cta: "אימון ניסיון חינם",   features: ["✓ תוכנית אישית",     "✓ מעקב שבועי",         "✓ ייעוץ תזונה"] },
};

function SnapMockup({ snapKey, icon }: { snapKey: string; icon: string }) {
  const preview = SNAPSHOT_PREVIEWS[snapKey];
  const bgColor = preview?.color ?? "#6366f1";

  return (
    <div className="h-48 relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Mini browser chrome */}
      <div className="absolute top-0 right-0 left-0 h-6 bg-slate-800 flex items-center gap-1.5 px-2.5 z-10">
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
        </div>
        <div className="h-1.5 w-16 bg-white/20 rounded ml-2" />
      </div>

      {/* Miniature page preview */}
      <div className="absolute inset-0 mt-6 flex items-center justify-center">
        <div className="w-[90%] h-[85%] rounded-lg overflow-hidden shadow-sm" style={{ backgroundColor: bgColor }}>
          <div className="p-3 text-center text-white">
            <div className="text-lg mb-0.5">{icon}</div>
            <div className="h-2 bg-white/30 rounded w-3/4 mx-auto mb-1" />
            <div className="h-1.5 bg-white/20 rounded w-1/2 mx-auto mb-2" />
            <div className="h-4 bg-white rounded-xl w-1/3 mx-auto" />
          </div>
          <div className="bg-white/90 p-2 mt-1">
            <div className="flex gap-1 justify-center">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-1 h-5 bg-slate-100 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SnapshotPreviewModal({ snap, onClose }: { snap: (typeof SNAPSHOTS)[number]; onClose: () => void }) {
  const preview = SNAPSHOT_PREVIEWS[snap.key];
  if (!preview) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <span className="text-xl">{snap.icon}</span>
            תצוגה מקדימה
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={18} /></button>
        </div>
        <div className="overflow-hidden bg-slate-100" style={{ height: 280 }}>
          <div style={{
            transform: "scale(0.38)",
            transformOrigin: "top center",
            width: "264%",
            marginRight: "-82%",
            pointerEvents: "none"
          }}>
            <div dir="rtl" style={{ fontFamily: "sans-serif", minWidth: 390 }}>
              <div style={{ backgroundColor: preview.color, padding: "40px 24px", textAlign: "center", color: "#fff" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>{snap.icon}</div>
                <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 10, lineHeight: 1.2 }}>{preview.title}</h1>
                <p style={{ fontSize: 18, opacity: 0.85, marginBottom: 24 }}>{preview.subtitle}</p>
                <button style={{ backgroundColor: "#fff", color: preview.color, border: "none", borderRadius: 14, padding: "14px 32px", fontSize: 18, fontWeight: 700 }}>{preview.cta}</button>
              </div>
              <div style={{ backgroundColor: "#f8fafc", padding: "28px 20px" }}>
                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                  {preview.features.map((f) => (
                    <div key={f} style={{ flex: 1, background: "#fff", borderRadius: 14, padding: "16px 10px", textAlign: "center", fontSize: 15, color: "#374151", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>{f}</div>
                  ))}
                </div>
              </div>
              <div style={{ backgroundColor: "#fff", padding: "24px 20px", textAlign: "center" }}>
                <p style={{ fontWeight: 700, fontSize: 20, marginBottom: 16, color: "#0F172A" }}>השאר פרטים ונחזור אליך</p>
                <div style={{ background: "#f1f5f9", borderRadius: 12, height: 44, marginBottom: 10 }} />
                <div style={{ background: "#f1f5f9", borderRadius: 12, height: 44, marginBottom: 16 }} />
                <div style={{ backgroundColor: preview.color, color: "#fff", borderRadius: 14, padding: "14px 0", fontWeight: 700, fontSize: 18 }}>{preview.cta}</div>
              </div>
              <div style={{ backgroundColor: "#25d366", padding: "18px", textAlign: "center", color: "#fff", fontWeight: 600, fontSize: 18 }}>דבר איתנו עכשיו בוואצאפ 💬</div>
            </div>
          </div>
        </div>
        <div className="px-5 py-4 bg-slate-50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">סגור</button>
        </div>
      </div>
    </div>
  );
}

function ApplyModal({
  snap,
  clients,
  onClose,
  onApplied,
}: {
  snap: (typeof SNAPSHOTS)[number];
  clients: Client[];
  onClose: () => void;
  onApplied: (previewUrl: string) => void;
}) {
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [loading, setLoading] = useState(false);

  async function apply() {
    if (!clientId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/snapshots/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, snapshotKey: snap.key }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error ?? "שגיאה בהחלת התבנית");
        return;
      }
      const data = await res.json();
      toast.success("התבנית הוחלה בהצלחה!");
      onApplied(data.previewUrl ?? "");
      onClose();
    } catch {
      toast.error("שגיאת חיבור");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 transition-colors">
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <span className="text-3xl">{snap.icon}</span>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">החל תבנית — {snap.title}</h3>
            <p className="text-xs text-slate-500">בחר לקוח שעליו להחיל את התבנית</p>
          </div>
        </div>

        <div className="mb-5">
          <label className="text-sm font-medium text-slate-700 block mb-1.5">בחר לקוח</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white transition-all duration-150"
          >
            <option value="">בחר לקוח...</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-2">
          <p className="text-xs font-semibold text-slate-600 mb-2">מה יוגדר אוטומטית:</p>
          {snap.features.map((f) => (
            <div key={f} className="flex items-center gap-2 text-xs text-slate-600">
              <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
              {f}
            </div>
          ))}
        </div>

        <button
          onClick={apply}
          disabled={loading || !clientId}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {loading ? <><Loader2 size={16} className="animate-spin" /> מחיל...</> : "החל על לקוח"}
        </button>
      </div>
    </div>
  );
}

// Group templates by industry
const INDUSTRY_GROUPS: { label: string; keys: string[] }[] = [
  { label: "🏠 בנייה ושיפוצים", keys: ["roofing", "construction"] },
  { label: "💄 יופי וקוסמטיקה", keys: ["cosmetics"] },
  { label: "📊 פיננסים וייעוץ", keys: ["finance_pro"] },
  { label: "🧹 שירותי ניקיון", keys: ["cleaning", "cleaning_pro"] },
  { label: "🏡 נדל\"ן", keys: ["real_estate", "agent_personal", "realestate_office"] },
  { label: "💪 כושר ובריאות", keys: ["fitness_trainer"] },
];

export default function SnapshotsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [applying, setApplying] = useState<(typeof SNAPSHOTS)[number] | null>(null);
  const [previewing, setPreviewing] = useState<(typeof SNAPSHOTS)[number] | null>(null);
  const [applied, setApplied] = useState<Map<string, string>>(new Map());
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    setClientsLoading(true);
    fetch("/api/clients?limit=100")
      .then((r) => r.json())
      .then((d) => setClients(d.clients ?? []))
      .catch(() => {})
      .finally(() => setClientsLoading(false));
  }, []);

  const filteredSnaps = filter === "all"
    ? SNAPSHOTS
    : SNAPSHOTS.filter((s) => {
        const group = INDUSTRY_GROUPS.find((g) => g.label === filter);
        return group?.keys.includes(s.key);
      });

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="התחל מתבנית"
        subtitle={`הגדרה מוכנה בלחיצה אחת — ${SNAPSHOTS.length} תבניות לכל ענף`}
      >
        <HelpButton page="snapshots" />
      </PageHeader>

      {/* Industry filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-150 ${
            filter === "all"
              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
              : "border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900 bg-white"
          }`}
        >
          הכל ({SNAPSHOTS.length})
        </button>
        {INDUSTRY_GROUPS.map((g) => (
          <button
            key={g.label}
            onClick={() => setFilter(filter === g.label ? "all" : g.label)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-150 ${
              filter === g.label
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900 bg-white"
            }`}
          >
            {g.label} ({g.keys.length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSnaps.map((snap) => (
          <div
            key={snap.key}
            className="group relative bg-white rounded-2xl border border-slate-100 overflow-hidden hover:border-blue-200 hover:shadow-lg transition-all duration-200"
          >
            {/* Preview area with hover overlay */}
            <div className="relative">
              <SnapMockup snapKey={snap.key} icon={snap.icon} />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-blue-600/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                <button
                  onClick={() => setPreviewing(snap)}
                  className="bg-white text-blue-600 px-4 py-2 rounded-xl font-medium text-sm hover:bg-blue-50 transition-colors shadow-sm"
                >
                  תצוגה מקדימה
                </button>
                <button
                  onClick={() => !clientsLoading && setApplying(snap)}
                  disabled={clientsLoading}
                  className="bg-blue-500 text-white px-4 py-2 rounded-xl font-medium text-sm hover:bg-blue-400 transition-colors shadow-sm disabled:opacity-60"
                >
                  השתמש
                </button>
              </div>
            </div>

            <div className="p-5">
              {/* Industry badge */}
              <span className={`text-[10px] font-medium px-2.5 py-1 rounded-lg ${snap.badgeColor}`}>
                {snap.industry}
              </span>

              <div className="flex items-start gap-3 mt-3 mb-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl ${snap.iconBg}`}>
                  {snap.icon}
                </div>
                <div className="flex-1 pt-0.5">
                  <h3 className="font-bold text-slate-900 text-base leading-tight">{snap.title}</h3>
                  {applied.has(snap.key) && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle2 size={12} /> הוחל בהצלחה
                      </span>
                      {applied.get(snap.key) && (
                        <a
                          href={applied.get(snap.key)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink size={11} /> צפה בדף
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-5">
                {snap.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewing(snap)}
                  className="flex items-center gap-1.5 px-3 py-2.5 border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-700 rounded-xl text-sm font-medium transition-all duration-150"
                >
                  <Eye size={14} />
                  תצוגה
                </button>
                <button
                  onClick={() => setApplying(snap)}
                  disabled={clientsLoading && clients.length === 0}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {clientsLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      טוען לקוחות...
                    </>
                  ) : clients.length === 0 ? (
                    "אין לקוחות — הוסף לקוח קודם"
                  ) : (
                    "החל על לקוח"
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {previewing && (
        <SnapshotPreviewModal snap={previewing} onClose={() => setPreviewing(null)} />
      )}

      {applying && (
        <ApplyModal
          snap={applying}
          clients={clients}
          onClose={() => setApplying(null)}
          onApplied={(previewUrl) => {
            setApplied((prev) => new Map([...prev, [applying.key, previewUrl]]));
          }}
        />
      )}
    </div>
  );
}
