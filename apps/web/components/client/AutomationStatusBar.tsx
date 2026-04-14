"use client";

import Link from "next/link";
import { type AutomationItem, AUTOMATION_STATE_STYLES } from "@/lib/automationStatus";

interface Props {
  automations: AutomationItem[];
  slug: string;
}

export function AutomationStatusBar({ automations, slug }: Props) {
  const activeCount = automations.filter((a) => a.state === "active").length;
  const needsSetup = automations.filter((a) => a.state === "setup_needed");

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-slate-700">
          ⚡ אוטומציות ({activeCount}/{automations.length} פעילות)
        </p>
        <Link
          href={`/client/${slug}/settings`}
          className="text-[10px] text-blue-600 hover:text-blue-700 font-medium"
        >
          הגדרות →
        </Link>
      </div>

      {/* Automation items */}
      <div className="flex flex-wrap gap-2">
        {automations.map((auto) => {
          const style = AUTOMATION_STATE_STYLES[auto.state];
          return (
            <div
              key={auto.key}
              title={auto.description + (auto.setupHint ? ` — ${auto.setupHint}` : "")}
              className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg ${style.bg} ${style.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />
              {auto.label}
            </div>
          );
        })}
      </div>

      {/* Setup prompt (if any automation needs setup) */}
      {needsSetup.length > 0 && (
        <div className="mt-2 text-[10px] text-amber-600">
          💡 {needsSetup[0].setupHint ?? "הגדר את האוטומציות בהגדרות"}
        </div>
      )}
    </div>
  );
}
