"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";

interface Props {
  untreatedCount: number;
  criticalCount: number;
  slug: string;
}

const STYLES = {
  critical: {
    wrapper: "bg-red-50 border-red-200",
    icon: "bg-red-100 text-red-600",
    title: "text-red-800",
    sub: "text-red-600",
    btn: "bg-red-600 hover:bg-red-700 text-white",
  },
  warning: {
    wrapper: "bg-amber-50 border-amber-200",
    icon: "bg-amber-100 text-amber-600",
    title: "text-amber-800",
    sub: "text-amber-600",
    btn: "bg-amber-600 hover:bg-amber-700 text-white",
  },
  info: {
    wrapper: "bg-blue-50 border-blue-200",
    icon: "bg-blue-100 text-blue-600",
    title: "text-blue-800",
    sub: "text-blue-500",
    btn: "bg-blue-600 hover:bg-blue-700 text-white",
  },
};

export function UntreatedLeadsAlert({ untreatedCount, criticalCount, slug }: Props) {
  if (untreatedCount === 0) return null;

  const level = criticalCount > 0 ? "critical" : untreatedCount > 0 ? "warning" : "info";
  const style = STYLES[level];

  return (
    <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${style.wrapper}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${style.icon}`}>
        <AlertTriangle size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${style.title}`}>
          {untreatedCount} {untreatedCount === 1 ? "ליד ממתין" : "לידים ממתינים"} למענה
        </p>
        {criticalCount > 0 && (
          <p className={`text-xs mt-0.5 ${style.sub}`}>
            {criticalCount} {criticalCount === 1 ? "דחוף" : "דחופים"} (30+ דקות)
          </p>
        )}
      </div>
      <Link
        href={`/client/${slug}/leads`}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors flex-shrink-0 ${style.btn}`}
      >
        טפל עכשיו
        <ArrowLeft size={12} />
      </Link>
    </div>
  );
}
