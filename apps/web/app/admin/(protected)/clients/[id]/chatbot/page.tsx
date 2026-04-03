"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Settings,
  HelpCircle,
  Clock,
  GitBranch,
  TestTube,
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  Sparkles,
  Send,
  Loader2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FAQItem {
  q: string;
  a: string;
}

interface ChatbotSchedule {
  start: string;
  end: string;
  alwaysOn: boolean;
  days: number[];
}

interface ChatbotSettings {
  chatbotEnabled: boolean;
  chatbotGreeting: string;
  chatbotFAQ: FAQItem[];
  chatbotSchedule: ChatbotSchedule;
  chatbotAutoReply: boolean;
}

interface ChatMessage {
  role: "user" | "bot";
  text: string;
}

// ─── Helper components ────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? "bg-indigo-500" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
  );
}

// ─── Tabs config ─────────────────────────────────────────────────────────────

const TABS = [
  { key: "settings", label: "הגדרות", icon: Settings },
  { key: "faq", label: "שאלות ותשובות", icon: HelpCircle },
  { key: "schedule", label: "לוח זמנים", icon: Clock },
  { key: "script", label: "תסריט שיחה", icon: GitBranch },
  { key: "test", label: "בדיקה", icon: TestTube },
];

const DAYS_HE = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ChatbotPage() {
  const { id } = useParams<{ id: string }>();

  const [activeTab, setActiveTab] = useState("settings");
  const [settings, setSettings] = useState<ChatbotSettings>({
    chatbotEnabled: false,
    chatbotGreeting: "שלום! איך אוכל לעזור?",
    chatbotFAQ: [],
    chatbotSchedule: {
      start: "09:00",
      end: "22:00",
      alwaysOn: false,
      days: [0, 1, 2, 3, 4, 5],
    },
    chatbotAutoReply: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Test tab state
  const [testMessages, setTestMessages] = useState<ChatMessage[]>([]);
  const [testInput, setTestInput] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch settings on mount
  useEffect(() => {
    fetch(`/api/clients/${id}/chatbot`)
      .then((r) => r.json())
      .then((data) => {
        setSettings({
          chatbotEnabled: data.chatbotEnabled ?? false,
          chatbotGreeting: data.chatbotGreeting ?? "שלום! איך אוכל לעזור?",
          chatbotFAQ: data.chatbotFAQ ?? [],
          chatbotSchedule: data.chatbotSchedule ?? {
            start: "09:00",
            end: "22:00",
            alwaysOn: false,
            days: [0, 1, 2, 3, 4, 5],
          },
          chatbotAutoReply: data.chatbotAutoReply ?? true,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [testMessages]);

  const save = async () => {
    setSaving(true);
    setSavedMsg("");
    try {
      const res = await fetch(`/api/clients/${id}/chatbot`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSavedMsg("נשמר בהצלחה!");
        setTimeout(() => setSavedMsg(""), 3000);
      } else {
        setSavedMsg("שגיאה בשמירה");
      }
    } catch {
      setSavedMsg("שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  };

  const updateFAQ = (index: number, field: "q" | "a", value: string) => {
    const next = [...settings.chatbotFAQ];
    next[index] = { ...next[index], [field]: value };
    setSettings((s) => ({ ...s, chatbotFAQ: next }));
  };

  const addFAQ = () => {
    setSettings((s) => ({
      ...s,
      chatbotFAQ: [...s.chatbotFAQ, { q: "", a: "" }],
    }));
  };

  const deleteFAQ = (index: number) => {
    setSettings((s) => ({
      ...s,
      chatbotFAQ: s.chatbotFAQ.filter((_, i) => i !== index),
    }));
  };

  const moveFAQ = (index: number, direction: "up" | "down") => {
    const next = [...settings.chatbotFAQ];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSettings((s) => ({ ...s, chatbotFAQ: next }));
  };

  const generateAiFAQ = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/chatbot-faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: id }),
      });
      const data = await res.json();
      if (data.faq && Array.isArray(data.faq)) {
        setSettings((s) => ({
          ...s,
          chatbotFAQ: [...s.chatbotFAQ, ...data.faq],
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const toggleDay = (day: number) => {
    const days = settings.chatbotSchedule.days ?? [];
    const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day];
    setSettings((s) => ({
      ...s,
      chatbotSchedule: { ...s.chatbotSchedule, days: next },
    }));
  };

  const sendTestMessage = async () => {
    if (!testInput.trim()) return;
    const msg = testInput.trim();
    setTestInput("");
    setTestMessages((prev) => [...prev, { role: "user", text: msg }]);
    setTestLoading(true);
    try {
      const res = await fetch("/api/chatbot/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientSlug: id, message: msg, sessionId: "test" }),
      });
      const data = await res.json();
      setTestMessages((prev) => [
        ...prev,
        { role: "bot", text: data.reply ?? "שגיאה בתשובה" },
      ]);
    } catch {
      setTestMessages((prev) => [
        ...prev,
        { role: "bot", text: "שגיאה בחיבור לשרת" },
      ]);
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48" dir="rtl">
        <Loader2 size={28} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">הגדרות צ׳אטבוט</h1>
          <p className="text-sm text-gray-500 mt-0.5">נהל את הצ׳אטבוט האוטומטי של הלקוח</p>
        </div>
        <div className="flex items-center gap-3">
          {savedMsg && (
            <span
              className={`text-sm font-medium ${
                savedMsg.includes("שגיאה") ? "text-red-500" : "text-green-600"
              }`}
            >
              {savedMsg}
            </span>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            שמור
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab 1: Settings ── */}
      {activeTab === "settings" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
          <Toggle
            checked={settings.chatbotEnabled}
            onChange={(v) => setSettings((s) => ({ ...s, chatbotEnabled: v }))}
            label="הפעל צ׳אטבוט"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              הודעת פתיחה
            </label>
            <textarea
              rows={3}
              value={settings.chatbotGreeting}
              onChange={(e) =>
                setSettings((s) => ({ ...s, chatbotGreeting: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              placeholder="שלום! איך אוכל לעזור?"
            />
          </div>
          <Toggle
            checked={settings.chatbotAutoReply}
            onChange={(v) => setSettings((s) => ({ ...s, chatbotAutoReply: v }))}
            label="תשובה אוטומטית (AI)"
          />
        </div>
      )}

      {/* ── Tab 2: FAQ ── */}
      {activeTab === "faq" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={addFAQ}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-600 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Plus size={14} />
              הוסף שאלה
            </button>
            <button
              onClick={generateAiFAQ}
              disabled={aiLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-600 text-sm font-medium rounded-lg hover:bg-purple-100 disabled:opacity-50 transition-colors"
            >
              {aiLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              AI הוסף שאלות
            </button>
          </div>

          {settings.chatbotFAQ.length === 0 && (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
              <HelpCircle size={28} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">עדיין אין שאלות. הוסף ידנית או בעזרת AI.</p>
            </div>
          )}

          {settings.chatbotFAQ.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3"
            >
              <div className="flex items-start gap-2">
                <div className="flex flex-col gap-0.5 mt-1">
                  <button
                    onClick={() => moveFAQ(i, "up")}
                    disabled={i === 0}
                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => moveFAQ(i, "down")}
                    disabled={i === settings.chatbotFAQ.length - 1}
                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={item.q}
                    onChange={(e) => updateFAQ(i, "q", e.target.value)}
                    placeholder="שאלה..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <textarea
                    rows={2}
                    value={item.a}
                    onChange={(e) => updateFAQ(i, "a", e.target.value)}
                    placeholder="תשובה..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                  />
                </div>
                <button
                  onClick={() => deleteFAQ(i)}
                  className="mt-1 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab 3: Schedule ── */}
      {activeTab === "schedule" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
          <h2 className="text-base font-semibold text-gray-800">שעות פעילות</h2>
          <Toggle
            checked={settings.chatbotSchedule.alwaysOn}
            onChange={(v) =>
              setSettings((s) => ({
                ...s,
                chatbotSchedule: { ...s.chatbotSchedule, alwaysOn: v },
              }))
            }
            label="פעיל כל הזמן (24/7)"
          />
          {!settings.chatbotSchedule.alwaysOn && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    שעת התחלה
                  </label>
                  <input
                    type="time"
                    value={settings.chatbotSchedule.start}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        chatbotSchedule: { ...s.chatbotSchedule, start: e.target.value },
                      }))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    שעת סיום
                  </label>
                  <input
                    type="time"
                    value={settings.chatbotSchedule.end}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        chatbotSchedule: { ...s.chatbotSchedule, end: e.target.value },
                      }))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">ימים פעילים</p>
                <div className="flex flex-wrap gap-2">
                  {DAYS_HE.map((day, index) => {
                    const active = (settings.chatbotSchedule.days ?? []).includes(index);
                    return (
                      <button
                        key={index}
                        onClick={() => toggleDay(index)}
                        className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                          active
                            ? "bg-indigo-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Tab 4: Script ── */}
      {activeTab === "script" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-6">תסריט שיחה</h2>
          <div className="flex flex-col items-center gap-0">
            {/* Step 1 */}
            <div className="w-64 bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-center">
              <p className="text-xs font-semibold text-indigo-500 mb-1">שלב 1 — ברכה</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {settings.chatbotGreeting || "שלום! איך אוכל לעזור?"}
              </p>
            </div>
            <div className="w-px h-8 bg-gray-300 flex-shrink-0" />
            {/* Step 2 */}
            <div className="w-64 bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-xs font-semibold text-blue-500 mb-1">שלב 2 — תפריט</p>
              <p className="text-sm text-gray-700">1. מחירים</p>
              <p className="text-sm text-gray-700">2. שעות פעילות</p>
              <p className="text-sm text-gray-700">3. שאלה חופשית</p>
            </div>
            <div className="w-px h-8 bg-gray-300 flex-shrink-0" />
            {/* Step 3 */}
            <div className="w-64 bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
              <p className="text-xs font-semibold text-purple-500 mb-1">שלב 3 — לפי בחירה</p>
              <p className="text-sm text-gray-700">תשובה מותאמת מה-FAQ</p>
              <p className="text-xs text-gray-500 mt-1">או תשובת AI אוטומטית</p>
            </div>
            <div className="w-px h-8 bg-gray-300 flex-shrink-0" />
            {/* Step 4 */}
            <div className="w-64 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-xs font-semibold text-green-500 mb-1">שלב 4 — המרה</p>
              <p className="text-sm text-gray-700">רוצה שנחזור אליך?</p>
              <p className="text-xs text-gray-500 mt-1">שמור כליד במערכת</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 5: Test ── */}
      {activeTab === "test" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">בדיקת צ׳אטבוט</h2>
            <p className="text-xs text-gray-500 mt-0.5">שלח הודעות לצ׳אטבוט ובדוק את התגובות</p>
          </div>

          {/* Messages */}
          <div className="h-80 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50">
            {testMessages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-400">שלח הודעה ראשונה לצ׳אטבוט</p>
              </div>
            )}
            {testMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-indigo-500 text-white rounded-tr-sm"
                      : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {testLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-5 py-4 border-t border-gray-100 bg-white flex gap-3">
            <input
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !testLoading && sendTestMessage()}
              placeholder="הקלד הודעה..."
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              disabled={testLoading}
            />
            <button
              onClick={sendTestMessage}
              disabled={testLoading || !testInput.trim()}
              className="p-2.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
