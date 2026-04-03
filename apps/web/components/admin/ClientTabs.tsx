"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Tab = { key: string; label: string };

export function ClientTabs({
  tabs,
  panels,
}: {
  tabs: Tab[];
  panels: Record<string, React.ReactNode>;
}) {
  const [active, setActive] = useState(tabs[0]?.key ?? "");

  return (
    <div>
      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap",
              active === tab.key
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {panels[active]}
    </div>
  );
}
