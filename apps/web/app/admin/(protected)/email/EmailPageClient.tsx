"use client";

import { useState } from "react";
import { Loader2, Sparkles, Copy, Check, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { EmailSequencesClient } from "@/app/admin/(protected)/email-sequences/EmailSequencesClient";

const TABS = [
  { id: "templates", label: "📧 תבניות מייל" },
  { id: "sequences", label: "🔄 רצפי מייל" },
] as const;

type TabId = "templates" | "sequences";

const DEFAULT_TEMPLATES = [
  {
    id: "welcome",
    name: "ברוכים הבאים",
    subject: "ברוכים הבאים ל{businessName}!",
    body: "שלום {name},\n\nשמחים שפנית אלינו!\nניצור איתך קשר בהקדם.\n\nצוות {businessName}",
    icon: "👋",
  },
  {
    id: "followup",
    name: "פולו-אפ ליד",
    subject: "המשך לפנייתך ל{businessName}",
    body: "שלום {name},\n\nרצינו לוודא שקיבלת את פנייתך.\nאנחנו כאן לכל שאלה!\n\nצוות {businessName}",
    icon: "🔔",
  },
  {
    id: "weekly_report",
    name: "דוח שבועי",
    subject: "דוח ביצועים שבועי — {businessName}",
    body: "שלום,\n\nמצורף דוח הביצועים השבועי שלך.\n\nלידים חדשים: {leadsCount}\nהמרה: {conversionRate}%",
    icon: "📊",
  },
  {
    id: "quote",
    name: "הצעת מחיר",
    subject: "הצעת מחיר מ{businessName}",
    body: "שלום {name},\n\nשמחים לשלוח לך הצעת מחיר:\n\n[פרטי ההצעה]\n\nנשמח לשמוע ממך!",
    icon: "💰",
  },
  {
    id: "appointment",
    name: "תזכורת פגישה",
    subject: "תזכורת לפגישה שלנו מחר",
    body: "שלום {name},\n\nמזכירים לך שיש לנו פגישה מחר.\nנשמח לראות אותך!\n\nצוות {businessName}",
    icon: "📅",
  },
];

type ClientItem = {
  id: string;
  name: string;
  slug: string;
  primaryColor: string;
};

interface Props {
  clients: ClientItem[];
  initialTab: TabId;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("הועתק!");
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600 transition"
    >
      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
    </button>
  );
}

function TemplatesTab() {
  const [selectedTemplate, setSelectedTemplate] = useState<
    (typeof DEFAULT_TEMPLATES)[0] | null
  >(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<{
    subject: string;
    body: string;
  } | null>(null);

  async function generateAiTemplate() {
    if (!aiTopic.trim()) return;
    setAiGenerating(true);
    try {
      const res = await fetch("/api/ai/email-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: aiTopic }),
      });
      if (!res.ok) {
        toast.error("שגיאה ביצירת תבנית");
        return;
      }
      const data = await res.json();
      setAiResult(data);
    } catch {
      toast.error("שגיאה ביצירת תבנית");
    } finally {
      setAiGenerating(false);
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Pre-built templates grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">תבניות מוכנות</h2>
          <button
            onClick={() => {
              setAiResult(null);
              setAiTopic("");
              setShowAiModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Sparkles size={15} /> + צור תבנית עם AI
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          משתנים זמינים:{" "}
          <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">
            {"{name}"}
          </code>{" "}
          <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">
            {"{phone}"}
          </code>{" "}
          <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">
            {"{businessName}"}
          </code>{" "}
          <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">
            {"{leadsCount}"}
          </code>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEFAULT_TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3 hover:border-blue-200 transition-all"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{tpl.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">{tpl.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {tpl.subject}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-400 line-clamp-3 whitespace-pre-wrap">
                {tpl.body}
              </p>
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => setSelectedTemplate(tpl)}
                  className="flex-1 text-xs border border-slate-200 rounded-lg py-1.5 text-slate-600 hover:border-blue-300 hover:text-blue-600 transition"
                >
                  ערוך
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `נושא: ${tpl.subject}\n\n${tpl.body}`
                    );
                    toast.success("תבנית הועתקה!");
                  }}
                  className="flex-1 text-xs bg-blue-50 border border-blue-200 rounded-lg py-1.5 text-blue-600 hover:bg-blue-100 transition"
                >
                  השתמש
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Template preview/edit drawer */}
      {selectedTemplate && (
        <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-6" dir="rtl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">
              {selectedTemplate.icon} {selectedTemplate.name}
            </h3>
            <button
              onClick={() => setSelectedTemplate(null)}
              className="text-slate-400 hover:text-slate-600 text-xl leading-none"
            >
              ×
            </button>
          </div>
          <label className="text-xs text-slate-500 block mb-1">נושא</label>
          <div className="flex items-center gap-2 mb-3">
            <input
              defaultValue={selectedTemplate.subject}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <CopyBtn text={selectedTemplate.subject} />
          </div>
          <label className="text-xs text-slate-500 block mb-1">גוף המייל</label>
          <div className="flex gap-2">
            <textarea
              defaultValue={selectedTemplate.body}
              rows={6}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-vertical"
            />
            <CopyBtn text={selectedTemplate.body} />
          </div>
        </div>
      )}

      {/* AI modal */}
      {showAiModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowAiModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-6 w-[420px] max-w-[90vw]"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Sparkles size={16} className="text-blue-500" /> יצירת תבנית עם AI
              </h3>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <label className="text-xs text-slate-500 block mb-1">
              נושא התבנית
            </label>
            <input
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="לדוגמה: ברכת שנה חדשה ללקוחות..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
              autoFocus
              onKeyDown={(e) =>
                e.key === "Enter" && !aiGenerating && generateAiTemplate()
              }
            />

            <button
              onClick={generateAiTemplate}
              disabled={aiGenerating || !aiTopic.trim()}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {aiGenerating ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> מייצר...
                </>
              ) : (
                <>
                  <Sparkles size={14} /> ✨ צור תבנית
                </>
              )}
            </button>

            {aiResult && (
              <div className="mt-4 space-y-3">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-500">נושא</span>
                    <CopyBtn text={aiResult.subject} />
                  </div>
                  <p className="text-sm text-slate-800">{aiResult.subject}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-500">גוף המייל</span>
                    <CopyBtn text={aiResult.body} />
                  </div>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">
                    {aiResult.body}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `נושא: ${aiResult.subject}\n\n${aiResult.body}`
                    );
                    toast.success("תבנית הועתקה!");
                    setShowAiModal(false);
                  }}
                  className="w-full bg-green-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-green-700 transition"
                >
                  שמור תבנית
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function EmailPageClient({ clients, initialTab }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Mail size={22} className="text-blue-500" /> מיילים
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          תבניות מייל ורצפי שיווק אוטומטיים
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "templates" ? (
        <TemplatesTab />
      ) : (
        <EmailSequencesClient
          clients={clients}
          initialClientId={clients[0]?.id}
        />
      )}
    </div>
  );
}
