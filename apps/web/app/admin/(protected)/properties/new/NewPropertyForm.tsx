"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type ClientOption = {
  id: string;
  name: string;
};

type Props = {
  clients: ClientOption[];
};

export function NewPropertyForm({ clients }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          price: Number(data.price),
          rooms: data.rooms ? Number(data.rooms) : undefined,
          area: data.area ? Number(data.area) : undefined,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error?.message ?? "שגיאה ביצירת הנכס");
        return;
      }

      router.push("/admin/properties");
    } catch {
      setError("שגיאת חיבור");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">נכס חדש</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              כותרת הנכס *
            </label>
            <input
              name="title"
              required
              placeholder="דירה 4 חדרים בתל אביב"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              מחיר (₪) *
            </label>
            <input
              name="price"
              type="number"
              required
              min="0"
              placeholder="2000000"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              סוג נכס *
            </label>
            <select
              name="propertyType"
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="APARTMENT">דירה</option>
              <option value="HOUSE">בית פרטי</option>
              <option value="PENTHOUSE">פנטהאוז</option>
              <option value="GARDEN_APARTMENT">דירת גן</option>
              <option value="DUPLEX">דופלקס</option>
              <option value="STUDIO">סטודיו</option>
              <option value="COMMERCIAL">מסחרי</option>
              <option value="LAND">קרקע</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              עיר *
            </label>
            <input
              name="city"
              required
              placeholder="תל אביב"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              שכונה
            </label>
            <input
              name="neighborhood"
              placeholder="פלורנטין"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              חדרים
            </label>
            <input
              name="rooms"
              type="number"
              step="0.5"
              min="0"
              placeholder="4"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              שטח (מ"ר)
            </label>
            <input
              name="area"
              type="number"
              min="0"
              placeholder="90"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              סטטוס
            </label>
            <select
              name="status"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="AVAILABLE">זמין</option>
              <option value="UNDER_CONTRACT">בתהליך</option>
              <option value="SOLD">נמכר</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              לקוח *
            </label>
            <select
              name="clientId"
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">בחר לקוח...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              תיאור
            </label>
            <textarea
              name="description"
              rows={4}
              placeholder="תיאור הנכס..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? "מפרסם..." : "פרסם נכס"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-slate-200 text-slate-600 text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            ביטול
          </button>
        </div>
      </form>
    </div>
  );
}
