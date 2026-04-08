"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Loader2, Check, Copy, Share2, ExternalLink, Monitor, Smartphone } from "lucide-react";

interface Props {
  client: { id: string; name: string; slug: string; industry: string; pagePublished: boolean; primaryColor: string; landingPageTitle: string | null };
  appUrl: string;
}

type Phase = "briefing" | "building" | "preview" | "published";

interface Question {
  id: string; question: string; placeholder?: string; type: "textarea" | "text" | "select" | "multiselect";
  options?: string[]; optional?: boolean; tip?: string; validate: (v: string) => string | null;
}

const QUESTIONS: Question[] = [
  { id: "businessDescription", question: "שלום! אני אעזור לך לבנות דף נחיתה מדהים 🚀\n\nספר לי על העסק שלך — מה אתה עושה?", placeholder: "למשל: חברת ניקיון לבתים ומשרדים...", type: "textarea", validate: (v) => v.length > 20 ? null : "ספר קצת יותר" },
  { id: "mainService", question: "מעולה! מה השירות הראשי?", placeholder: "ניקיון שוטף, ניקיון לאחר שיפוץ...", type: "textarea", validate: (v) => v.length > 15 ? null : "תאר ברורה יותר" },
  { id: "uniqueValue", question: "מה הייחוד שלך? למה יבחרו דווקא בך?", placeholder: "צוות מנוסה, חומרים ירוקים...", type: "textarea", validate: (v) => v.length > 10 ? null : "ספר מה מיוחד" },
  { id: "targetAudience", question: "מי הלקוח האידיאלי? (בחר כמה)", type: "multiselect", options: ["בעלי בתים", "עסקים", "זוגות צעירים", "הורים", "קשישים", 'בעלי נדל"ן'], validate: (v) => v ? null : "בחר לפחות אחד" },
  { id: "targetGender", question: "מגדר קהל היעד?", type: "select", options: ["👨 גברים", "👩 נשים", "👥 מעורב"], validate: (v) => v ? null : "בחר" },
  { id: "targetAge", question: "גיל קהל היעד?", type: "select", options: ["18-25", "25-35", "35-50", "50+", "כל הגילאים"], validate: (v) => v ? null : "בחר" },
  { id: "targetCity", question: "באיזה אזור אתה עובד?", placeholder: "תל אביב, גוש דן...", type: "text", validate: (v) => v.length > 1 ? null : "ציין אזור" },
  { id: "mainProblem", question: "💡 מה הכאב הגדול של הלקוח שאתה פותר?", placeholder: "אין להם זמן, לא מוצאים שירות אמין...", type: "textarea", tip: "💡 דף שמדבר על כאב אמיתי מקבל פי 3 לידים", validate: (v) => v.length > 20 ? null : "תאר בפירוט" },
  { id: "solution", question: "איך אתה פותר את זה?", placeholder: "שירות קבוע, צוות מנוסה...", type: "textarea", validate: (v) => v.length > 15 ? null : "תאר הפתרון" },
  { id: "priceRange", question: "💰 כמה עולה השירות?", type: "select", options: ["עד ₪200", "₪200-500", "₪500-1,500", "₪1,500-5,000", "מעל ₪5,000", "לפי הצעת מחיר"], validate: (v) => v ? null : "בחר" },
  { id: "urgency", question: "כמה דחוף הצורך?", type: "select", options: ["🔥 דחוף מאוד", "📅 תוך שבוע", "⏳ מתכנן מראש", "🤔 בשלב בדיקה"], validate: (v) => v ? null : "בחר" },
  { id: "nextAction", question: "📞 מה קורה אחרי שלקוח משאיר פרטים?", type: "select", options: ["📞 אתקשר", "💬 וואצאפ", "📅 פגישה", "📧 מייל", "💰 הצעת מחיר"], validate: (v) => v ? null : "בחר" },
  { id: "responseTime", question: "תוך כמה זמן חוזרים?", type: "select", options: ["⚡ תוך שעה", "🕐 3 שעות", "📅 באותו יום", "🗓️ 24 שעות"], tip: "⚡ מענה תוך שעה = פי 7 המרות!", validate: (v) => v ? null : "בחר" },
  { id: "testimonial", question: "⭐ המלצה מלקוח? (לא חובה — מגדיל 40%!)", placeholder: '"השירות מדהים!" — דוד כהן', type: "textarea", optional: true, validate: () => null },
  { id: "yearsInBusiness", question: "כמה שנות ניסיון? (לא חובה)", placeholder: "8 שנים, 500+ לקוחות...", type: "text", optional: true, validate: () => null },
];

const BUILD_STEPS = ["מנתח את העסק...", "כותב כותרת...", "בונה בלוקים...", "מוסיף המלצות...", "מעצב צבעים...", "מוכן! 🎉"];

