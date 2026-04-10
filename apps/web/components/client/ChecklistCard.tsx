"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ChecklistItem {
  id: string;
  icon: string;
  label: string;
  description: string;
  done: boolean;
  actionLabel: string;
  href: string;
}

interface ChecklistCardProps {
  pagePublished: boolean;
  hasWhatsapp: boolean;
  hasLeads: boolean;
  hasReports: boolean;
  slug: string;
  clientId: string;
}

export function ChecklistCard({
  pagePublished,
  hasWhatsapp,
  hasLeads,
  hasReports,
  slug,
  clientId,
}: ChecklistCardProps) {
  const items: ChecklistItem[] = [
    {
      id: "page",
      icon: "🌐",
      label: "בנה דף נחיתה",
      description: "הדף שלך יהיה חי באינטרנט ויתחיל לקבל לידים",
      done: pagePublished,
      actionLabel: "בנה עכשיו →",
      href: `/client/${slug}/build-page`,
    },
    {
      id: "whatsapp",
      icon: "📱",
      label: "חבר וואצאפ",
      description: "קבל התראה מיידית על כל ליד חדש",
      done: hasWhatsapp,
      actionLabel: "חבר →",
      href: `/client/${slug}/settings`,
    },
    {
      id: "share",
      icon: "🔗",
      label: "שתף את הקישור",
      description: "שלח את הדף ללקוחות ולרשתות החברתיות",
      done: pagePublished && hasLeads, // If page exists and leads came = link was shared
      actionLabel: "שתף →",
      href: `/client/${slug}/settings`,
    },
    {
      id: "lead",
      icon: "🎯",
      label: "קבל ליד ראשון",
      description: "כשמישהו ישאיר פרטים — תקבל התראה",
      done: hasLeads,
      actionLabel: "צפה בלידים →",
      href: `/client/${slug}/leads`,
    },
    {
      id: "report",
      icon: "📊",
      label: "צפה בדוח ביצועים",
      description: "הבן מה עובד ומה צריך לשפר",
      done: hasReports,
      actionLabel: "צפה →",
      href: `/client/${slug}/reports`,
    },
  ];

  const completed = items.filter((i) => i.done).length;
  const allDone = completed === items.length;
  const [collapsed, setCollapsed] = useState(allDone);

  // Find the first uncompleted item — this is the "current step"
  const currentStepId = items.find((i) => !i.done)?.id ?? null;

  // Don't render at all once everything is done and collapsed
  if (allDone && collapsed) {
    return (
      <div
        className="bg-green-50 border border-green-200 rounded-2xl px-6 py-4 flex items-center justify-between cursor-pointer"
        onClick={() => setCollapsed(false)}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-semibold text-green-800">כל המשימות הושלמו!</p>
            <p className="text-xs text-green-600">{completed}/{items.length} הושלם</p>
          </div>
        </div>
        <ChevronDown size={16} className="text-green-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-slate-100 cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div>
          <h2 className="font-semibold text-slate-900">🚀 התחל כאן — {items.length - completed} צעדים נשארו</h2>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-2 bg-slate-100 rounded-full w-40 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${(completed / items.length) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-slate-500">{completed}/{items.length}</span>
          </div>
        </div>
        {collapsed ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronUp size={16} className="text-slate-400" />}
      </div>

      {!collapsed && (
        <div className="divide-y divide-slate-50">
          {items.map((item) => {
            const isCurrent = item.id === currentStepId;
            return (
              <div
                key={item.id}
                className={`flex items-center gap-4 px-6 py-4 transition-colors ${
                  item.done
                    ? "bg-green-50/30"
                    : isCurrent
                    ? "bg-blue-50/50 border-r-4 border-r-blue-500"
                    : ""
                }`}
              >
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${
                    item.done ? "text-slate-400 line-through" : isCurrent ? "text-blue-800" : "text-slate-700"
                  }`}>
                    {item.label}
                  </p>
                  <p className={`text-xs mt-0.5 ${isCurrent ? "text-blue-600" : "text-slate-400"}`}>
                    {item.description}
                  </p>
                </div>
                {item.done ? (
                  <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />
                ) : (
                  <Link
                    href={item.href}
                    className={`flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors ${
                      isCurrent
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {item.actionLabel}
                    {isCurrent && <ArrowLeft size={12} />}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
