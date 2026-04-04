"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Settings, Users, Zap, MessageSquare,
  Plus, Trash2, Eye, EyeOff, Loader2,
  Check, AlertTriangle, UserCircle, Shield, ScrollText, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  client: { id: string; name: string } | null;
};

type Client = { id: string; name: string };

// ─── Tab definitions ───────────────────────────────────────────────────────

const TABS = [
  { key: "general",      label: "כללי",           icon: Settings },
  { key: "integrations", label: "אינטגרציות",     icon: Zap },
  { key: "templates",    label: "תבניות הודעות",  icon: MessageSquare },
  { key: "ai",           label: "שימוש AI",       icon: Sparkles },
  { key: "team",          label: "צוות ו-Webhook", icon: Users },
  { key: "users",        label: "משתמשים",        icon: Users },
  { key: "audit",        label: "יומן פעילות",    icon: ScrollText },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "סופר אדמין",
  ADMIN: "אדמין",
  AGENT: "סוכן",
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-700",
  ADMIN: "bg-indigo-100 text-indigo-700",
  AGENT: "bg-gray-100 text-gray-600",
};

// ─── General Tab ──────────────────────────────────────────────────────────

function GeneralTab() {
  const [form, setForm] = useState({
    systemName: "MarketingOS",
    adminEmail: "",
    timezone: "Asia/Jerusalem",
  });
  const [saving, setSaving] = useState(false);

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("ההגדרות נשמרו בהצלחה!");
    }, 800);
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-4">הגדרות מערכת</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">שם המערכת</label>
            <input
              value={form.systemName}
              onChange={(e) => setForm((f) => ({ ...f, systemName: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">אימייל מנהל</label>
            <input
              type="email"
              dir="ltr"
              value={form.adminEmail}
              onChange={(e) => setForm((f) => ({ ...f, adminEmail: e.target.value }))}
              placeholder="admin@example.com"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">אזור זמן</label>
            <select
              value={form.timezone}
              onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="Asia/Jerusalem">ישראל (UTC+2/+3)</option>
              <option value="Europe/London">לונדון (UTC+0/+1)</option>
              <option value="America/New_York">ניו יורק (UTC-5/-4)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-100">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {saving ? "שומר..." : "שמור הגדרות"}
        </button>
      </div>

      {/* Subdomain guide */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <h3 className="text-base font-semibold text-gray-900 mb-4">הגדרת תת-דומיינים</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">מדריך הגדרה שלב אחר שלב</p>
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">1</span>
              <p className="text-sm text-gray-700 pt-0.5">קנה דומיין <span className="font-mono font-semibold">marketingos.co.il</span></p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">2</span>
              <p className="text-sm text-gray-700 pt-0.5">
                הוסף ב-DNS: <span className="font-mono bg-white border border-gray-200 rounded px-1.5 py-0.5 text-xs">CNAME *.marketingos.co.il → cname.vercel-dns.com</span>
              </p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">3</span>
              <p className="text-sm text-gray-700 pt-0.5">
                הוסף ב-Vercel: wildcard domain <span className="font-mono bg-white border border-gray-200 rounded px-1.5 py-0.5 text-xs">*.marketingos.co.il</span>
              </p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">4</span>
              <p className="text-sm text-gray-700 pt-0.5">
                כל לקוח מקבל אוטומטית <span className="font-mono bg-white border border-gray-200 rounded px-1.5 py-0.5 text-xs">{"{slug}"}.marketingos.co.il</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Integrations Tab ─────────────────────────────────────────────────────

function IntegrationsTab() {
  const [showResend, setShowResend] = useState(false);
  const [testingN8n, setTestingN8n] = useState(false);
  const [n8nStatus, setN8nStatus] = useState<"idle" | "ok" | "error">("idle");
  const [n8nUrl, setN8nUrl] = useState(process.env.NEXT_PUBLIC_N8N_URL ?? "");

  async function testN8nConnection() {
    if (!n8nUrl) {
      toast.error("הכנס כתובת webhook לפני הבדיקה");
      return;
    }
    setTestingN8n(true);
    setN8nStatus("idle");
    try {
      const res = await fetch("/api/webhooks/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: n8nUrl }),
      });
      if (res.ok) {
        setN8nStatus("ok");
        toast.success("החיבור ל-n8n תקין!");
      } else {
        setN8nStatus("error");
        toast.error("לא ניתן להתחבר ל-n8n");
      }
    } catch {
      setN8nStatus("error");
      toast.error("שגיאת חיבור לשרת");
    } finally {
      setTestingN8n(false);
    }
  }

  const integrations = [
    {
      name: "n8n Webhooks",
      description: "אוטומציות ו-workflows דרך n8n",
      color: "bg-orange-100",
      iconColor: "text-orange-600",
      content: (
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">כתובת Webhook ברירת מחדל</label>
            <input
              dir="ltr"
              value={n8nUrl}
              onChange={(e) => setN8nUrl(e.target.value)}
              placeholder="https://n8n.example.com/webhook/..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={testN8nConnection}
              disabled={testingN8n}
              className="flex items-center gap-2 border border-gray-200 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              {testingN8n ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
              בדוק חיבור
            </button>
            {n8nStatus === "ok" && (
              <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                <Check size={12} /> מחובר
              </span>
            )}
            {n8nStatus === "error" && (
              <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                <AlertTriangle size={12} /> לא מחובר
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      name: "Resend (מיילים)",
      description: "שליחת דוחות ועדכונים במייל",
      color: "bg-blue-100",
      iconColor: "text-blue-600",
      content: (
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">מפתח API</label>
            <div className="relative">
              <input
                dir="ltr"
                type={showResend ? "text" : "password"}
                defaultValue=""
                placeholder="re_xxxxxxxxxxxx"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                type="button"
                onClick={() => setShowResend(!showResend)}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showResend ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">ניתן לשנות רק בקובץ .env.local</p>
          </div>
        </div>
      ),
    },
    {
      name: "Facebook Ads",
      description: "טפסי לידים ו-Pixel מ-Facebook",
      color: "bg-indigo-100",
      iconColor: "text-indigo-600",
      content: (
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">App ID</label>
            <input dir="ltr" placeholder="123456789" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">App Secret</label>
            <input dir="ltr" type="password" placeholder="••••••••••••••••" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <p className="text-xs text-gray-400">הגדרות אלו נשמרות בקובץ .env.local</p>
        </div>
      ),
    },
    {
      name: "Google Ads",
      description: "ייבוא לידים ועקיבה אחר המרות",
      color: "bg-red-100",
      iconColor: "text-red-600",
      content: (
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Developer Token</label>
            <input dir="ltr" placeholder="ABCdEfGhIjKlMnOp" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <p className="text-xs text-gray-400">הגדרות אלו נשמרות בקובץ .env.local</p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <p className="text-sm text-gray-500">
        הגדרות אינטגרציות ברמת המערכת. לאינטגרציות ספציפיות ללקוח, כנס לדף הלקוח ← הגדרות.
      </p>
      {integrations.map((intg) => (
        <div key={intg.name} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", intg.color)}>
              <Zap size={16} className={intg.iconColor} />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 text-sm">{intg.name}</h4>
              <p className="text-xs text-gray-500 mt-0.5">{intg.description}</p>
              {intg.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Message Templates Tab ────────────────────────────────────────────────

function TemplatesTab() {
  const [templates, setTemplates] = useState({
    whatsappNewLead: "שלום {name}! קיבלנו את פנייתך ונחזור אליך בהקדם. צוות {clientName}",
    smsNewLead: "שלום {name}, קיבלנו את פנייתך ונחזור אליך בהקדם.",
    emailSubject: "דוח שבועי — {clientName} | {period}",
    emailBody: "שלום,\n\nמצורף דוח שבועי עבור {clientName}.\n\nסה\"כ לידים: {totalLeads}\nהמרות: {conversionRate}%\n\nבברכה,\nMarketingOS",
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    toast.success("התבניות נשמרו!");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <p className="text-sm text-gray-500">
        תבניות הודעות עם משתנים דינמיים. השתמש ב-{"{"}name{"}"}, {"{"}phone{"}"}, {"{"}clientName{"}"} וכו׳
      </p>

      {/* WhatsApp */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
            <MessageSquare size={14} className="text-green-600" />
          </div>
          <h4 className="font-semibold text-gray-900 text-sm">WhatsApp — ליד חדש</h4>
        </div>
        <textarea
          rows={3}
          value={templates.whatsappNewLead}
          onChange={(e) => setTemplates((t) => ({ ...t, whatsappNewLead: e.target.value }))}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">משתנים: {"{"}name{"}"}, {"{"}phone{"}"}, {"{"}email{"}"}, {"{"}clientName{"}"}</p>
      </div>

      {/* SMS */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
            <MessageSquare size={14} className="text-blue-600" />
          </div>
          <h4 className="font-semibold text-gray-900 text-sm">SMS — ליד חדש</h4>
        </div>
        <textarea
          rows={2}
          value={templates.smsNewLead}
          onChange={(e) => setTemplates((t) => ({ ...t, smsNewLead: e.target.value }))}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        />
      </div>

      {/* Email */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
            <MessageSquare size={14} className="text-indigo-600" />
          </div>
          <h4 className="font-semibold text-gray-900 text-sm">מייל — דוח שבועי</h4>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">נושא</label>
            <input
              value={templates.emailSubject}
              onChange={(e) => setTemplates((t) => ({ ...t, emailSubject: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">תוכן</label>
            <textarea
              rows={6}
              value={templates.emailBody}
              onChange={(e) => setTemplates((t) => ({ ...t, emailBody: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none font-mono"
            />
          </div>
          <p className="text-xs text-gray-400">משתנים: {"{"}clientName{"}"}, {"{"}period{"}"}, {"{"}totalLeads{"}"}, {"{"}conversionRate{"}"}</p>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        {saving ? "שומר..." : "שמור תבניות"}
      </button>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────

function UsersTab({
  initialUsers,
  clients,
  currentUserId,
}: {
  initialUsers: User[];
  clients: Client[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    name: "", email: "", password: "", role: "AGENT", clientId: "",
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      setAddError("כל השדות המסומנים בכוכבית הם חובה");
      return;
    }
    setAddLoading(true);
    setAddError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          password: newUser.password,
          role: newUser.role,
          clientId: newUser.clientId || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) => [data.user, ...prev]);
        setShowAddForm(false);
        setNewUser({ name: "", email: "", password: "", role: "AGENT", clientId: "" });
        toast.success("משתמש נוצר בהצלחה!");
      } else {
        setAddError(data.error ?? "שגיאה ביצירת משתמש");
      }
    } catch {
      setAddError("שגיאת חיבור לשרת");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDelete(userId: string) {
    if (userId === currentUserId) {
      toast.error("לא ניתן למחוק את המשתמש הנוכחי");
      return;
    }
    if (!confirm("האם אתה בטוח? פעולה זו לא ניתנת לביטול.")) return;
    setDeleting(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        toast.success("משתמש נמחק");
      } else {
        toast.error("שגיאה במחיקת משתמש");
      }
    } catch {
      toast.error("שגיאת חיבור");
    } finally {
      setDeleting(null);
    }
  }

  async function handleToggleActive(userId: string, isActive: boolean) {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isActive: !isActive } : u));
        toast.success(isActive ? "משתמש הושבת" : "משתמש הופעל");
      }
    } catch {
      toast.error("שגיאה בעדכון משתמש");
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">משתמשי מערכת</h3>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} משתמשים פעילים</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={15} />
          הוסף משתמש
        </button>
      </div>

      {/* Add user form */}
      {showAddForm && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
          <h4 className="font-semibold text-gray-900 text-sm mb-4">משתמש חדש</h4>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">שם מלא *</label>
                <input
                  value={newUser.name}
                  onChange={(e) => setNewUser((f) => ({ ...f, name: e.target.value }))}
                  placeholder="ישראל ישראלי"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">אימייל *</label>
                <input
                  type="email"
                  dir="ltr"
                  value={newUser.email}
                  onChange={(e) => setNewUser((f) => ({ ...f, email: e.target.value }))}
                  placeholder="user@example.com"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">סיסמה *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    dir="ltr"
                    value={newUser.password}
                    onChange={(e) => setNewUser((f) => ({ ...f, password: e.target.value }))}
                    placeholder="לפחות 8 תווים"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm pr-9 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">תפקיד</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser((f) => ({ ...f, role: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="AGENT">סוכן</option>
                  <option value="ADMIN">אדמין</option>
                  <option value="SUPER_ADMIN">סופר אדמין</option>
                </select>
              </div>
            </div>

            {clients.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  שייך ללקוח (ריק = גישה לכל הלקוחות)
                </label>
                <select
                  value={newUser.clientId}
                  onChange={(e) => setNewUser((f) => ({ ...f, clientId: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="">— כל הלקוחות —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {addError && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{addError}</p>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={addLoading}
                className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
              >
                {addLoading && <Loader2 size={13} className="animate-spin" />}
                {addLoading ? "יוצר..." : "צור משתמש"}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setAddError(null); }}
                className="border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users list */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              {["משתמש", "תפקיד", "לקוח", "כניסה אחרונה", "סטטוס", "פעולות"].map((h) => (
                <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((user) => (
              <tr key={user.id} className={cn("hover:bg-gray-50/60 transition-colors", !user.isActive && "opacity-50")}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <UserCircle size={16} className="text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("text-xs px-2 py-1 rounded-full font-medium", ROLE_COLORS[user.role] ?? "bg-gray-100 text-gray-600")}>
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {user.client?.name ?? <span className="text-gray-300">כולם</span>}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleDateString("he-IL")
                    : "מעולם לא"}
                </td>
                <td className="px-4 py-3">
                  <span className={cn("text-xs px-2 py-1 rounded-full font-medium",
                    user.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  )}>
                    {user.isActive ? "פעיל" : "מושבת"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleActive(user.id, user.isActive)}
                      title={user.isActive ? "השבת" : "הפעל"}
                      className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Shield size={14} />
                    </button>
                    {user.id !== currentUserId && (
                      <button
                        onClick={() => handleDelete(user.id)}
                        disabled={deleting === user.id}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                      >
                        {deleting === user.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="px-6 py-12 text-center">
            <Users size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-500">אין משתמשים במערכת עדיין</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── IntegrationsTab with real DB saves ──────────────────────────────────

function IntegrationsTabDB({
  initial,
}: {
  initial: { resendKey?: string | null; n8nDefaultUrl?: string | null; twilioSid?: string | null; twilioFrom?: string | null } | null;
}) {
  const [n8nUrl,    setN8nUrl]    = useState(initial?.n8nDefaultUrl ?? "");
  const [resendKey, setResendKey] = useState(initial?.resendKey    ?? "");
  const [twilioSid, setTwilioSid] = useState(initial?.twilioSid   ?? "");
  const [twilioFrom, setTwilioFrom] = useState(initial?.twilioFrom ?? "");
  const [saving,    setSaving]    = useState(false);
  const [testing,   setTesting]   = useState(false);
  const [n8nStatus, setN8nStatus] = useState<"idle"|"ok"|"error">("idle");
  const [showResend, setShowResend] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ n8nDefaultUrl: n8nUrl, resendKey, twilioSid, twilioFrom }),
      });
      if (res.ok) { toast.success("ההגדרות נשמרו!"); }
      else { const d = await res.json(); toast.error(d.error ?? "שגיאה בשמירה"); }
    } catch { toast.error("שגיאת חיבור"); }
    finally { setSaving(false); }
  }

  async function testN8n() {
    if (!n8nUrl) { toast.error("הכנס כתובת webhook"); return; }
    setTesting(true); setN8nStatus("idle");
    try {
      const res = await fetch(n8nUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "test", source: "MarketingOS" }),
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok || res.status < 500) { setN8nStatus("ok"); toast.success("החיבור ל-n8n תקין!"); }
      else { setN8nStatus("error"); toast.error("לא ניתן להתחבר"); }
    } catch { setN8nStatus("error"); toast.error("לא ניתן להתחבר ל-n8n"); }
    finally { setTesting(false); }
  }

  return (
    <div className="space-y-5 max-w-xl">
      <p className="text-sm text-gray-500">הגדרות אינטגרציות ברמת המשתמש. לאינטגרציות ספציפיות ללקוח — כנס לדף הלקוח.</p>

      {/* n8n */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center"><Zap size={14} className="text-orange-600"/></div>
          <h4 className="font-semibold text-gray-900 text-sm">n8n Webhooks</h4>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Webhook ברירת מחדל</label>
          <input dir="ltr" value={n8nUrl} onChange={(e) => setN8nUrl(e.target.value)}
            placeholder="https://n8n.example.com/webhook/..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={testN8n} disabled={testing}
            className="flex items-center gap-1.5 border border-gray-200 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-60">
            {testing ? <Loader2 size={13} className="animate-spin"/> : <Zap size={13}/>} בדוק חיבור
          </button>
          {n8nStatus === "ok"    && <span className="text-xs text-green-600 flex items-center gap-1"><Check size={12}/> מחובר</span>}
          {n8nStatus === "error" && <span className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={12}/> לא מחובר</span>}
        </div>
      </div>

      {/* Resend */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center"><MessageSquare size={14} className="text-blue-600"/></div>
          <h4 className="font-semibold text-gray-900 text-sm">Resend (מיילים)</h4>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">מפתח API</label>
          <div className="relative">
            <input dir="ltr" type={showResend ? "text" : "password"} value={resendKey}
              onChange={(e) => setResendKey(e.target.value)} placeholder="re_xxxxxxxxxxxx"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm pr-9 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <button type="button" onClick={() => setShowResend(!showResend)}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
              {showResend ? <EyeOff size={13}/> : <Eye size={13}/>}
            </button>
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg">
        {saving ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>}
        {saving ? "שומר..." : "שמור הגדרות"}
      </button>
    </div>
  );
}

// ─── TemplatesTab with real DB saves ──────────────────────────────────────

type TemplateRow = { type: string; content: string; subject?: string | null };

function TemplatesTabDB({ initial }: { initial: TemplateRow[] }) {
  const DEFAULT_TEMPLATES: Record<string, TemplateRow> = {
    WHATSAPP_NEW_LEAD: {
      type:    "WHATSAPP_NEW_LEAD",
      content: "שלום {clientName}! ליד חדש נכנס:\nשם: {leadName}\nטלפון: {leadPhone}\nמקור: {source}",
    },
    SMS_NEW_LEAD: {
      type:    "SMS_NEW_LEAD",
      content: "שלום {name}, קיבלנו את פנייתך ונחזור אליך בהקדם.",
    },
    EMAIL_REPORT: {
      type:    "EMAIL_REPORT",
      subject: "דוח שבועי — {clientName} | {period}",
      content: "שלום,\n\nמצורף דוח שבועי עבור {clientName}.\n\nסה\"כ לידים: {totalLeads}\nהמרות: {conversionRate}%\n\nבברכה,\nMarketingOS",
    },
  };

  const merged = { ...DEFAULT_TEMPLATES };
  for (const t of initial) { merged[t.type] = t; }
  const [templates, setTemplates] = useState(merged);
  const [saving, setSaving] = useState(false);

  async function saveTemplate(type: string) {
    setSaving(true);
    try {
      const t = templates[type];
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: t.type, content: t.content, subject: t.subject }),
      });
      if (res.ok) { toast.success("התבנית נשמרה!"); }
      else { toast.error("שגיאה בשמירה"); }
    } catch { toast.error("שגיאת חיבור"); }
    finally { setSaving(false); }
  }

  function update(type: string, field: string, value: string) {
    setTemplates((prev) => ({ ...prev, [type]: { ...prev[type], [field]: value } }));
  }

  return (
    <div className="max-w-2xl space-y-5">
      <p className="text-sm text-gray-500">תבניות הודעות. השתמש ב-{"{"}leadName{"}"}, {"{"}leadPhone{"}"}, {"{"}clientName{"}"} וכו׳</p>

      {/* WhatsApp */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center"><MessageSquare size={14} className="text-green-600"/></div>
            <h4 className="font-semibold text-gray-900 text-sm">WhatsApp — ליד חדש</h4>
          </div>
          <button onClick={() => saveTemplate("WHATSAPP_NEW_LEAD")} disabled={saving}
            className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-60">
            {saving ? "שומר..." : "שמור"}
          </button>
        </div>
        <textarea rows={3} value={templates.WHATSAPP_NEW_LEAD?.content ?? ""}
          onChange={(e) => update("WHATSAPP_NEW_LEAD", "content", e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"/>
        <p className="text-xs text-gray-400">משתנים: {"{"}leadName{"}"}, {"{"}leadPhone{"}"}, {"{"}clientName{"}"}, {"{"}source{"}"}</p>
      </div>

      {/* Email report */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center"><MessageSquare size={14} className="text-indigo-600"/></div>
            <h4 className="font-semibold text-gray-900 text-sm">מייל — דוח שבועי</h4>
          </div>
          <button onClick={() => saveTemplate("EMAIL_REPORT")} disabled={saving}
            className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-60">
            {saving ? "שומר..." : "שמור"}
          </button>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">נושא</label>
          <input value={templates.EMAIL_REPORT?.subject ?? ""}
            onChange={(e) => update("EMAIL_REPORT", "subject", e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">תוכן</label>
          <textarea rows={5} value={templates.EMAIL_REPORT?.content ?? ""}
            onChange={(e) => update("EMAIL_REPORT", "content", e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none font-mono"/>
        </div>
        <p className="text-xs text-gray-400">משתנים: {"{"}clientName{"}"}, {"{"}period{"}"}, {"{"}totalLeads{"}"}, {"{"}conversionRate{"}"}</p>
      </div>
    </div>
  );
}

// ─── Audit Log Tab ────────────────────────────────────────────────────────

type AuditEntry = { id: string; action: string; entityId?: string | null; meta: Record<string, unknown> | null; createdAt: string; userId?: string | null };

function TeamWebhookTab({ userId }: { userId: string }) {
  const [members, setMembers] = useState<{ id: string; role: string; member: { id: string; name: string | null; email: string } }[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("AGENT");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/team").then((r) => r.json()).then((d) => setMembers(d.members ?? [])).catch(() => {});
  }, []);

  async function invite() {
    const res = await fetch("/api/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, role }) });
    const data = (await res.json()) as { ok?: boolean; invited?: boolean; message?: string };
    setMsg(data.invited ? "📧 הזמנה נשלחה!" : data.ok ? "✅ חבר נוסף!" : "שגיאה");
    setEmail("");
    fetch("/api/team").then((r) => r.json()).then((d) => setMembers(d.members ?? []));
    setTimeout(() => setMsg(""), 3000);
  }

  async function remove(memberId: string) {
    await fetch("/api/team", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberId }) });
    setMembers((p) => p.filter((m) => m.member.id !== memberId));
  }

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const webhookUrl = `${appUrl}/api/webhooks/incoming/${userId}`;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Team */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-bold text-base mb-1">👥 חברי צוות</h3>
        <p className="text-xs text-gray-500 mb-4">הוסף סוכנים שיוכלו לנהל לקוחות</p>
        <div className="flex gap-2 mb-3">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="אימייל חבר הצוות" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400" />
          <select value={role} onChange={(e) => setRole(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-2 text-sm">
            <option value="AGENT">סוכן</option>
            <option value="MANAGER">מנהל</option>
          </select>
          <button onClick={invite} disabled={!email} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold disabled:opacity-40">+ הזמן</button>
        </div>
        {msg && <div className="text-sm text-green-600 font-medium mb-2">{msg}</div>}
        {members.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">אין חברי צוות עדיין</p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5">
                <div>
                  <p className="font-semibold text-sm">{m.member.name ?? m.member.email}</p>
                  <p className="text-xs text-gray-500">{m.member.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-semibold">{m.role === "MANAGER" ? "מנהל" : "סוכן"}</span>
                  <button onClick={() => remove(m.member.id)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Webhook */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h4 className="font-bold text-sm mb-1">🔗 Zapier / Make.com Webhook</h4>
        <p className="text-xs text-gray-600 mb-3">חבר כלים חיצוניים — לידים מגיעים אוטומטית</p>
        <div className="bg-white border border-blue-200 rounded-lg px-3 py-2 font-mono text-[11px] text-gray-600 break-all mb-2">{webhookUrl}</div>
        <button onClick={() => navigator.clipboard.writeText(webhookUrl)} className="px-4 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-semibold">📋 העתק URL</button>
      </div>
    </div>
  );
}

function AuditLogTab() {
  const [logs, setLogs]     = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded]  = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/audit-logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs ?? []);
      }
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }

  if (!loaded) {
    return (
      <div className="text-center py-12">
        <button
          onClick={load}
          className="flex items-center gap-2 mx-auto bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium text-sm px-5 py-2.5 rounded-lg transition-colors"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <ScrollText size={15} />}
          {loading ? "טוען..." : "טען יומן פעילות"}
        </button>
      </div>
    );
  }

  const ACTION_COLORS: Record<string, string> = {
    "login.success":   "bg-green-100 text-green-700",
    "login.failed":    "bg-red-100 text-red-700",
    "user.registered": "bg-blue-100 text-blue-700",
    "client.create":   "bg-indigo-100 text-indigo-700",
    "client.delete":   "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{logs.length} רשומות אחרונות</p>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : null}
          רענן
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              {["פעולה", "ישות", "IP / מידע", "זמן"].map((h) => (
                <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <span className={cn("text-xs px-2 py-1 rounded-full font-medium", ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-600")}>
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 font-mono">{log.entityId ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {log.meta ? (
                    <span className="font-mono">{(log.meta as {ip?:string}).ip ?? JSON.stringify(log.meta).slice(0, 60)}</span>
                  ) : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {new Date(log.createdAt).toLocaleString("he-IL")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && (
          <p className="px-6 py-10 text-center text-sm text-gray-500">אין רשומות ביומן.</p>
        )}
      </div>
    </div>
  );
}

// ─── AI Usage Tab ─────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  "landing-page":   "דף נחיתה",
  "whatsapp":       "הודעת WhatsApp",
  "property-description": "תיאור נכס",
  "weekly-report":  "סיכום שבועי",
  "seo-meta":       "SEO מטא",
  "social-post":    "פוסט רשתות חברתיות",
  "followup":       "הודעת פולו-אפ",
};

function AiUsageTab() {
  const [data, setData] = useState<{
    totalThisMonth: number;
    todayCount: number;
    tokensThisMonth: number;
    byType: { type: string; count: number; tokens: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/ai/usage");
        if (res.ok) setData(await res.json() as typeof data);
        else setError("שגיאה בטעינת נתוני AI");
      } catch {
        setError("שגיאת רשת");
      } finally {
        setLoading(false);
      }
    })().catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-500 py-8 text-center">{error}</p>;
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-4">שימוש AI החודש</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-indigo-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-indigo-700">{data?.totalThisMonth ?? 0}</p>
            <p className="text-xs text-indigo-500 mt-1">קריאות החודש</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-purple-700">{data?.todayCount ?? 0}</p>
            <p className="text-xs text-purple-500 mt-1">קריאות היום</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{((data?.tokensThisMonth ?? 0) / 1000).toFixed(1)}K</p>
            <p className="text-xs text-green-500 mt-1">טוקנים שנוצלו</p>
          </div>
        </div>
      </div>

      {data?.byType && data.byType.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">לפי סוג</h4>
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500">סוג</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500">קריאות</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500">טוקנים</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.byType.map((b) => (
                  <tr key={b.type} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700">{TYPE_LABELS[b.type] ?? b.type}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{b.count}</td>
                    <td className="px-4 py-3 text-gray-500">{b.tokens.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(!data?.byType || data.byType.length === 0) && (
        <div className="text-center py-10">
          <Sparkles size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm text-gray-500">עדיין לא נעשה שימוש ב-AI החודש</p>
          <p className="text-xs text-gray-400 mt-1">לחץ על ✨ בעורך דף הנחיתה כדי להתחיל</p>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-xs text-yellow-700">
        מגבלה: תוכנית Basic — 20 קריאות ליום. שדרג ל-Pro לקריאות ללא הגבלה.
      </div>
    </div>
  );
}

// ─── Main Settings Component ──────────────────────────────────────────────

export function SettingsClient({
  users,
  clients,
  isSuperAdmin,
  currentUserId,
  initialSettings = null,
  initialTemplates = [],
}: {
  users: User[];
  clients: Client[];
  isSuperAdmin: boolean;
  currentUserId: string;
  initialSettings?: {
    resendKey?: string | null;
    n8nDefaultUrl?: string | null;
    twilioSid?: string | null;
    twilioFrom?: string | null;
  } | null;
  initialTemplates?: { type: string; content: string; subject?: string | null }[];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("general");

  const visibleTabs = isSuperAdmin
    ? TABS
    : TABS.filter((t) => t.key !== "users" && t.key !== "audit");

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">הגדרות</h1>
        <p className="text-sm text-gray-500 mt-0.5">ניהול מערכת, אינטגרציות ומשתמשים</p>
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all",
                  active
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="py-2">
        {activeTab === "general"      && <GeneralTab />}
        {activeTab === "integrations" && <IntegrationsTabDB initial={initialSettings} />}
        {activeTab === "templates"    && <TemplatesTabDB initial={initialTemplates} />}
        {activeTab === "ai"           && <AiUsageTab />}
        {activeTab === "team"          && <TeamWebhookTab userId={currentUserId} />}
        {activeTab === "users"        && isSuperAdmin && (
          <UsersTab initialUsers={users} clients={clients} currentUserId={currentUserId} />
        )}
        {activeTab === "audit" && isSuperAdmin && <AuditLogTab />}
      </div>
    </div>
  );
}
