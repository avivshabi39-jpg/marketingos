"use client";

import { useState } from "react";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const FAKE_BACKUP_CODES = [
  "1234-5678",
  "8765-4321",
  "2468-1357",
  "9753-8642",
  "1122-3344",
  "5566-7788",
];

export default function SecurityPage() {
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [verified, setVerified] = useState(false);

  function handleVerify() {
    if (codeInput.length === 6) {
      setVerified(true);
    }
  }

  return (
    <div className="space-y-6 max-w-lg" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <Shield size={20} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">אבטחה מתקדמת</h1>
          <p className="text-sm text-slate-500">הגן על החשבון שלך עם שכבות אבטחה נוספות</p>
        </div>
      </div>

      {/* 2FA Card */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">אימות דו-שלבי (2FA)</h2>
            <p className="text-xs text-slate-400 mt-0.5">הוסף שכבת הגנה נוספת לכניסה לחשבון</p>
          </div>
          {/* Status badge */}
          <span
            className={cn(
              "text-xs px-2.5 py-1 rounded-full font-semibold",
              twoFaEnabled && verified
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-500"
            )}
          >
            {twoFaEnabled && verified ? "פעיל" : "כבוי"}
          </span>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">הפעל 2FA</span>
            <button
              onClick={() => {
                setTwoFaEnabled((v) => !v);
                setVerified(false);
                setCodeInput("");
              }}
              className={cn(
                "relative inline-flex w-11 h-6 rounded-full transition-colors focus:outline-none",
                twoFaEnabled ? "bg-blue-500" : "bg-slate-200"
              )}
            >
              <span
                className={cn(
                  "inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform mt-0.5",
                  twoFaEnabled ? "translate-x-1" : "translate-x-5"
                )}
              />
            </button>
          </div>

          {/* Expanded 2FA setup */}
          {twoFaEnabled && (
            <div className="space-y-5">
              {/* QR code placeholder */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-36 h-36 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                  <p className="text-xs text-slate-400 text-center px-3">סרוק עם<br />Google Authenticator</p>
                </div>
                <p className="text-xs text-slate-400">או הזן את הקוד ידנית: <span className="font-mono font-semibold text-slate-600">MKTG-OS-2FA-DEMO</span></p>
              </div>

              {/* Code input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">קוד אימות (6 ספרות)</label>
                <input
                  dir="ltr"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <button
                onClick={handleVerify}
                disabled={codeInput.length !== 6}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                אמת קוד
              </button>

              {verified && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <p className="text-sm font-semibold text-green-700 mb-3">2FA הופעל בהצלחה! שמור את קודי הגיבוי:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {FAKE_BACKUP_CODES.map((code) => (
                      <span
                        key={code}
                        className="font-mono text-sm text-slate-700 bg-white border border-slate-200 rounded px-3 py-1.5 text-center"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-3">שמור קודים אלה במקום בטוח. כל קוד שמיש פעם אחת בלבד.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
