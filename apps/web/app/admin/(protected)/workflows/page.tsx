"use client";

import { useState, useEffect, useRef } from "react";
import { Zap, Bell, FileText, Mail, CheckCircle2, XCircle, Clock, Loader2, Settings, type LucideIcon } from "lucide-react";
import toast from "react-hot-toast";

type WorkflowCard = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  active: boolean;
  lastRun: string | null;
  webhookUrl: string;
};

type SavedWorkflow = { active: boolean; webhookUrl: string };
type WorkflowSettings = Record<string, SavedWorkflow>;

const WORKFLOW_DEFS: Omit<WorkflowCard, "active" | "lastRun" | "webhookUrl">[] = [
  {
    id: "new-lead-whatsapp",
    title: "ליד חדש → וואצאפ מיידי",
    description: "כשמגיע ליד חדש, שולח הודעת וואצאפ אוטומטית לסוכן עם כל הפרטים",
    icon: Zap, iconColor: "text-green-600", iconBg: "bg-green-50",
  },
  {
    id: "followup-reminder",
    title: "תזכורת פולו-אפ",
    description: "מדי יום ב-9:00 בבוקר, שולח תזכורת על לידים שמצריכים טיפול",
    icon: Bell, iconColor: "text-amber-600", iconBg: "bg-amber-50",
  },
  {
    id: "weekly-report",
    title: "דוח שבועי אוטומטי",
    description: "כל יום שני ב-8:00, שולח דוח ביצועים שבועי ללקוח באימייל",
    icon: FileText, iconColor: "text-blue-600", iconBg: "bg-blue-50",
  },
  {
    id: "lead-email-notify",
    title: "ליד חדש → מייל ללקוח",
    description: "שולח מייל מיידי ללקוח כשמגיע ליד חדש עם כל הפרטים",
    icon: Mail, iconColor: "text-blue-600", iconBg: "bg-blue-50",
  },
];

function mergeWithDefaults(saved: WorkflowSettings | null): WorkflowCard[] {
  return WORKFLOW_DEFS.map((def) => ({
    ...def,
    active: saved?.[def.id]?.active ?? false,
    webhookUrl: saved?.[def.id]?.webhookUrl ?? "",
    lastRun: null,
  }));
}

