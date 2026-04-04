"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Loader2, Check, Copy, ExternalLink, Share2, Sparkles } from "lucide-react";

interface Props {
  client: {
    id: string;
    name: string;
    slug: string;
    industry: string;
    pagePublished: boolean;
    phone: string;
  };
  appUrl: string;
}

const TARGET_OPTIONS = ["בעלי בתים", "שוכרים", "עסקים קטנים", "חברות גדולות", "זוגות צעירים", "הורים לילדים", "קשישים", 'בעלי נדל"ן'];
const GENDER_OPTIONS = ["👨 גברים בעיקר", "👩 נשים בעיקר", "👥 מעורב שווה"];
const AGE_OPTIONS = ["18-25", "25-35", "35-50", "50-65", "65+", "כל הגילאים"];
const PRICE_OPTIONS = ["עד ₪200", "₪200-500", "₪500-1,500", "₪1,500-5,000", "מעל ₪5,000", "לפי הצעת מחיר"];
const URGENCY_OPTIONS = ["🔥 דחוף מאוד", "📅 תוך שבוע-שבועיים", "⏳ מתכנן מראש", "🤔 בשלב בדיקה"];
const ACTION_OPTIONS = ["📞 אתקשר תוך שעה", "💬 אשלח וואצאפ", "📅 יקבע פגישה", "📧 יקבל מייל", "💰 יקבל הצעת מחיר"];
const RESPONSE_OPTIONS = ["⚡ תוך שעה", "🕐 תוך 3 שעות", "📅 באותו יום", "🗓️ תוך 24 שעות"];

const SECTIONS = [
  { id: "business", label: "🏢 העסק", icon: "🏢" },
  { id: "audience", label: "👥 הלקוח", icon: "👥" },
  { id: "solution", label: "💡 פתרון", icon: "💡" },
  { id: "process", label: "💰 תהליך", icon: "💰" },
  { id: "trust", label: "⭐ ניסיון", icon: "⭐" },
];

const PROGRESS_MSGS = ["מנתח את העסק שלך...", "כותב כותרת מנצחת...", "בונה בלוקים מותאמים...", "מוסיף המלצות...", "מעצב צבעים...", "הדף מוכן! 🎉"];

function Pill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
        selected ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
      }`}
    >
      {label}
    </button>
  );
}

function MultiPill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
        selected ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
      }`}
    >
      {selected ? "✓ " : ""}{label}
    </button>
  );
}

