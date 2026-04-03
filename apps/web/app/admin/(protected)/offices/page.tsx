"use client";

import { useState, useEffect } from "react";
import { Building2, Plus, Users, TrendingUp, Home, ChevronRight } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Office {
  id: string;
  name: string;
  monthlyLeads: number;
  agents: { id: string; name: string; _count: { leads: number; properties: number } }[];
}

export default function OfficesPage() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch("/api/offices")
      .then((r) => r.json())
      .then((d) => setOffices(d.offices ?? []))
      .catch(() => toast.error("שגיאה בטעינת משרדים"))
      .finally(() => setLoading(false));
  }, []);

  const createOffice = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/offices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) throw new Error();
      const { office } = await res.json();
      setOffices((prev) => [{ ...office, agents: [], monthlyLeads: 0 }, ...prev]);
      setNewName("");
      setShowForm(false);
      toast.success("המשרד נוצר");
    } catch {
      toast.error("שגיאה ביצירת משרד");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse" dir="rtl">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 bg-white rounded-xl border border-gray-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 size={22} className="text-indigo-500" /> משרדים
          </h1>
          <p className="text-sm text-gray-500 mt-1">ניהול משרדי נדל"ן וסוכנים</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700"
        >
          <Plus size={16} /> צור משרד
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-indigo-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">משרד חדש</h3>
          <div className="flex gap-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createOffice()}
              placeholder="שם המשרד"
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300"
              autoFocus
            />
            <button
              onClick={createOffice}
              disabled={creating || !newName.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50"
            >
              {creating ? "יוצר..." : "צור"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {offices.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center py-20">
          <Building2 size={40} className="text-gray-200 mb-4" />
          <p className="text-gray-500 font-medium">אין משרדים עדיין</p>
          <p className="text-sm text-gray-400 mt-1">לחץ על "צור משרד" להתחיל</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {offices.map((o) => {
            const totalProperties = o.agents.reduce((sum, a) => sum + a._count.properties, 0);
            return (
              <Link
                key={o.id}
                href={`/admin/offices/${o.id}`}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-indigo-200 transition-all group"
              >
                {/* Logo + name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-lg flex items-center justify-center flex-shrink-0">
                    {o.name.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{o.name}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400 flex-shrink-0" />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 rounded-lg py-2">
                    <Users size={14} className="text-gray-400 mx-auto mb-1" />
                    <p className="text-sm font-bold text-gray-900">{o.agents.length}</p>
                    <p className="text-[10px] text-gray-400">סוכנים</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg py-2">
                    <TrendingUp size={14} className="text-green-400 mx-auto mb-1" />
                    <p className="text-sm font-bold text-gray-900">{o.monthlyLeads}</p>
                    <p className="text-[10px] text-gray-400">לידים/חודש</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg py-2">
                    <Home size={14} className="text-blue-400 mx-auto mb-1" />
                    <p className="text-sm font-bold text-gray-900">{totalProperties}</p>
                    <p className="text-[10px] text-gray-400">נכסים</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
