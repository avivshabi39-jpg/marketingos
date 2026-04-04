"use client";

import { useState, useEffect } from "react";
import { Layout, Loader2, X, CheckCircle2, ExternalLink, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { HelpButton } from "@/components/HelpButton";

type Client = { id: string; name: string };

const SNAPSHOTS = [
  {
    key: "roofing",
    icon: "🏠",
    title: "גגות ואלומיניום",
    color: "border-orange-200 bg-orange-50",
    iconBg: "bg-orange-100",
    badgeColor: "bg-orange-100 text-orange-700",
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
    color: "border-gray-200 bg-gray-50",
    iconBg: "bg-gray-100",
    badgeColor: "bg-gray-100 text-gray-700",
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
    color: "border-pink-200 bg-pink-50",
    iconBg: "bg-pink-100",
    badgeColor: "bg-pink-100 text-pink-700",
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
    color: "border-emerald-200 bg-emerald-50",
    iconBg: "bg-emerald-100",
    badgeColor: "bg-emerald-100 text-emerald-700",
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
    color: "border-green-200 bg-green-50",
    iconBg: "bg-green-100",
    badgeColor: "bg-green-100 text-green-700",
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
    color: "border-teal-200 bg-teal-50",
    iconBg: "bg-teal-100",
    badgeColor: "bg-teal-100 text-teal-700",
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
    color: "border-blue-200 bg-blue-50",
    iconBg: "bg-blue-100",
    badgeColor: "bg-blue-100 text-blue-700",
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
    color: "border-indigo-200 bg-indigo-50",
    iconBg: "bg-indigo-100",
    badgeColor: "bg-indigo-100 text-indigo-700",
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
    color: "border-slate-200 bg-slate-50",
    iconBg: "bg-slate-100",
    badgeColor: "bg-slate-100 text-slate-700",
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
    color: "border-orange-200 bg-orange-50",
    iconBg: "bg-orange-100",
    badgeColor: "bg-orange-100 text-orange-700",
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
  const MOCKUPS: Record<string, React.ReactNode> = {
    cleaning: (
      <div className="flex gap-1 mt-7"><div className="flex-1 h-14 bg-gray-400/40 rounded-l flex items-center justify-center text-[9px] text-white font-bold">לפני</div><div className="flex-1 h-14 bg-green-500/60 rounded-r flex items-center justify-center text-[9px] text-white font-bold">אחרי</div></div>
    ),
    cleaning_pro: (
      <div className="flex gap-1 mt-7"><div className="flex-1 h-14 bg-gray-400/40 rounded-l flex items-center justify-center text-[9px] text-white font-bold">לפני</div><div className="flex-1 h-14 bg-teal-500/60 rounded-r flex items-center justify-center text-[9px] text-white font-bold">אחרי</div></div>
    ),
    roofing: (
      <div className="flex gap-1 mt-7"><div className="flex-1 h-14 bg-gray-400/40 rounded-l flex items-center justify-center text-[9px] text-white font-bold">לפני</div><div className="flex-1 h-14 bg-orange-500/60 rounded-r flex items-center justify-center text-[9px] text-white font-bold">אחרי</div></div>
    ),
    construction: (
      <div className="flex gap-1 mt-7"><div className="flex-1 h-14 bg-gray-400/40 rounded-l flex items-center justify-center text-[9px] text-white font-bold">לפני</div><div className="flex-1 h-14 bg-gray-700/60 rounded-r flex items-center justify-center text-[9px] text-white font-bold">אחרי</div></div>
    ),
    cosmetics: (
      <div className="grid grid-cols-3 gap-1 mt-7">{[0.9,0.6,0.8,0.5,0.9,0.7].map((op,i) => <div key={i} className="h-6 rounded bg-pink-500" style={{ opacity: op }} />)}</div>
    ),
    real_estate: (
      <div className="flex gap-1 mt-7">{[1,2,3].map(i => <div key={i} className="flex-1 rounded border-2 border-blue-400 overflow-hidden"><div className="h-7 bg-blue-400/50" /><div className="p-1"><div className="h-1.5 bg-blue-500 rounded mb-1 w-3/4" /><div className="h-1 bg-gray-200 rounded" /></div></div>)}</div>
    ),
    agent_personal: (
      <div className="flex gap-1 mt-7"><div className="flex-[2] h-16 bg-indigo-500/50 rounded" /><div className="flex-1 flex flex-col gap-1"><div className="flex-1 bg-indigo-300/40 rounded" /><div className="flex-1 bg-indigo-400/40 rounded" /></div></div>
    ),
    realestate_office: (
      <div className="mt-7"><div className="h-4 bg-slate-700 rounded w-3/4 mb-2" /><div className="h-2.5 bg-slate-400/60 rounded w-full mb-1" /><div className="h-2.5 bg-slate-400/40 rounded w-2/3 mb-2" /><div className="h-5 bg-slate-600 rounded w-2/5" /></div>
    ),
    fitness_trainer: (
      <div className="flex gap-1.5 mt-7">{[{n:"500+",l:"לקוחות"},{n:"98%",l:"הצלחה"},{n:"10+",l:"שנים"}].map(s => <div key={s.n} className="flex-1 text-center bg-orange-500/20 rounded-lg py-1.5"><div className="text-xs font-extrabold text-orange-600">{s.n}</div><div className="text-[7px] text-gray-500">{s.l}</div></div>)}</div>
    ),
    finance_pro: (
      <div className="mt-7"><div className="h-4 bg-emerald-800 rounded w-3/4 mb-2" /><div className="h-2.5 bg-emerald-400/50 rounded w-full mb-1" /><div className="h-2.5 bg-emerald-400/30 rounded w-2/3 mb-2" /><div className="h-5 bg-emerald-600 rounded w-2/5" /></div>
    ),
  };

  return (
    <div className="h-[120px] relative overflow-hidden px-3 pt-0" style={{ background: "linear-gradient(160deg, rgba(99,102,241,0.06), rgba(99,102,241,0.15))" }}>
      <div className="absolute top-0 right-0 left-0 h-6 bg-gray-800 flex items-center gap-1.5 px-2.5">
        <span className="text-xs">{icon}</span>
        <div className="h-1.5 w-12 bg-white/40 rounded" />
      </div>
      {MOCKUPS[snapKey] ?? (
        <div className="flex gap-1 mt-7"><div className="flex-[2] h-16 bg-indigo-400/40 rounded" /><div className="flex-1 flex flex-col gap-1"><div className="flex-1 bg-gray-200 rounded" /><div className="flex-1 bg-gray-200 rounded" /></div></div>
      )}
    </div>
  );
}

function SnapshotPreviewModal({ snap, onClose }: { snap: (typeof SNAPSHOTS)[number]; onClose: () => void }) {
  const preview = SNAPSHOT_PREVIEWS[snap.key];
  if (!preview) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <span className="text-xl">{snap.icon}</span>
            זה יראה ככה:
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="overflow-hidden" style={{ height: 220 }}>
          <div style={{ transform: "scale(0.4)", transformOrigin: "top center", width: "250%", marginLeft: "-75%" }}>
            <div dir="rtl" className="font-sans">
              <div style={{ backgroundColor: preview.color, padding: "32px 24px", textAlign: "center", color: "#fff" }}>
                <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{preview.title}</h1>
                <p style={{ fontSize: 16, opacity: 0.9, marginBottom: 20 }}>{preview.subtitle}</p>
                <button style={{ backgroundColor: "#fff", color: preview.color, border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>{preview.cta}</button>
              </div>
              <div style={{ backgroundColor: "#f8fafc", padding: "24px 16px" }}>
                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                  {preview.features.map((f) => (
                    <div key={f} style={{ flex: 1, background: "#fff", borderRadius: 10, padding: "12px 8px", textAlign: "center", fontSize: 14, color: "#374151", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>{f}</div>
                  ))}
                </div>
              </div>
              <div style={{ backgroundColor: "#fff", padding: "20px 16px", textAlign: "center" }}>
                <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 12, color: "#111827" }}>השאר פרטים ונחזור אליך</p>
                <div style={{ background: "#f3f4f6", borderRadius: 8, height: 36, marginBottom: 8 }} />
                <div style={{ background: "#f3f4f6", borderRadius: 8, height: 36, marginBottom: 12 }} />
                <div style={{ backgroundColor: preview.color, color: "#fff", borderRadius: 10, padding: "10px 0", fontWeight: 700, fontSize: 16 }}>{preview.cta}</div>
              </div>
              <div style={{ backgroundColor: "#25d366", padding: "14px", textAlign: "center", color: "#fff", fontWeight: 600, fontSize: 16 }}>💬 דבר איתנו עכשיו בוואצאפ</div>
            </div>
          </div>
        </div>
        <div className="px-5 py-4 bg-gray-50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition">סגור</button>
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
      toast.success("התבנית הוחלה בהצלחה! ✅");
      onApplied(data.previewUrl ?? "");
      onClose();
    } catch {
      toast.error("שגיאת חיבור");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 left-4 text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <span className="text-3xl">{snap.icon}</span>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">החל תבנית — {snap.title}</h3>
            <p className="text-xs text-gray-500">בחר לקוח שעליו להחיל את התבנית</p>
          </div>
        </div>

        <div className="mb-5">
          <label className="text-sm font-medium text-gray-700 block mb-1.5">בחר לקוח</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 outline-none bg-white"
          >
            <option value="">בחר לקוח...</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2">
          <p className="text-xs font-semibold text-gray-600 mb-2">מה יוגדר אוטומטית:</p>
          {snap.features.map((f) => (
            <div key={f} className="flex items-center gap-2 text-xs text-gray-600">
              <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />
              {f}
            </div>
          ))}
        </div>

        <button
          onClick={apply}
          disabled={loading || !clientId}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
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
  const [applying, setApplying] = useState<(typeof SNAPSHOTS)[number] | null>(null);
  const [previewing, setPreviewing] = useState<(typeof SNAPSHOTS)[number] | null>(null);
  const [applied, setApplied] = useState<Map<string, string>>(new Map());
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/clients?limit=100")
      .then((r) => r.json())
      .then((d) => setClients(d.clients ?? []))
      .catch(() => {});
  }, []);

  const filteredSnaps = filter === "all"
    ? SNAPSHOTS
    : SNAPSHOTS.filter((s) => {
        const group = INDUSTRY_GROUPS.find((g) => g.label === filter);
        return group?.keys.includes(s.key);
      });

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Layout size={22} className="text-indigo-500" />
          🚀 התחל מתבנית
          <HelpButton page="snapshots" />
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          הגדרה מוכנה בלחיצה אחת — {SNAPSHOTS.length} תבניות לכל ענף
        </p>
      </div>

      {/* Industry filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
            filter === "all"
              ? "bg-indigo-600 text-white border-indigo-600"
              : "border-gray-200 text-gray-600 hover:border-gray-300"
          }`}
        >
          הכל ({SNAPSHOTS.length})
        </button>
        {INDUSTRY_GROUPS.map((g) => (
          <button
            key={g.label}
            onClick={() => setFilter(filter === g.label ? "all" : g.label)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
              filter === g.label
                ? "bg-indigo-600 text-white border-indigo-600"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
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
            className={`rounded-2xl border-2 overflow-hidden ${snap.color} hover:shadow-lg hover:-translate-y-1 transition-all relative`}
          >
            {/* Mini mockup preview */}
            <SnapMockup snapKey={snap.key} icon={snap.icon} />

            <div className="p-5">
            {/* Industry badge */}
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${snap.badgeColor}`}>
              {snap.industry}
            </span>

            <div className="flex items-start gap-3 mt-3 mb-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl ${snap.iconBg}`}>
                {snap.icon}
              </div>
              <div className="flex-1 pt-0.5">
                <h3 className="font-bold text-gray-900 text-base leading-tight">{snap.title}</h3>
                {applied.has(snap.key) && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle2 size={12} /> הוחל בהצלחה
                    </span>
                    {applied.get(snap.key) && (
                      <a
                        href={applied.get(snap.key)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
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
                <div key={f} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPreviewing(snap)}
                className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 hover:border-indigo-300 text-gray-600 hover:text-indigo-700 rounded-xl text-sm transition"
              >
                <Eye size={14} />
                תצוגה
              </button>
              <button
                onClick={() => setApplying(snap)}
                disabled={clients.length === 0}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition"
              >
                {clients.length === 0 ? "טוען..." : "החל על לקוח"}
              </button>
            </div>
          </div>{/* close p-5 */}
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
