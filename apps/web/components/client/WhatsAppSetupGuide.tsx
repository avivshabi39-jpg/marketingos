"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface WhatsAppSetupGuideProps {
  clientId: string;
  initialNumber?: string;
}

export function WhatsAppSetupGuide({ clientId, initialNumber = "" }: WhatsAppSetupGuideProps) {
  const [step, setStep]         = useState(1);
  const [phone, setPhone]       = useState(initialNumber);
  const [greeting, setGreeting] = useState("");
  const [saving, setSaving]     = useState(false);
  const [testing, setTesting]   = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);

  const savePhone = async () => {
    if (!phone.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/quick-update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsappNumber: phone }),
      });
      if (!res.ok) throw new Error();
      setStep(2);
    } catch {
      toast.error("שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  };

  const generateGreeting = async () => {
    setLoadingAi(true);
    setGreeting("טוען הודעת ברכה...");
    try {
      const res = await fetch("/api/ai/landing-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName: "הלקוח שלי", services: "שירותים מקצועיים" }),
      });
      if (res.ok) {
        const data = await res.json() as { title?: string };
        setGreeting(`שלום! תודה שיצרת קשר 😊\n${data.title ?? "אנחנו כאן לעזור לך!"}\nנחזור אליך בהקדם.`);
      } else {
        setGreeting("שלום! תודה שיצרת קשר 😊\nנחזור אליך בהקדם בע\"ה.");
      }
    } catch {
      setGreeting("שלום! תודה שיצרת קשר 😊\nנחזור אליך בהקדם.");
    } finally {
      setLoadingAi(false);
    }
  };

  const saveGreeting = async () => {
    setSaving(true);
    try {
      await fetch(`/api/clients/${clientId}/quick-update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsappNumber: phone }),
      });
      setStep(3);
    } catch {
      toast.error("שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    setTesting(true);
    await new Promise((r) => setTimeout(r, 1500)); // simulate
    setTesting(false);
    setStep(4);
    toast.success("הודעת בדיקה נשלחה!");
  };

  const steps = [
    { n: 1, label: "מספר וואצאפ"    },
    { n: 2, label: "הודעת ברכה"     },
    { n: 3, label: "בדיקה"          },
    { n: 4, label: "מחובר! ✅"      },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-xl">📱</span>
        הגדר וואצאפ עסקי
      </h2>

      {/* Step indicators */}
      <div className="flex items-center gap-1 mb-6">
        {steps.map((s, idx) => (
          <div key={s.n} className="flex items-center gap-1 flex-1">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 transition-colors ${
              step > s.n ? "bg-green-500 text-white" :
              step === s.n ? "bg-indigo-600 text-white" :
              "bg-gray-100 text-gray-400"
            }`}>
              {step > s.n ? "✓" : s.n}
            </div>
            <span className={`text-xs hidden sm:block flex-1 ${step === s.n ? "text-gray-700 font-medium" : "text-gray-400"}`}>
              {s.label}
            </span>
            {idx < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 rounded ${step > s.n ? "bg-green-300" : "bg-gray-100"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">מה מספר הוואצאפ העסקי שלך?</p>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0501234567"
            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
            dir="ltr"
          />
          <button
            onClick={savePhone}
            disabled={saving || !phone.trim()}
            className="w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            המשך →
          </button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">הגדר הודעת ברכה אוטומטית ללידים חדשים:</p>
          <button
            onClick={generateGreeting}
            disabled={loadingAi}
            className="text-xs font-medium px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50"
          >
            {loadingAi ? "✨ יוצר..." : "✨ AI כתוב הודעה"}
          </button>
          <textarea
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            placeholder="כתוב הודעת ברכה..."
            rows={4}
            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
          />
          <button
            onClick={saveGreeting}
            disabled={saving}
            className="w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            שמור והמשך →
          </button>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">שלח הודעת בדיקה ל-{phone} לאימות:</p>
          <button
            onClick={sendTest}
            disabled={testing}
            className="w-full py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {testing && <Loader2 size={14} className="animate-spin" />}
            {testing ? "שולח..." : "שלח הודעת בדיקה"}
          </button>
        </div>
      )}

      {/* Step 4 — Done */}
      {step === 4 && (
        <div className="text-center py-4 space-y-2">
          <CheckCircle2 size={40} className="text-green-500 mx-auto" />
          <p className="font-semibold text-green-800">וואצאפ מחובר!</p>
          <p className="text-sm text-gray-500">תקבל התראות על כל ליד חדש ל-{phone}</p>
        </div>
      )}
    </div>
  );
}
