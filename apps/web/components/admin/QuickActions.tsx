"use client";

import Link from "next/link";
import {
  UserPlus,
  Building2,
  Send,
  Radio,
  Sparkles,
  BarChart2,
} from "lucide-react";

const actions = [
  {
    label: "+ ליד חדש",
    href: "/admin/leads/new",
    icon: UserPlus,
    color: "text-indigo-600",
    bg: "bg-indigo-50 hover:bg-indigo-100",
    shortcut: "Ctrl+L",
  },
  {
    label: "+ לקוח",
    href: "/admin/clients/new",
    icon: Building2,
    color: "text-blue-600",
    bg: "bg-blue-50 hover:bg-blue-100",
    shortcut: "Ctrl+K",
  },
  {
    label: "שלח דוח",
    href: "/admin/reports",
    icon: Send,
    color: "text-green-600",
    bg: "bg-green-50 hover:bg-green-100",
    shortcut: "Ctrl+R",
  },
  {
    label: "שידור",
    href: "/admin/broadcast",
    icon: Radio,
    color: "text-orange-600",
    bg: "bg-orange-50 hover:bg-orange-100",
    shortcut: "Ctrl+B",
  },
  {
    label: "בנה דף",
    href: "/admin/ai-agent",
    icon: Sparkles,
    color: "text-purple-600",
    bg: "bg-purple-50 hover:bg-purple-100",
    shortcut: "Ctrl+P",
  },
  {
    label: "אנליטיקס",
    href: "/admin/reports",
    icon: BarChart2,
    color: "text-rose-600",
    bg: "bg-rose-50 hover:bg-rose-100",
    shortcut: "Ctrl+A",
  },
];

export default function QuickActions() {
  return (
    <div dir="rtl">
      <h2 className="text-lg font-bold text-gray-900 mb-4">פעולות מהירות</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href + action.label}
              href={action.href}
              className={`flex flex-col items-center gap-2 rounded-2xl border border-gray-100 p-4 shadow-sm transition-all duration-150 hover:shadow-md group ${action.bg}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm group-hover:scale-110 transition-transform duration-150`}>
                <Icon size={20} className={action.color} />
              </div>
              <span className="text-sm font-medium text-gray-800 text-center leading-tight">
                {action.label}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">{action.shortcut}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
