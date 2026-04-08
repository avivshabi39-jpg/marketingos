"use client";

import { useState } from "react";
import { Plus, Image, X } from "lucide-react";
import { useRouter } from "next/navigation";

type Client = { id: string; name: string; primaryColor: string };

export function CampaignQuickCreate({ clients }: { clients: Client[] }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(clients[0]?.id ?? "");
  const router = useRouter();

  function go() {
    if (!selected) return;
    setOpen(false);
    router.push(`/admin/clients/${selected}/campaigns`);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition"
      >
        <Plus size={16} />
        צור תמונה חדשה
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setOpen(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 transition"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Image size={18} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-base">צור תמונת קמפיין</h3>
                <p className="text-xs text-slate-500">בחר לקוח כדי להתחיל</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">לקוח</label>
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-300 outline-none"
                >
                  <option value="">בחר לקוח...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={go}
                disabled={!selected}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
              >
                <Plus size={16} />
                המשך ליצירת תמונה
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
