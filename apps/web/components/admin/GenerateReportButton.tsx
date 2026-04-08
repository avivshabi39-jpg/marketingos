"use client";

import { useState } from "react";
import { Plus, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";

type Client = { id: string; name: string };

// כפתור יצירת דוח — תומך ב-clientId קבוע (דף לקוח) או בחירת לקוח (דף דוחות)
export function GenerateReportButton({
  clients,
  fixedClientId,
}: {
  clients: Client[];
  fixedClientId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState(fixedClientId ?? clients[0]?.id ?? "");
  const [type, setType] = useState<"WEEKLY" | "MONTHLY">("WEEKLY");

  async function handleGenerate() {
    if (!clientId) {
      toast.error("בחר לקוח");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, period: type }),
      });
      if (res.ok) {
        toast.success("הדוח נוצר בהצלחה!");
        setOpen(false);
        // רענן דף לאחר 800ms כדי לתת זמן לטוסט
        setTimeout(() => window.location.reload(), 800);
      } else {
        const data = await res.json();
        toast.error(data.error ?? "שגיאה ביצירת הדוח");
      }
    } catch {
      toast.error("שגיאת חיבור לשרת");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        <Plus size={16} />
        צור דוח
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-900">צור דוח חדש</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* בחירת לקוח — רק אם לא קבוע */}
              {!fixedClientId && clients.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">לקוח</label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">— בחר לקוח —</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">סוג דוח</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["WEEKLY", "MONTHLY"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${
                        type === t
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      {t === "WEEKLY" ? "שבועי" : "חודשי"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleGenerate}
                disabled={loading || !clientId}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {loading ? "מייצר..." : "צור דוח"}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex-1 border border-slate-200 text-slate-600 text-sm font-medium py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