export function PortalPageBuilder({ client, appUrl }: Props) {
  const [phase, setPhase] = useState<Phase>("briefing");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [chatHistory, setChatHistory] = useState<{ type: "ai" | "user"; content: string }[]>([{ type: "ai", content: QUESTIONS[0].question }]);
  const [error, setError] = useState("");
  const [buildStep, setBuildStep] = useState("");
  const [mobileView, setMobileView] = useState(false);
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const pageUrl = `${appUrl}/${client.slug}`;

  const updateScale = useCallback(() => {
    const container = previewContainerRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();
    const iframeW = mobileView ? 390 : 1440;
    const iframeH = 900;
    const padding = 32;
    const scaleX = (width - padding) / iframeW;
    const scaleY = (height - padding) / iframeH;
    setPreviewScale(Math.min(scaleX, scaleY, 1));
  }, [mobileView]);

  useEffect(() => {
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [updateScale]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory, error]);

  function submitAnswer() {
    const q = QUESTIONS[currentQ]; const val = currentAnswer.trim();
    if (!q.optional && !val) { setError(q.validate("") ?? "שדה חובה"); return; }
    if (!q.optional) { const err = q.validate(val); if (err) { setError(err); return; } }
    setError("");
    const newAnswers = { ...answers, [q.id]: val }; setAnswers(newAnswers);
    const newHistory = [...chatHistory, { type: "user" as const, content: val || "(דילגתי)" }];
    setCurrentAnswer("");
    if (currentQ < QUESTIONS.length - 1) {
      setChatHistory([...newHistory, { type: "ai", content: QUESTIONS[currentQ + 1].question }]);
      setCurrentQ(currentQ + 1);
    } else {
      setChatHistory([...newHistory, { type: "ai", content: "🎉 מעולה! בונה לך דף מושלם..." }]);
      setTimeout(() => buildPage(newAnswers), 1000);
    }
  }

  async function buildPage(data: Record<string, string>) {
    setPhase("building");
    for (const step of BUILD_STEPS) { setBuildStep(step); await new Promise((r) => setTimeout(r, 800)); }
    try {
      const res = await fetch("/api/ai/build-landing-page", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id, wizardData: { ...data, businessName: client.name, industry: client.industry } }),
      });
      const result = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !result.ok) { setBuildStep(result.error ?? "שגיאה — נסה שוב"); return; }
      setPhase("preview");
    } catch { setBuildStep("שגיאת חיבור"); }
  }

  async function publishPage() {
    await fetch(`/api/clients/${client.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pagePublished: true }) });
    setPhase("published");
    setChatHistory((p) => [...p, { type: "ai", content: `🎉 הדף שלך חי!\n\n🌐 ${pageUrl}\n\nשתף עם הלקוחות שלך!` }]);
  }

  function copyUrl() { navigator.clipboard.writeText(pageUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }

  const q = QUESTIONS[currentQ];

  return (
    <div className="flex h-screen" dir="rtl">
      {/* Chat panel */}
      <div className="w-[400px] bg-white border-l border-slate-200 flex flex-col flex-shrink-0">
        <div className="px-4 py-3.5 text-white bg-gradient-to-l from-slate-900 to-blue-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-sm font-bold">AI</div>
            <div><p className="font-bold text-sm">בניית הדף שלי</p><p className="text-xs text-blue-200">{client.name}</p></div>
          </div>
          {phase === "briefing" && (
            <div className="mt-2.5">
              <div className="flex justify-between text-[11px] opacity-80 mb-1"><span>שאלה {currentQ + 1}/{QUESTIONS.length}</span><span>{Math.round(((currentQ + 1) / QUESTIONS.length) * 100)}%</span></div>
              <div className="h-1 bg-white/20 rounded-full"><div className="h-full bg-blue-400 rounded-full transition-all duration-300" style={{ width: `${((currentQ + 1) / QUESTIONS.length) * 100}%` }} /></div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 sidebar-scroll">
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.type === "user" ? "justify-start" : "justify-end"}`}>
              {msg.type === "ai" && <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0">AI</div>}
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${msg.type === "ai" ? "bg-slate-50 text-slate-800 border border-slate-100 rounded-bl-sm" : "bg-blue-600 text-white rounded-br-sm"}`}>{msg.content}</div>
            </div>
          ))}
          {q?.tip && phase === "briefing" && <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-800">{q.tip}</div>}
          <div ref={chatEndRef} />
        </div>

        {phase === "briefing" && (
          <div className="border-t border-slate-200 p-3 space-y-2">
            {error && <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-600">{error}</div>}
            {q.type === "textarea" && <textarea value={currentAnswer} onChange={(e) => setCurrentAnswer(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitAnswer(); } }} placeholder={q.placeholder} rows={3} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-150" />}
            {q.type === "text" && <input value={currentAnswer} onChange={(e) => setCurrentAnswer(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submitAnswer(); }} placeholder={q.placeholder} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-150" />}
            {(q.type === "select" || q.type === "multiselect") && (
              <div className="flex flex-wrap gap-1.5">
                {q.options?.map((opt) => {
                  const sel = q.type === "multiselect" ? (currentAnswer || "").split(",").filter(Boolean).includes(opt) : currentAnswer === opt;
                  return <button key={opt} onClick={() => { if (q.type === "multiselect") { const a = (currentAnswer || "").split(",").filter(Boolean); setCurrentAnswer(sel ? a.filter((x) => x !== opt).join(",") : [...a, opt].join(",")); } else setCurrentAnswer(opt); }} className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-150 ${sel ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>{sel && "✓ "}{opt}</button>;
                })}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={submitAnswer} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors shadow-sm active:scale-[0.97]">{currentQ < QUESTIONS.length - 1 ? "הבא" : "בנה!"}</button>
              {q.optional && <button onClick={() => { setCurrentAnswer(""); submitAnswer(); }} className="px-4 border border-slate-200 rounded-xl text-xs text-slate-500 hover:bg-slate-50 transition-colors">דלג</button>}
            </div>
          </div>
        )}
        {phase === "building" && <div className="p-4 text-center"><Loader2 size={20} className="animate-spin text-blue-600 mx-auto mb-2" /><p className="text-sm font-medium text-blue-600">{buildStep}</p></div>}
        {phase === "preview" && (
          <div className="border-t border-slate-200 p-3 space-y-2">
            <p className="text-xs text-slate-500">רוצה לשנות?</p>
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={() => { setPhase("briefing"); setCurrentQ(0); setChatHistory([{ type: "ai", content: QUESTIONS[0].question }]); }} className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors">בנה מחדש</button>
            </div>
            <button onClick={publishPage} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm active:scale-[0.97]">פרסם!</button>
          </div>
        )}
        {phase === "published" && (
          <div className="border-t border-slate-200 p-4 space-y-3 text-center">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto"><Check size={20} className="text-emerald-600" /></div>
            <p className="text-xs font-mono text-slate-500" dir="ltr">{pageUrl}</p>
            <div className="flex gap-2">
              <button onClick={copyUrl} className="flex-1 flex items-center justify-center gap-1 bg-slate-100 rounded-xl py-2 text-xs font-medium hover:bg-slate-200 transition-colors">{copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "הועתק!" : "העתק"}</button>
              <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`הדף שלי מוכן! ${pageUrl}`)}`, "_blank")} className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 text-white rounded-xl py-2 text-xs font-medium hover:bg-emerald-700 transition-colors"><Share2 size={12} /> שתף</button>
            </div>
            <a href={`/client/${client.slug}`} className="block text-xs text-blue-600 hover:underline">חזור לפורטל</a>
          </div>
        )}
      </div>

      {/* Preview with scale transform */}
      <div className="flex-1 bg-slate-50 flex flex-col min-w-0">
        <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
          <span className="text-sm font-semibold text-slate-700">תצוגה מקדימה</span>
          <div className="flex gap-1.5">
            <div className="flex bg-slate-100 rounded-xl p-0.5">
              <button onClick={() => setMobileView(true)} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${mobileView ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                <Smartphone size={12} /> נייד
              </button>
              <button onClick={() => setMobileView(false)} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${!mobileView ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                <Monitor size={12} /> מחשב
              </button>
            </div>
            {(phase === "preview" || phase === "published") && (
              <a href={pageUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 rounded-xl text-xs text-slate-600 font-medium hover:bg-slate-200 transition-colors">
                <ExternalLink size={11} /> פתח
              </a>
            )}
          </div>
        </div>
        <div ref={previewContainerRef} className="flex-1 flex items-start justify-center overflow-hidden p-4">
          {phase === "briefing" ? (
            <div className="text-center text-slate-400 mt-24">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Monitor size={28} className="text-slate-300" /></div>
              <p className="text-base font-medium text-slate-500">הדף יופיע כאן</p>
              <p className="text-sm mt-1">ענה על השאלות בצד ימין</p>
            </div>
          ) : phase === "building" ? (
            <div className="text-center text-blue-600 mt-24"><Loader2 size={40} className="animate-spin mx-auto mb-4" /><p className="text-lg font-bold">{buildStep}</p></div>
          ) : (
            <div
              className="bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-200 transition-all duration-300"
              style={{
                width: mobileView ? 390 : 1440,
                height: 900,
                transform: `scale(${previewScale})`,
                transformOrigin: "top center",
              }}
            >
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 border-b border-slate-200">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 bg-white rounded-lg px-3 py-1 text-[10px] text-slate-400 font-mono truncate" dir="ltr">{pageUrl}</div>
              </div>
              <iframe src={`${pageUrl}?t=${Date.now()}`} className="w-full border-none" style={{ height: "calc(100% - 32px)" }} title="Preview" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
