"use client";

import { useState } from "react";
import { Download, ChevronDown, ChevronUp, Search, Wand2, Loader2, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

type IntakeForm = {
  id: string;
  formType: "CLIENT_ONBOARDING" | "LANDING_PAGE";
  fullName: string;
  businessName: string;
  email: string;
  phone: string | null;
  preferredContact: string | null;
  businessType: string | null;
  targetAudience: string | null;
  uniqueSellingPoint: string | null;
  operatingAreas: string | null;
  mainGoal: string | null;
  description: string | null;
  painPoints: string | null;
  marketingChannels: string | null;
  budgetRange: string | null;
  goals: string | null;
  notes: string | null;
  extraData: unknown;
  createdAt: Date;
};

const FORM_TYPE_LABEL: Record<string, { label: string; color: string }> = {
  CLIENT_ONBOARDING: { label: "טופס קבלת לקוח", color: "bg-blue-50 text-blue-700 border-blue-200" },
  LANDING_PAGE:      { label: "טופס אפיון לאתר",  color: "bg-green-50 text-green-700 border-green-200" },
};

const LABELS: Record<string, string> = {
  fullName: "שם מלא",
  businessName: "שם העסק",
  email: "אימייל",
  phone: "טלפון",
  preferredContact: "דרך קשר",
  businessType: "תחום עסק",
  targetAudience: "קהל יעד",
  uniqueSellingPoint: "ייחודיות",
  operatingAreas: "אזורי פעילות",
  mainGoal: "מטרה עיקרית",
  description: "תיאור",
  painPoints: "כאבים",
  marketingChannels: "ערוצי שיווק",
  budgetRange: "תקציב",
  goals: "ציפיות",
  notes: "הערות",
};

const EXTRA_LABELS: Record<string, string> = {
  businessField: "תחום פעילות",
  yearsActive: "שנות פעילות",
  teamSize: "גודל צוות",
  customerProblem: "בעיית הלקוח",
  discoverChannels: "ערוצי גילוי",
  whyChooseYou: "למה לבחור בך",
  monthlyLeadTarget: "יעד לידים חודשי",
  maxLeadCost: "עלות ליד מקסימלית",
  mainCompetitors: "מתחרים ראשיים",
  competitorStrengths: "חוזקות מתחרים",
  competitiveAdvantage: "יתרון תחרותי",
  mainServices: "שירותים ראשיים",
  mostProfitable: "שירות הכי רווחי",
  seasonalPromotions: "עונתיות/מבצעים",
  websiteUrl: "אתר אינטרנט",
  socialLinks: "רשתות חברתיות",
  googleReviews: "ביקורות גוגל",
  marketingSuccess: "שיווק שעבד",
  marketingFailure: "שיווק שלא עבד",
  campaignExpectation: "ציפיות קמפיין",
  additionalInfo: "מידע נוסף",
};

function exportToCSV(forms: IntakeForm[], clientName: string) {
  const allKeys = [
    "fullName", "businessName", "email", "phone", "preferredContact",
    "businessType", "targetAudience", "uniqueSellingPoint", "mainGoal", "budgetRange",
    "goals", "notes", "createdAt",
    ...Object.keys(EXTRA_LABELS),
  ];

  const header = allKeys.map((k) => LABELS[k] ?? EXTRA_LABELS[k] ?? k).join(",");
  const rows = forms.map((f) => {
    const extra = (typeof f.extraData === "object" && f.extraData) ? f.extraData as Record<string, string> : {};
    return allKeys.map((k) => {
      const val =
        k === "createdAt"
          ? new Date(f.createdAt).toLocaleDateString("he-IL")
          : k in f
          ? String((f as Record<string, unknown>)[k] ?? "")
          : String(extra[k] ?? "");
      return `"${val.replace(/"/g, '""')}"`;
    }).join(",");
  });

  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `intake-${clientName}-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ExpandedRow({ form }: { form: IntakeForm }) {
  const extra = (typeof form.extraData === "object" && form.extraData) ? form.extraData as Record<string, string> : {};

  const rows = [
    ...Object.entries(LABELS).filter(([k]) => k !== "fullName" && k !== "businessName" && k !== "email").map(([k, label]) => ({
      label,
      value: String((form as Record<string, unknown>)[k] ?? ""),
    })),
    ...Object.entries(EXTRA_LABELS).map(([k, label]) => ({
      label,
      value: extra[k] ?? "",
    })),
  ].filter((r) => r.value);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-5 bg-slate-50 border-t border-slate-100">
      {rows.map(({ label, value }) => (
        <div key={label} className="bg-white rounded-lg p-3 border border-slate-100">
          <p className="text-xs font-semibold text-slate-400 mb-1">{label}</p>
          <p className="text-sm text-slate-800 whitespace-pre-wrap">{value}</p>
        </div>
      ))}
    </div>
  );
}

function AutoLandingButton({ formId, clientId, clientSlug }: { formId: string; clientId: string; clientSlug: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  async function build() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/auto-landing-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, formId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "שגיאה"); return; }
      setDone(true);
      toast.success("דף נחיתה נוצר! ✨");
    } catch {
      toast.error("שגיאת חיבור");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={build}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs font-medium bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-2.5 py-1.5 rounded-lg transition"
      >
        {loading ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />}
        {loading ? "בונה..." : "בנה דף נחיתה"}
      </button>
      {done && (
        <a
          href={`/${clientSlug}`}
          target="_blank"
          className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
        >
          <ExternalLink size={11} /> צפה
        </a>
      )}
    </div>
  );
}

export function IntakeResponsesTable({
  forms,
  clientName,
  clientId,
  clientSlug,
}: {
  forms: IntakeForm[];
  clientName: string;
  clientId?: string;
  clientSlug?: string;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const filtered = forms.filter(
    (f) =>
      f.fullName.includes(search) ||
      f.businessName.includes(search) ||
      f.email.includes(search) ||
      (f.phone ?? "").includes(search)
  );

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חפש לפי שם / אימייל..."
            className="w-full rounded-lg border border-slate-200 pr-9 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <button
          onClick={() => exportToCSV(forms, clientName)}
          className="flex items-center gap-2 border border-slate-200 text-slate-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <Download size={15} />
          ייצוא CSV
        </button>
        {clientId && clientSlug && forms.length > 0 && (
          <AutoLandingButton
            formId={forms[0].id}
            clientId={clientId}
            clientSlug={clientSlug}
          />
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-center py-12 text-sm text-slate-500">לא נמצאו תגובות.</p>
        ) : (
          filtered.map((form) => {
            const isOpen = expanded.has(form.id);
            return (
              <div key={form.id} className="border-b border-slate-100 last:border-0">
                <button
                  onClick={() => toggle(form.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors text-right"
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {form.fullName?.[0] ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-slate-900">{form.fullName}</p>
                      {(() => {
                        const ft = FORM_TYPE_LABEL[form.formType];
                        return ft ? (
                          <span className={`text-[10px] font-medium border rounded-full px-1.5 py-0.5 ${ft.color}`}>
                            {ft.label}
                          </span>
                        ) : null;
                      })()}
                    </div>
                    <p className="text-xs text-slate-500">{form.businessName} · {form.email}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
                    {form.budgetRange && (
                      <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                        {form.budgetRange}
                      </span>
                    )}
                    {form.businessType && (
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {form.businessType}
                      </span>
                    )}
                    <span>{new Date(form.createdAt).toLocaleDateString("he-IL")}</span>
                  </div>
                  {isOpen ? <ChevronUp size={15} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={15} className="text-slate-400 flex-shrink-0" />}
                </button>
                {isOpen && <ExpandedRow form={form} />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
