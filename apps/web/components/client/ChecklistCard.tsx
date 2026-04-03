"use client";

import { useState } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

interface ChecklistItem {
  id: string;
  icon: string;
  label: string;
  description: string;
  done: boolean;
  actionLabel: string;
  href?: string;
  onAction?: () => void;
}

interface ChecklistCardProps {
  pagePublished: boolean;
  hasWhatsapp: boolean;
  hasLeads: boolean;
  hasReports: boolean;
  slug: string;
  clientId: string;
  onBuildPage?: () => void;
}

export function ChecklistCard({
  pagePublished,
  hasWhatsapp,
  hasLeads,
  hasReports,
  slug,
  onBuildPage,
}: ChecklistCardProps) {
  const items: ChecklistItem[] = [
    {
      id: "page",
      icon: "🌐",
      label: "בנה דף נחיתה",
      description: "הדף שלך יהיה חי באינטרנט",
      done: pagePublished,
      actionLabel: "בנה עכשיו",
      onAction: onBuildPage,
    },
    {
      id: "whatsapp",
      icon: "📱",
      label: "חבר וואצאפ",
      description: "קבל התראות על לידים חדשים",
      done: hasWhatsapp,
      actionLabel: "חבר עכשיו",
      href: `/client/${slug}/settings`,
    },
    {
      id: "share",
      icon: "🔗",
      label: "שתף את הקישור",
      description: "שלח ללקוחות שלך",
      done: false,
      actionLabel: "שתף →",
      href: `#share`,
    },
    {
      id: "lead",
      icon: "🎯",
      label: "קבל ליד ראשון",
      description: "הגדרות הושלמו!",
      done: hasLeads,
      actionLabel: "צפה בלידים",
      href: `/client/${slug}/leads`,
    },
    {
      id: "report",
      icon: "📊",
      label: "צפה בדוח ראשון",
      description: "הבן מה עובד",
      done: hasReports,
      actionLabel: "צפה בדוחות",
      href: `/client/${slug}/reports`,
    },
  ];

  const completed = items.filter((i) => i.done).length;
  const allDone = completed === items.length;
  const [collapsed, setCollapsed] = useState(allDone);

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
            <p className="text-xs text-green-600">5/5 הושלם</p>
          </div>
        </div>
        <ChevronDown size={16} className="text-green-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-gray-100 cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div>
          <h2 className="font-semibold text-gray-900">רשימת משימות להצלחה</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full w-32 overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${(completed / items.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{completed}/{items.length} הושלם</span>
          </div>
        </div>
        {collapsed ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronUp size={16} className="text-gray-400" />}
      </div>

      {!collapsed && (
        <div className="divide-y divide-gray-50">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-4 px-6 py-3.5 transition-colors ${item.done ? "bg-green-50/40" : ""}`}
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${item.done ? "text-gray-400 line-through" : "text-gray-800"}`}>
                  {item.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
              </div>
              {item.done ? (
                <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />
              ) : item.href ? (
                <Link
                  href={item.href}
                  className="flex-shrink-0 text-xs font-medium px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                  {item.actionLabel}
                </Link>
              ) : (
                <button
                  onClick={item.onAction}
                  className="flex-shrink-0 text-xs font-medium px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                  {item.actionLabel}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
