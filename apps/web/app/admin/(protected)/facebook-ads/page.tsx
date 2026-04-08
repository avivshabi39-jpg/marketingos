"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

type Campaign = {
  id: string;
  title: string;
  status: "active" | "pending" | "paused";
  budget: number;
  city: string;
};

const EXAMPLE_CAMPAIGNS: Campaign[] = [
  { id: "c1", title: "קנה דירה בתל אביב — ריבית נמוכה",     status: "active",  budget: 150, city: "תל אביב" },
  { id: "c2", title: "השקעה בנדל'ן — תשואה מובטחת",    status: "pending", budget: 80,  city: "רמת גן"  },
];

const AI_TITLES = [
  "הגשם את חלום הדירה שלך — פרטים כאן",
  "נדל'ן חכם, החלטה נכונה — צור קשר עכשיו",
  "מחיר למשתכן? בדוק זכאות בחינם",
  "השקעה בנדל'ן מ-₪500 ליום — פרטים",
];

const STATUS_LABELS: Record<Campaign["status"], string> = {
  active:  "פעיל",
  pending: "ממתין לאישור",
  paused:  "מושהה",
};

const STATUS_COLORS: Record<Campaign["status"], string> = {
  active:  "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  paused:  "bg-slate-100 text-slate-500",
};

export default function FacebookAdsPage() {
  const [fbConnected, setFbConnected] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>(EXAMPLE_CAMPAIGNS);

  const [adTitle, setAdTitle] = useState("");
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(65);
  const [city, setCity] = useState("");
  const [dailyBudget, setDailyBudget] = useState("");
  const [generatingAi, setGeneratingAi] = useState(false);

  function handleAiTitle() {
    setGeneratingAi(true);
    setTimeout(() => {
      const random = AI_TITLES[Math.floor(Math.random() * AI_TITLES.length)];
      setAdTitle(random);
      setGeneratingAi(false);
    }, 900);
  }

  function handleCreateCampaign() {
    if (!adTitle.trim()) {
      toast.error("הכנס כותרת מודעה");
      return;
    }
    const newCampaign: Campaign = {
      id:     `c${Date.now()}`,
      title:  adTitle,
      status: "pending",
      budget: Number(dailyBudget) || 50,
      city:   city || "כל הארץ",
    };
    setCampaigns((prev) => [newCampaign, ...prev]);
    setAdTitle("");
    setCity("");
    setDailyBudget("");
    toast.success("הקמפיין נוצר! ממתין לאישור Facebook");
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Share2 size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Facebook Ads</h1>
            <p className="text-sm text-slate-500">ניהול מודעות וקמפיינים בפייסבוק</p>
          </div>
        </div>
        <button
          onClick={() => setFbConnected(true)}
          className={cn(
            "text-sm font-medium px-4 py-2 rounded-lg transition-colors",
            fbConnected
              ? "bg-green-100 text-green-700 cursor-default"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          )}
        >
          {fbConnected ? "מחובר ✅" : "חבר עמוד Facebook"}
        </button>
      </div>

      {/* Campaign creator */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">יצירת קמפיין חדש</h2>

        {/* Ad title + AI */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">כותרת מודעה</label>
          <div className="flex gap-2">
            <input
              value={adTitle}
              onChange={(e) => setAdTitle(e.target.value)}
              placeholder="הכנס כותרת מושכת..."
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={handleAiTitle}
              disabled={generatingAi}
              className="flex-shrink-0 flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              {generatingAi ? "מייצר..." : "✨ AI כתוב כותרת"}
            </button>
          </div>
        </div>

        {/* Image placeholder */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">תמונה</label>
          <select className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
            <option value="">-- בחר תמונה --</option>
            <option value="1">תמונה 1 — נוף עירוני</option>
            <option value="2">תמונה 2 — דירה מודרנית</option>
            <option value="3">תמונה 3 — משפחה מאושרת</option>
          </select>
          <div className="mt-2 w-full h-24 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
            <span className="text-xs text-slate-400">תצוגה מקדימה של תמונה</span>
          </div>
        </div>

        {/* Age range */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">גיל מינימלי</label>
            <input
              type="number"
              min={13}
              max={65}
              value={minAge}
              onChange={(e) => setMinAge(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              dir="ltr"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">גיל מקסימלי</label>
            <input
              type="number"
              min={13}
              max={100}
              value={maxAge}
              onChange={(e) => setMaxAge(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              dir="ltr"
            />
          </div>
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">עיר יעד</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="תל אביב, רמת גן, כל הארץ..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Daily budget */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">תקציב יומי (₪)</label>
          <input
            type="number"
            min={5}
            value={dailyBudget}
            onChange={(e) => setDailyBudget(e.target.value)}
            placeholder="100"
            className="w-48 rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            dir="ltr"
          />
        </div>

        <button
          onClick={handleCreateCampaign}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
        >
          צור קמפיין
        </button>
      </div>

      {/* Campaigns list */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">קמפיינים</h2>
        {campaigns.map((c) => (
          <div
            key={c.id}
            className="bg-white border border-slate-100 rounded-xl shadow-sm px-5 py-4 flex items-center gap-4"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{c.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">עיר: {c.city} · תקציב: ₪{c.budget}/יום</p>
            </div>
            <span
              className={cn(
                "text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0",
                STATUS_COLORS[c.status]
              )}
            >
              {STATUS_LABELS[c.status]}
            </span>
          </div>
        ))}
      </div>

      {/* Note */}
      <p className="text-xs text-slate-400 text-center">
        חיבור ל-Facebook Graph API בקרוב
      </p>
    </div>
  );
}
