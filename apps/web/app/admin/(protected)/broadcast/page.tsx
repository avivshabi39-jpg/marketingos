"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageCircle, Send, Users, CheckCircle2, XCircle,
  ChevronRight, Loader2, Clock, AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

interface Client {
  id: string;
  name: string;
  greenApiInstanceId: string | null;
}

interface BroadcastLog {
  id: string;
  message: string;
  totalCount: number;
  sentCount: number;
  failCount: number;
  status: string;
  createdAt: string;
  client: { id: string; name: string };
}

type Step = 1 | 2 | 3;

const FILTER_OPTS = [
  { value: "all", label: "כל הלידים" },
  { value: "new", label: "לידים חדשים" },
  { value: "won", label: "עסקאות שנסגרו" },
  { value: "lost", label: "עסקאות שאבדו" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-600 bg-yellow-50",
  running: "text-blue-600 bg-blue-50",
  done: "text-green-600 bg-green-50",
  failed: "text-red-600 bg-red-50",
};
const STATUS_HE: Record<string, string> = {
  pending: "ממתין", running: "שולח...", done: "הושלם", failed: "נכשל",
};

export default function BroadcastPage() {
  const [step, setStep] = useState<Step>(1);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [broadcastId, setBroadcastId] = useState<string | null>(null);
  const [progress, setProgress] = useState({ sent: 0, failed: 0, total: 0 });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [logs, setLogs] = useState<BroadcastLog[]>([]);
  const [creating, setCreating] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    fetch("/api/clients?page=1&limit=100")
      .then((r) => r.json())
      .then((d) => setClients((d.clients ?? []).filter((c: Client) => c.greenApiInstanceId)));
    fetchLogs();
  }, []);

  const fetchLogs = () => {
    fetch("/api/broadcast")
      .then((r) => r.json())
      .then((d) => setLogs(d.logs ?? []));
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const handleCreate = async () => {
    if (!selectedClientId || !message.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: selectedClientId, message, filter }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "שגיאה");
        return;
      }
      setBroadcastId(data.broadcastId);
      setTotalCount(data.totalCount);
      setStep(3);
    } catch {
      toast.error("שגיאת חיבור");
    } finally {
      setCreating(false);
    }
  };

  const handleSend = () => {
    if (!broadcastId) return;
    setSending(true);
    setProgress({ sent: 0, failed: 0, total: totalCount ?? 0 });

    const es = new EventSource(`/api/broadcast/${broadcastId}/send`);
    esRef.current = es;

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "start") {
        setProgress({ sent: 0, failed: 0, total: data.total });
      } else if (data.type === "progress") {
        setProgress({ sent: data.sent, failed: data.failed, total: totalCount ?? data.sent + data.failed });
      } else if (data.type === "done") {
        setProgress((p) => ({ ...p, sent: data.sent, failed: data.failed }));
        setSending(false);
        setDone(true);
        es.close();
        fetchLogs();
      }
    };

    es.onerror = () => {
      setSending(false);
      toast.error("שגיאה בשליחה");
      es.close();
    };
  };

  const pct = progress.total > 0 ? Math.round((progress.sent / progress.total) * 100) : 0;

  return (
    <div className="space-y-6 max-w-2xl" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageCircle size={22} className="text-green-500" />
          שידור WhatsApp
        </h1>
        <p className="text-sm text-gray-500 mt-1">שלח הודעה המונית ללידים שלך</p>
      </div>

      {/* Explanation banner */}
      <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
        <AlertCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold mb-0.5">כיצד עובד השידור?</p>
          <p className="text-xs text-green-700 leading-relaxed">
            שלב 1 — בחר לקוח וקהל יעד (ניתן לסנן לפי סטטוס ליד).
            שלב 2 — כתוב את ההודעה שתשלח.
            שלב 3 — אשר ושלח. ההודעות נשלחות בקצב של אחת בשנייה למניעת חסימת WhatsApp.
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {([1, 2, 3] as Step[]).map((s, idx) => {
          const labels = ["", "שלב 1: קהל יעד", "שלב 2: הודעה", "שלב 3: שליחה"];
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                ${step >= s ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-400"}`}>
                {s}
              </div>
              <span className={step >= s ? "text-gray-700 font-medium" : "text-gray-400"}>
                {labels[s]}
              </span>
              {idx < 2 && <ChevronRight size={14} className="text-gray-300" />}
            </div>
          );
        })}
      </div>

      {/* Step 1: Select audience */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-gray-800">בחר קהל יעד</h2>

          {clients.length === 0 ? (
            <div className="flex items-center gap-3 p-4 bg-amber-50 text-amber-700 rounded-xl text-sm">
              <AlertCircle size={16} />
              <span>אין לקוחות עם Green API מוגדר. הגדר את Green API בהגדרות הלקוח.</span>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">לקוח</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="">בחר לקוח...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">סגמנט לידים</label>
                <div className="grid grid-cols-2 gap-2">
                  {FILTER_OPTS.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFilter(f.value)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all text-right
                        ${filter === f.value
                          ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <button
            disabled={!selectedClientId}
            onClick={() => setStep(2)}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-50 hover:bg-indigo-700"
          >
            המשך
          </button>
        </div>
      )}

      {/* Step 2: Message */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">כתוב את ההודעה</h2>
            {selectedClient && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{selectedClient.name}</span>
            )}
          </div>

          <div>
            <textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="שלום {name}, אנחנו רוצים לעדכן אותך..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{message.length} / 4096 תווים</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50"
            >
              חזור
            </button>
            <button
              disabled={!message.trim() || creating}
              onClick={handleCreate}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-50 hover:bg-indigo-700 flex items-center justify-center gap-2"
            >
              {creating && <Loader2 size={14} className="animate-spin" />}
              {creating ? "מכין..." : "המשך לשליחה"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Send */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-gray-800">שלח שידור</h2>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">לקוח</span>
              <span className="font-medium">{selectedClient?.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">סגמנט</span>
              <span className="font-medium">{FILTER_OPTS.find((f) => f.value === filter)?.label}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 flex items-center gap-1"><Users size={13} /> נמענים</span>
              <span className="font-bold text-indigo-600">{totalCount}</span>
            </div>
            <div className="border-t border-gray-100 pt-2">
              <p className="text-xs text-gray-500 mb-1">תוכן ההודעה:</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{message}</p>
            </div>
          </div>

          {/* Progress */}
          {(sending || done) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm font-medium">
                <span className="text-gray-700">
                  {done ? "הושלם!" : `שולח... ${progress.sent} / ${progress.total}`}
                </span>
                <span className="text-indigo-600">{pct}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-indigo-500 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 size={12} /> {progress.sent} נשלחו
                </span>
                {progress.failed > 0 && (
                  <span className="flex items-center gap-1 text-red-500">
                    <XCircle size={12} /> {progress.failed} נכשלו
                  </span>
                )}
              </div>
            </div>
          )}

          {!sending && !done && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-lg text-xs">
              <Clock size={13} />
              <span>השליחה מוגבלת להודעה אחת לשנייה למניעת בלוקים</span>
            </div>
          )}

          {done ? (
            <button
              onClick={() => { setStep(1); setMessage(""); setFilter("all"); setSelectedClientId(""); setBroadcastId(null); setDone(false); setTotalCount(null); }}
              className="w-full py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700"
            >
              שידור חדש
            </button>
          ) : (
            <button
              disabled={sending}
              onClick={handleSend}
              className="w-full py-2.5 bg-green-600 text-white rounded-xl font-medium disabled:opacity-60 hover:bg-green-700 flex items-center justify-center gap-2"
            >
              {sending ? <><Loader2 size={15} className="animate-spin" />שולח...</> : <><Send size={15} />שלח עכשיו</>}
            </button>
          )}
        </div>
      )}

      {/* Recent broadcasts */}
      {logs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">שידורים אחרונים</h3>
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{log.client.name}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{log.message.slice(0, 60)}{log.message.length > 60 ? "..." : ""}</p>
                </div>
                <div className="text-left flex-shrink-0 space-y-0.5">
                  <div className="flex items-center gap-1.5 justify-end">
                    <CheckCircle2 size={11} className="text-green-500" />
                    <span className="text-xs font-medium">{log.sentCount}/{log.totalCount}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[log.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {STATUS_HE[log.status] ?? log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
