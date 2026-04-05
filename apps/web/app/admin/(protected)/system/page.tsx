"use client";

import { SystemClient } from "./SystemClient";
import { StorageDashboard } from "./StorageDashboard";

export default function SystemPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🔧 בריאות המערכת</h1>
        <p className="text-sm text-gray-500 mt-0.5">סטטוס שירותים, נתונים ואחסון</p>
      </div>

      <SystemClient />

      <div className="pt-4 border-t border-gray-200">
        <StorageDashboard />
      </div>
    </div>
  );
}
