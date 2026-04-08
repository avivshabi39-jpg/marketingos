"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Campaign = {
  id: string;
  name: string;
  status: "active" | "paused";
  budget: number;
  clicks: number;
  leads: number;
  cost_per_lead: number;
  enabled: boolean;
};

const INITIAL_CAMPAIGNS: Campaign[] = [
  { id: "1", name: "קמפיין חיפוש — דירות למכירה", status: "active",  budget: 500,  clicks: 1240, leads: 38, cost_per_lead: 52, enabled: true  },
  { id: "2", name: "קמפיין רימרקטינג — ביקרו באתר", status: "paused", budget: 200,  clicks: 460,  leads: 12, cost_per_lead: 83, enabled: false },
  { id: "3", name: "קמפיין מותג — MarketingOS",   status: "active",  budget: 100,  clicks: 890,  leads: 25, cost_per_lead: 20, enabled: true  },
];

export default function GoogleAdsPage() {
  const [connected, setConnected] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [totalSpend, setTotalSpend] = useState("");
  const [numLeads, setNumLeads] = useState("");

  const costPerLead =
    totalSpend && numLeads && Number(numLeads) > 0
      ? (Number(totalSpend) / Number(numLeads)).toFixed(2)
      : null;

  function toggleCampaign(id: string) {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <TrendingUp size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Google Ads</h1>
            <p className="text-sm text-slate-500">ניהול קמפיינים וניתוח ביצועים</p>
          </div>
        </div>
        <button
          onClick={() => setConnected(true)}
          className={cn(
            "text-sm font-medium px-4 py-2 rounded-lg transition-colors",
            connected
              ? "bg-green-100 text-green-700 cursor-default"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          )}
        >
          {connected ? "מחובר ✅" : "חבר חשבון Google Ads"}
        </button>
      </div>

      {/* Campaigns list */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
          <h2 className="text-sm font-semibold text-slate-700">קמפיינים</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {campaigns.map((c) => (
            <div key={c.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-900 truncate">{c.name}</span>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0",
                      c.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    )}
                  >
                    {c.status === "active" ? "פעיל" : "מושהה"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                  <span>תקציב: ₪{c.budget}/יום</span>
                  <span>קליקים: {c.clicks.toLocaleString()}</span>
                  <span>לידים: {c.leads}</span>
                  <span>עלות/ליד: ₪{c.cost_per_lead}</span>
                </div>
              </div>
              {/* Toggle */}
              <button
                onClick={() => toggleCampaign(c.id)}
                className={cn(
                  "relative inline-flex w-10 h-5 rounded-full transition-colors focus:outline-none flex-shrink-0",
                  c.enabled ? "bg-blue-500" : "bg-slate-200"
                )}
                title={c.enabled ? "השהה" : "הפעל"}
              >
                <span
                  className={cn(
                    "inline-block w-4 h-4 bg-white rounded-full shadow transform transition-transform mt-0.5",
                    c.enabled ? "translate-x-1" : "translate-x-5"
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Cost per lead calculator */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">מחשבון עלות ליד</h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">סה&quot;כ הוצאה (₪)</label>
            <input
              dir="ltr"
              type="number"
              min={0}
              value={totalSpend}
              onChange={(e) => setTotalSpend(e.target.value)}
              placeholder="1500"
              className="w-36 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">מספר לידים</label>
            <input
              dir="ltr"
              type="number"
              min={0}
              value={numLeads}
              onChange={(e) => setNumLeads(e.target.value)}
              placeholder="30"
              className="w-36 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          {costPerLead !== null && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <p className="text-xs text-blue-600 font-medium">עלות ליד</p>
              <p className="text-lg font-bold text-blue-700">₪{costPerLead}</p>
            </div>
          )}
        </div>
      </div>

      {/* Note */}
      <p className="text-xs text-slate-400 text-center">
        הנתונים יועדכנו אוטומטית לאחר חיבור API
      </p>
    </div>
  );
}
