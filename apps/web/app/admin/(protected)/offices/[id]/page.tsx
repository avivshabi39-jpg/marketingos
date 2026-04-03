"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Building2, Users, TrendingUp, Home, Phone, Trash2,
  Plus, ArrowRight, MessageCircle, Star,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface AgentStats {
  id: string;
  name: string;
  slug: string;
  agentPhoto: string | null;
  agentCity: string | null;
  agentPhone: string | null;
  monthlyLeads: number;
  wonLeads: number;
  conversionRate: number;
  lastActiveDays: number;
  _count: { leads: number; properties: number };
}

interface OfficeDetail {
  id: string;
  name: string;
  agents: AgentStats[];
}

interface AvailableAgent { id: string; name: string; industry: string | null; }

export default function OfficeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [office, setOffice] = useState<OfficeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState<AvailableAgent[]>([]);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [adding, setAdding] = useState(false);

  const load = async () => {
    try {
      const res = await fetch(`/api/offices/${id}`);
      if (!res.ok) throw new Error();
      const { office: o } = await res.json();
      setOffice(o);
    } catch {
      toast.error("שגיאה בטעינת המשרד");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const loadAvailable = async () => {
    const res = await fetch("/api/clients?page=1&limit=100");
    const { clients } = await res.json();
    const agentIds = new Set(office?.agents.map((a) => a.id) ?? []);
    setAvailable(
      (clients ?? []).filter(
        (c: AvailableAgent & { industry: string | null }) =>
          !agentIds.has(c.id) && c.industry === "REAL_ESTATE"
      )
    );
  };

  const openAddAgent = () => {
    loadAvailable();
    setShowAddAgent(true);
  };

  const addAgent = async () => {
    if (!selectedAgentId) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/offices/${id}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: selectedAgentId }),
      });
      if (!res.ok) throw new Error();
      toast.success("הסוכן נוסף");
      setShowAddAgent(false);
      setSelectedAgentId("");
      load();
    } catch {
      toast.error("שגיאה בהוספת סוכן");
    } finally {
      setAdding(false);
    }
  };

  const removeAgent = async (agentId: string, agentName: string) => {
    if (!confirm(`האם להסיר את ${agentName} מהמשרד?`)) return;
    try {
      await fetch(`/api/offices/${id}/agents/${agentId}`, { method: "DELETE" });
      setOffice((o) =>
        o ? { ...o, agents: o.agents.filter((a) => a.id !== agentId) } : o
      );
      toast.success("הסוכן הוסר מהמשרד");
    } catch {
      toast.error("שגיאה בהסרת סוכן");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse" dir="rtl">
        <div className="h-8 w-56 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white rounded-xl border border-gray-200" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-white rounded-xl border border-gray-200" />)}
        </div>
      </div>
    );
  }

  if (!office) return null;

  const topAgent = [...office.agents].sort((a, b) => b.monthlyLeads - a.monthlyLeads)[0];
  const totalMonthlyLeads = office.agents.reduce((s, a) => s + a.monthlyLeads, 0);
  const totalProperties = office.agents.reduce((s, a) => s + a._count.properties, 0);
  const maxLeads = Math.max(1, ...office.agents.map((a) => a.monthlyLeads));

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/offices" className="text-gray-400 hover:text-gray-700">
            <ArrowRight size={18} />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-base flex items-center justify-center">
            {office.name.slice(0, 2)}
          </div>
          <h1 className="text-xl font-bold text-gray-900">{office.name}</h1>
        </div>
        <button
          onClick={openAddAgent}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700"
        >
          <Plus size={16} /> הוסף סוכן
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "סוכנים", value: office.agents.length, color: "text-indigo-500" },
          { icon: TrendingUp, label: "לידים החודש", value: totalMonthlyLeads, color: "text-green-500" },
          { icon: Home, label: "נכסים", value: totalProperties, color: "text-blue-500" },
          { icon: Star, label: "סוכן מוביל", value: topAgent?.name.split(" ")[0] ?? "—", color: "text-amber-500" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <Icon size={20} className={color} />
            <div>
              <p className="text-lg font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add agent modal */}
      {showAddAgent && (
        <div className="bg-white rounded-xl border border-indigo-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-3">הוסף סוכן למשרד</h3>
          <div className="flex gap-3">
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="">בחר סוכן...</option>
              {available.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <button
              onClick={addAgent}
              disabled={adding || !selectedAgentId}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50"
            >
              {adding ? "מוסיף..." : "הוסף"}
            </button>
            <button
              onClick={() => setShowAddAgent(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              ביטול
            </button>
          </div>
          {available.length === 0 && (
            <p className="text-xs text-gray-400 mt-2">אין סוכני נדל"ן זמינים להוספה</p>
          )}
        </div>
      )}

      {/* Performance chart — CSS bars */}
      {office.agents.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">ביצועים — לידים החודש</h3>
          <div className="space-y-2.5">
            {[...office.agents]
              .sort((a, b) => b.monthlyLeads - a.monthlyLeads)
              .map((agent) => {
                const pct = Math.round((agent.monthlyLeads / maxLeads) * 100);
                const isTop = agent.id === topAgent?.id;
                return (
                  <div key={agent.id} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-24 text-right truncate">{agent.name.split(" ")[0]}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isTop ? "bg-indigo-500" : "bg-gray-300"}`}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold w-8 ${isTop ? "text-indigo-600" : "text-gray-500"}`}>
                      {agent.monthlyLeads}
                    </span>
                    {isTop && <Star size={12} className="text-amber-400 flex-shrink-0" />}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Agents grid */}
      {office.agents.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center py-16">
          <Users size={36} className="text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">אין סוכנים במשרד</p>
          <p className="text-sm text-gray-400 mt-1">לחץ "הוסף סוכן" להוסיף סוכן</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {office.agents.map((agent) => (
            <div key={agent.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                    {agent.name.slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{agent.name}</p>
                    {agent.agentCity && (
                      <p className="text-xs text-gray-400">{agent.agentCity}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeAgent(agent.id, agent.name)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"
                  title="הסר מהמשרד"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
                <div>
                  <p className="font-bold text-gray-900">{agent._count.properties}</p>
                  <p className="text-gray-400">נכסים</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900">{agent.monthlyLeads}</p>
                  <p className="text-gray-400">לידים/חודש</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900">{agent.conversionRate}%</p>
                  <p className="text-gray-400">המרה</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-50 pt-3">
                <span>פעיל לפני {agent.lastActiveDays} ימים</span>
                <div className="flex gap-2">
                  {agent.agentPhone && (
                    <a
                      href={`https://wa.me/972${agent.agentPhone.replace(/^0/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-xs"
                    >
                      <MessageCircle size={11} /> WhatsApp
                    </a>
                  )}
                  <Link
                    href={`/admin/clients/${agent.id}`}
                    className="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 text-xs"
                  >
                    <Phone size={11} /> פרטים
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
