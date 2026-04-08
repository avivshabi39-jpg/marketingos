"use client";

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

type Client = { id: string; name: string };

const FORM_TYPES = [
  { value: "CLIENT_ONBOARDING", label: "טופס קבלת לקוח" },
  { value: "LANDING_PAGE",      label: "טופס אפיון לאתר" },
];

export function IntakeCreateButton({ clients, onCreated }: { clients: Client[]; onCreated?: () => void }) {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName]       = useState("");
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [formType, setFormType] = useState("CLIENT_ONBOARDING");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !clientId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/intake-forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, clientId, formType }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "שגיאה ביצירת הטופס");
        return;
      }
      toast.success("הטופס נוצר בהצלחה!");
      setOpen(false);
      setName("");
      onCreated?.();
    } catch {
      toast.error("שגיאת חיבור");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition"
      >
        <Plus size={16} />
        צור טופס חדש
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setOpen(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setOpen(false)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>

            <h3 className="font-bold text-slate-900 text-lg mb-5">צור טופס חדש</h3>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">שם הטופס *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="לדוגמה: טופס לקוח חדש - סתיו 2024"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-300 outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">בחר לקוח *</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-300 outline-none bg-white"
                >
                  <option value="">בחר לקוח...</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">סוג טופס *</label>
                <div className="grid grid-cols-2 gap-2">
                  {FORM_TYPES.map((ft) => (
                    <button
                      key={ft.value}
                      type="button"
                      onClick={() => setFormType(ft.value)}
                      className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        formType === ft.value
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {ft.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !name.trim() || !clientId}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition mt-2"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> יוצר...</> : "צור טופס"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
