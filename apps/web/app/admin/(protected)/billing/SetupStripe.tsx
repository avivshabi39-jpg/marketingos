"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";

export function SetupStripe() {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ connected: boolean; reason?: string; mode?: string } | null>(null);

  const checkConnection = async () => {
    setChecking(true);
    setResult(null);
    try {
      const res = await fetch("/api/billing/health");
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ connected: false, reason: "לא ניתן להתחבר לשרת" });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-5" dir="rtl">
      <div>
        <h3 className="text-base font-semibold text-amber-900">⚠️ Stripe לא מוגדר</h3>
        <p className="text-sm text-amber-700 mt-1">
          כדי לקבל תשלומים, יש להגדיר את חשבון Stripe שלך.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-amber-800">להפעלת תשלומים:</p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-amber-800">
          <li>
            צור חשבון ב-{" "}
            <a
              href="https://stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline inline-flex items-center gap-1"
            >
              stripe.com <ExternalLink size={12} />
            </a>
          </li>
          <li>
            עבור ל-{" "}
            <a
              href="https://dashboard.stripe.com/apikeys"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline inline-flex items-center gap-1"
            >
              לוח המפתחות <ExternalLink size={12} />
            </a>{" "}
            וקח את המפתחות
          </li>
          <li>
            הוסף ל-<code className="font-mono text-xs bg-amber-100 px-1 py-0.5 rounded">.env.local</code>:
          </li>
        </ol>

        <pre className="bg-amber-900 text-amber-100 text-xs p-3 rounded-lg overflow-x-auto font-mono whitespace-pre-wrap">
{`STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_AGENCY=price_...`}
        </pre>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
          <strong>מצב בדיקה:</strong> השתמש במפתחות שמתחילים ב-<code className="font-mono">sk_test_</code> ו-<code className="font-mono">pk_test_</code> לבדיקות. הם לא גובים כסף אמיתי.
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={checkConnection}
          disabled={checking}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50"
        >
          {checking ? <Loader2 size={14} className="animate-spin" /> : null}
          בדוק חיבור
        </button>

        {result && (
          <div className={`flex items-center gap-1.5 text-sm font-medium ${result.connected ? "text-green-700" : "text-red-600"}`}>
            {result.connected
              ? <><CheckCircle size={16} /> מחובר ({result.mode === "test" ? "מצב בדיקה" : "Live"})</>
              : <><XCircle size={16} /> {result.reason}</>
            }
          </div>
        )}
      </div>
    </div>
  );
}