export function WizardClient({ client, appUrl }: Props) {
  const [section, setSection] = useState(0); // 0-4 = briefing sections, 5=building, 6=preview, 7=live
  const pageUrl = `${appUrl}/${client.slug}`;

  // Briefing
  const [businessDescription, setBusinessDescription] = useState("");
  const [mainService, setMainService] = useState("");
  const [uniqueValue, setUniqueValue] = useState("");
  const [targetAudience, setTargetAudience] = useState<string[]>([]);
  const [targetGender, setTargetGender] = useState("");
  const [targetAge, setTargetAge] = useState("");
  const [targetCity, setTargetCity] = useState("");
  const [mainProblem, setMainProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [urgency, setUrgency] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [responseTime, setResponseTime] = useState("");
  const [testimonial, setTestimonial] = useState("");
  const [yearsInBusiness, setYearsInBusiness] = useState("");

  // Build state
  const [building, setBuilding] = useState(false);
  const [progressIdx, setProgressIdx] = useState(0);
  const [buildError, setBuildError] = useState("");
  const [pageColor, setPageColor] = useState("#6366f1");
  const [pageTitle, setPageTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const answeredCount = [businessDescription, mainService, uniqueValue, targetAudience.length > 0 ? "y" : "", targetGender, targetAge, targetCity, mainProblem, solution, priceRange, urgency, nextAction, responseTime, testimonial, yearsInBusiness].filter(Boolean).length;
  const canBuild = businessDescription.trim() && mainService.trim() && mainProblem.trim();

  function toggleTarget(opt: string) {
    setTargetAudience((p) => p.includes(opt) ? p.filter((x) => x !== opt) : [...p, opt]);
  }

  const buildPage = useCallback(async () => {
    setBuilding(true);
    setBuildError("");
    setProgressIdx(0);
    const interval = setInterval(() => setProgressIdx((p) => Math.min(p + 1, PROGRESS_MSGS.length - 1)), 1200);

    try {
      const res = await fetch("/api/ai/build-landing-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          wizardData: {
            businessName: client.name, industry: client.industry,
            businessDescription, mainService, uniqueValue,
            targetAudience: targetAudience.join(", "), targetGender, targetAge, city: targetCity,
            problemSolved: mainProblem, solution, priceRange, urgency,
            nextAction, responseTime, testimonial, yearsInBusiness,
          },
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; landingPageTitle?: string; landingPageColor?: string };
      clearInterval(interval);
      if (!res.ok || !data.ok) { setBuildError(data.error ?? "שגיאה — נסה שוב"); setBuilding(false); return; }
      setPageTitle(data.landingPageTitle ?? client.name);
      setPageColor(data.landingPageColor ?? "#6366f1");
      setProgressIdx(PROGRESS_MSGS.length - 1);
      setTimeout(() => { setBuilding(false); setSection(6); }, 1000);
    } catch { clearInterval(interval); setBuildError("שגיאת חיבור"); setBuilding(false); }
  }, [client, businessDescription, mainService, uniqueValue, targetAudience, targetGender, targetAge, targetCity, mainProblem, solution, priceRange, urgency, nextAction, responseTime, testimonial, yearsInBusiness]);

  useEffect(() => { if (section === 5 && !building && !buildError) buildPage(); }, [section, building, buildError, buildPage]);

  async function saveQuickEdit(field: string, value: string) {
    setSaving(true);
    await fetch(`/api/clients/${client.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: value }) });
    setSaving(false);
  }

  function copyUrl() { navigator.clipboard.writeText(pageUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }

  // Section content
  const isBriefing = section <= 4;
  const sectionContent: Record<number, React.ReactNode> = {
    0: ( // Business
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1.5">1. תאר את העסק שלך בקצרה *</label>
          <textarea value={businessDescription} onChange={(e) => setBusinessDescription(e.target.value)} rows={3} placeholder="למשל: אני מנהל חברת ניקיון לבתים ומשרדים באזור המרכז" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none resize-none" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1.5">2. מה השירות או המוצר הראשי? *</label>
          <textarea value={mainService} onChange={(e) => setMainService(e.target.value)} rows={2} placeholder="למשל: ניקיון לאחר שיפוץ, ניקיון שוטף, ניקיון משרדים" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none resize-none" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1.5">3. מה הייחוד שלך לעומת מתחרים?</label>
          <textarea value={uniqueValue} onChange={(e) => setUniqueValue(e.target.value)} rows={2} placeholder="למשל: צוות מנוסה, חומרים ירוקים, ערבות להחזר כסף" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none resize-none" />
        </div>
      </div>
    ),
    1: ( // Audience
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">4. מי הלקוח האידיאלי? (בחר כמה)</label>
          <div className="flex flex-wrap gap-2">{TARGET_OPTIONS.map((o) => <MultiPill key={o} label={o} selected={targetAudience.includes(o)} onClick={() => toggleTarget(o)} />)}</div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">5. מגדר קהל היעד</label>
          <div className="flex flex-wrap gap-2">{GENDER_OPTIONS.map((o) => <Pill key={o} label={o} selected={targetGender === o} onClick={() => setTargetGender(targetGender === o ? "" : o)} />)}</div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">6. גיל קהל היעד</label>
          <div className="flex flex-wrap gap-2">{AGE_OPTIONS.map((o) => <Pill key={o} label={o} selected={targetAge === o} onClick={() => setTargetAge(targetAge === o ? "" : o)} />)}</div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1.5">7. באיזה אזור אתה עובד?</label>
          <input value={targetCity} onChange={(e) => setTargetCity(e.target.value)} placeholder="תל אביב, גוש דן, כל הארץ..." className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" />
        </div>
      </div>
    ),
    2: ( // Problem & Solution
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1.5">8. מה הבעיה הכי גדולה שאתה פותר? *</label>
          <textarea value={mainProblem} onChange={(e) => setMainProblem(e.target.value)} rows={2} placeholder="למשל: אין להם זמן לנקות, לא מוצאים ניקיון אמין ואיכותי" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none resize-none" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1.5">9. איך אתה פותר את הבעיה?</label>
          <textarea value={solution} onChange={(e) => setSolution(e.target.value)} rows={2} placeholder="למשל: שירות קבוע כל שבוע, צוות מנוסה עם ציוד מקצועי" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none resize-none" />
        </div>
      </div>
    ),
    3: ( // Process & Money
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">10. כמה עולה השירות?</label>
          <div className="flex flex-wrap gap-2">{PRICE_OPTIONS.map((o) => <Pill key={o} label={o} selected={priceRange === o} onClick={() => setPriceRange(priceRange === o ? "" : o)} />)}</div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">11. כמה דחוף הצורך של הלקוח?</label>
          <div className="flex flex-wrap gap-2">{URGENCY_OPTIONS.map((o) => <Pill key={o} label={o} selected={urgency === o} onClick={() => setUrgency(urgency === o ? "" : o)} />)}</div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">12. מה קורה אחרי שלקוח משאיר פרטים?</label>
          <div className="flex flex-wrap gap-2">{ACTION_OPTIONS.map((o) => <Pill key={o} label={o} selected={nextAction === o} onClick={() => setNextAction(nextAction === o ? "" : o)} />)}</div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">13. תוך כמה זמן חוזרים ללקוח?</label>
          <div className="flex flex-wrap gap-2">{RESPONSE_OPTIONS.map((o) => <Pill key={o} label={o} selected={responseTime === o} onClick={() => setResponseTime(responseTime === o ? "" : o)} />)}</div>
        </div>
      </div>
    ),
    4: ( // Trust
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1.5">14. המלצה מלקוח מרוצה (לא חובה)</label>
          <p className="text-xs text-indigo-500 mb-2">💡 המלצה אמיתית מגדילה את ההמרה ב-40%</p>
          <textarea value={testimonial} onChange={(e) => setTestimonial(e.target.value)} rows={2} placeholder={`"העבודה הייתה מדהימה!" — רחל כהן, תל אביב`} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none resize-none" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1.5">15. כמה שנים אתה בתחום?</label>
          <input value={yearsInBusiness} onChange={(e) => setYearsInBusiness(e.target.value)} placeholder="8 שנות ניסיון, 500+ לקוחות מרוצים" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" />
        </div>
      </div>
    ),
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-900">🧙 אשף בניית דף נחיתה</h1>
            <span className="text-sm text-gray-400">{answeredCount}/15 שאלות</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${section >= 5 ? 100 : (answeredCount / 15) * 100}%` }} />
          </div>
          {/* Section tabs */}
          {isBriefing && (
            <div className="flex gap-1 mt-3">
              {SECTIONS.map((s, i) => (
                <button key={s.id} onClick={() => setSection(i)} className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${section === i ? "bg-indigo-100 text-indigo-700" : "text-gray-400 hover:text-gray-600"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Briefing sections */}
        {isBriefing && (
          <div>
            <div className="mb-8 text-center">
              <div className="text-4xl mb-2">{SECTIONS[section].icon}</div>
              <h2 className="text-xl font-bold text-gray-900">{SECTIONS[section].label}</h2>
            </div>
            {sectionContent[section]}
            <div className="flex gap-3 mt-8">
              {section > 0 && (
                <button onClick={() => setSection(section - 1)} className="px-4 py-3 text-sm text-gray-600 hover:text-gray-800">← הקודם</button>
              )}
              {section < 4 ? (
                <button onClick={() => setSection(section + 1)} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl py-3 text-sm transition-colors">
                  הבא →
                </button>
              ) : (
                <button onClick={() => setSection(5)} disabled={!canBuild} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 bg-gradient-to-l from-indigo-600 to-purple-600 text-white shadow-lg">
                  <Sparkles size={16} /> בנה לי דף מנצח!
                </button>
              )}
            </div>
          </div>
        )}

        {/* Building */}
        {section === 5 && (
          <div className="text-center py-16 space-y-8">
            <div className="text-6xl mb-4">{progressIdx === PROGRESS_MSGS.length - 1 ? "🎉" : "✨"}</div>
            <h2 className="text-2xl font-bold text-gray-900">{building ? "ה-AI בונה לך דף מושלם..." : buildError ? "משהו לא עבד" : "מוכן!"}</h2>
            {building && (
              <div className="max-w-sm mx-auto space-y-3">
                {PROGRESS_MSGS.map((msg, i) => (
                  <div key={msg} className={`flex items-center gap-3 transition-all ${i <= progressIdx ? "opacity-100" : "opacity-20"}`}>
                    {i < progressIdx ? <Check size={16} className="text-green-500" /> : i === progressIdx ? <Loader2 size={16} className="text-indigo-500 animate-spin" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
                    <span className={`text-sm ${i <= progressIdx ? "text-gray-700" : "text-gray-400"}`}>{msg}</span>
                  </div>
                ))}
                <div className="h-2 bg-gray-200 rounded-full mt-4"><div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${((progressIdx + 1) / PROGRESS_MSGS.length) * 100}%` }} /></div>
              </div>
            )}
            {buildError && (
              <div className="space-y-4">
                <p className="text-red-500 text-sm">{buildError}</p>
                <button onClick={() => { setBuildError(""); buildPage(); }} className="bg-indigo-600 text-white font-semibold rounded-xl px-6 py-3 text-sm">נסה שוב</button>
                <button onClick={() => setSection(4)} className="block mx-auto text-sm text-gray-500">← חזרה</button>
              </div>
            )}
          </div>
        )}

        {/* Preview */}
        {section === 6 && (
          <div className="space-y-5">
            <div className="text-center"><h2 className="text-2xl font-bold text-gray-900">👀 הנה הדף שלך!</h2><p className="text-gray-500 mt-1">אפשר לשנות כל דבר</p></div>

            {/* AI Agent comment */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm flex-shrink-0">🤖</div>
                <div className="text-sm text-gray-700 leading-relaxed">
                  <span className="font-semibold text-gray-900">הסוכן AI:</span>{" "}
                  הדף נראה מצוין! כותרת חזקה ו-CTA ברור. רוצה לשפר משהו לפני הפרסום?
                </div>
              </div>
              <div className="flex gap-1.5 mt-3 flex-wrap mr-11">
                {[
                  { label: "✏️ שנה כותרת", action: () => { const t = prompt("כותרת חדשה:"); if (t) { setPageTitle(t); saveQuickEdit("landingPageTitle", t); } } },
                  { label: "🎨 שנה צבע", action: () => document.querySelector<HTMLInputElement>('input[type="color"]')?.click() },
                  { label: "🔄 בנה מחדש", action: () => { setBuildError(""); setSection(5); } },
                ].map((c) => (
                  <button key={c.label} onClick={c.action} className="px-3 py-1 rounded-full bg-white border border-indigo-200 text-indigo-600 text-xs font-medium hover:bg-indigo-50 transition-colors">
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="h-[350px] overflow-hidden relative bg-gray-100">
                <iframe src={`${pageUrl}?t=${Date.now()}`} className="border-none pointer-events-none" style={{ width: "250%", height: "250%", transform: "scale(0.4)", transformOrigin: "top right" }} title="preview" />
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm">עריכה מהירה</h3>
              <div className="flex items-center gap-3">
                <input type="color" value={pageColor} onChange={(e) => setPageColor(e.target.value)} className="w-10 h-10 rounded-lg border cursor-pointer" />
                <input value={pageColor} onChange={(e) => setPageColor(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm font-mono" dir="ltr" />
                <button onClick={() => saveQuickEdit("landingPageColor", pageColor)} disabled={saving} className="bg-gray-100 rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-50">{saving ? "..." : "שמור"}</button>
              </div>
              <div className="flex items-center gap-3">
                <input value={pageTitle} onChange={(e) => setPageTitle(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
                <button onClick={() => saveQuickEdit("landingPageTitle", pageTitle)} disabled={saving} className="bg-gray-100 rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-50">{saving ? "..." : "שמור"}</button>
              </div>
              <Link href={`/admin/clients/${client.id}/builder`} className="text-indigo-600 text-sm font-medium">רוצה שינויים גדולים? → בונה מתקדם</Link>
            </div>
            <button onClick={() => setSection(7)} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl py-3.5 text-sm transition-colors"><Check size={16} /> זה מושלם! פרסם ↗</button>
          </div>
        )}

        {/* Live */}
        {section === 7 && (() => {
          const portalUrl = `${appUrl}/client/${client.slug}`;
          const portalPass = "portal123";
          const sendMsg = `שלום! הדף שלך מוכן 🎉\n\nצפה בדף:\n${pageUrl}\n\nכניסה לפורטל:\n${portalUrl}\nסיסמה: ${portalPass}`;
          return (
            <div className="text-center py-8 space-y-6">
              <div className="text-7xl">🎉</div>
              <h2 className="text-3xl font-bold text-gray-900">הדף שלך חי!</h2>
              <p className="text-gray-500">שתף את הקישור והתחל לקבל לידים</p>

              {/* Page URL */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 max-w-lg mx-auto">
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-xs text-gray-400 mb-0.5">🌐 דף הנחיתה</p>
                  <p className="text-sm font-mono text-gray-600 truncate text-left" dir="ltr">{pageUrl}</p>
                </div>
                <button onClick={copyUrl} className="flex items-center gap-1 bg-indigo-600 text-white rounded-lg px-3 py-2 text-xs font-medium flex-shrink-0">
                  {copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "הועתק!" : "העתק"}
                </button>
              </div>

              {/* Portal credentials */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-5 max-w-lg mx-auto text-right" dir="rtl">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2 justify-center">🔑 פרטי כניסה לפורטל הלקוח</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
                    <span className="text-gray-500">כתובת:</span>
                    <span className="font-mono text-indigo-600 text-xs" dir="ltr">/client/{client.slug}</span>
                  </div>
                  <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
                    <span className="text-gray-500">סיסמה:</span>
                    <span className="font-mono font-bold">{portalPass}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(sendMsg)}`, "_blank")}
                    className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg py-2.5 text-xs transition-colors"
                  >
                    💬 שלח ללקוח בוואצאפ
                  </button>
                  <button
                    onClick={() => { navigator.clipboard.writeText(`כניסה: ${portalUrl}\nסיסמה: ${portalPass}`); }}
                    className="flex-1 flex items-center justify-center gap-1 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg py-2.5 text-xs hover:bg-gray-50 transition-colors"
                  >
                    📋 העתק פרטים
                  </button>
                </div>
              </div>

              {/* Share buttons */}
              <div className="flex justify-center gap-3">
                <a href={`https://wa.me/?text=${encodeURIComponent(`בואו לראות: ${pageUrl}`)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-green-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium"><Share2 size={14} /> שתף בוואצאפ</a>
                <a href={pageUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-gray-100 text-gray-700 rounded-xl px-5 py-2.5 text-sm font-medium"><ExternalLink size={14} /> צפה בדף</a>
              </div>

              {/* Dashboard link */}
              <div className="flex flex-col gap-3 max-w-sm mx-auto">
                <Link href={`/admin/clients/${client.id}`} className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl py-3 text-sm transition-colors">פתח לוח בקרה</Link>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