function WorkflowCardItem({ wf, onToggle, onWebhookChange, onSave }: {
  wf: WorkflowCard;
  onToggle: () => void;
  onWebhookChange: (url: string) => void;
  onSave: () => void;
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [testing, setTesting] = useState(false);
  const Icon = wf.icon;

  async function handleTest() {
    if (!wf.webhookUrl) { toast.error("הגדר URL ל-Webhook לפני הבדיקה"); return; }
    setTesting(true);
    try {
      const res = await fetch(wf.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: wf.id, timestamp: new Date().toISOString(), test: true,
          data: { message: `בדיקת חיבור — ${wf.title}` } }),
      });
      if (res.ok) toast.success("הבדיקה עברה בהצלחה! ✓");
      else toast.error(`הבדיקה נכשלה (${res.status})`);
    } catch {
      toast.error("לא ניתן להגיע ל-Webhook — בדוק את הכתובת");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 transition-all ${wf.active ? "border-green-200" : "border-slate-100"}`}>
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${wf.iconBg}`}>
          <Icon size={20} className={wf.iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-900 text-sm">{wf.title}</h3>
            <div className="flex items-center gap-2">
              {wf.active ? (
                <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full font-medium">
                  <CheckCircle2 size={11} /> פעיל
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full font-medium">
                  <XCircle size={11} /> כבוי
                </span>
              )}
              {/* Toggle — fixed translate direction */}
              <button
                onClick={onToggle}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${wf.active ? "bg-green-500" : "bg-slate-300"}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${wf.active ? "translate-x-4" : "translate-x-1"}`} />
              </button>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">{wf.description}</p>
          {wf.lastRun && (
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <Clock size={11} /> הופעל לאחרונה: {new Date(wf.lastRun).toLocaleString("he-IL")}
            </p>
          )}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-1.5 text-xs border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition"
            >
              <Settings size={12} /> הגדר
            </button>
            <button
              onClick={handleTest}
              disabled={testing}
              className="flex items-center gap-1.5 text-xs border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
            >
              {testing ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
              בדוק
            </button>
          </div>
          {showSettings && (
            <div className="mt-3 p-3 bg-slate-50 rounded-lg">
              <label className="text-xs font-medium text-slate-600 block mb-1.5">n8n Webhook URL</label>
              <input
                type="url" dir="ltr"
                value={wf.webhookUrl}
                onChange={(e) => onWebhookChange(e.target.value)}
                onBlur={onSave}
                placeholder="https://n8n.your-domain.com/webhook/..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              />
              <p className="text-xs text-slate-400 mt-1">קבל URL זה מתוך n8n ← Webhook node</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowCard[]>(mergeWithDefaults(null));
  const [loadingInit, setLoadingInit] = useState(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load saved settings on mount
  useEffect(() => {
    fetch("/api/workflows/settings")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { workflowSettings?: WorkflowSettings } | null) => {
        if (d?.workflowSettings) {
          setWorkflows(mergeWithDefaults(d.workflowSettings));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingInit(false));
  }, []);

  function buildSettings(wfs: WorkflowCard[]): WorkflowSettings {
    return Object.fromEntries(wfs.map((wf) => [wf.id, { active: wf.active, webhookUrl: wf.webhookUrl }]));
  }

  function persistSettings(wfs: WorkflowCard[]) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      fetch("/api/workflows/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowSettings: buildSettings(wfs) }),
      }).catch(() => {});
    }, 600);
  }

  function toggleWorkflow(id: string) {
    setWorkflows((prev) => {
      const wf = prev.find((w) => w.id === id);
      const next = prev.map((w) => w.id === id ? { ...w, active: !w.active } : w);
      toast.success(wf?.active ? `"${wf.title}" כובה` : `"${wf?.title}" הופעל`);
      persistSettings(next);
      return next;
    });
  }

  function setWebhookUrl(id: string, url: string) {
    setWorkflows((prev) => prev.map((wf) => wf.id === id ? { ...wf, webhookUrl: url } : wf));
  }

  function saveImmediately() {
    persistSettings(workflows);
    toast.success("הגדרות נשמרו");
  }

  if (loadingInit) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">אוטומציות</h1>
          <p className="text-sm text-slate-500 mt-1">
            חבר את המערכת ל-n8n להפעלת אוטומציות חכמות. מחייב{" "}
            <a href="https://n8n.io" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              n8n self-hosted
            </a>.
          </p>
        </div>
      </div>

      {/* n8n setup card */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="text-3xl">🐙</div>
          <div>
            <h3 className="font-semibold text-slate-900">הגדרת n8n</h3>
            <p className="text-sm text-slate-600 mt-0.5 mb-3">הפעל n8n עם Docker בשתי שורות:</p>
            <pre className="bg-slate-900 text-green-400 text-xs px-4 py-3 rounded-lg overflow-x-auto font-mono leading-relaxed" dir="ltr">
{`docker run -d \\
  --name n8n \\
  -p 5678:5678 \\
  -v ~/.n8n:/home/node/.n8n \\
  n8nio/n8n`}
            </pre>
            <p className="text-xs text-slate-500 mt-2">לאחר מכן פתח <code dir="ltr" className="bg-slate-100 px-1 rounded">http://localhost:5678</code> וצור workflow לכל אוטומציה</p>
          </div>
        </div>
      </div>

      {/* Workflow cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {workflows.map((wf) => (
          <WorkflowCardItem
            key={wf.id}
            wf={wf}
            onToggle={() => toggleWorkflow(wf.id)}
            onWebhookChange={(url) => setWebhookUrl(wf.id, url)}
            onSave={saveImmediately}
          />
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        💡 <strong>טיפ:</strong> אחרי הגדרת n8n, העתק את ה-Webhook URL מכל workflow ב-n8n והדבק אותו בשדה &ldquo;הגדר&rdquo; למעלה. כל ליד חדש יופעל אוטומטית.
      </div>
    </div>
  );
}
