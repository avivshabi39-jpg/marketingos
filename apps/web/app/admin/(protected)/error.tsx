"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]" dir="rtl">
      <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle size={24} className="text-red-500" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">אירעה שגיאה</h2>
      <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
        שגיאה בטעינת הדף. נסה לרענן את הדף או חזור אחורה.
      </p>
      <button
        onClick={reset}
        className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
      >
        נסה שוב
      </button>
    </div>
  );
}
