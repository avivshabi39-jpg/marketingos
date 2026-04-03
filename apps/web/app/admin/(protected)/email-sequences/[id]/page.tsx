"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Loader2,
  Plus,
  Trash2,
  Save,
  Sparkles,
  ChevronDown,
  Mail,
} from "lucide-react";
import toast from "react-hot-toast";

type Step = {
  delay_days: number;
  subject: string;
  body: string;
};

type Sequence = {
  id: string;
  name: string;
  trigger: string;
  isActive: boolean;
  steps: Step[];
  client: { name: string; primaryColor: string | null };
};

const TRIGGER_LABELS: Record<string, string> = {
  new_lead: "ליד חדש",
  won_lead: "ליד שנסגר",
  no_reply_3days: "ללא תגובה 3 ימים",
};

const DELAY_OPTIONS = [0, 1, 2, 3, 7, 14];

const VARIABLES = ["{name}", "{phone}", "{businessName}"];

function StepCard({
  step,
  index,
  onUpdate,
  onDelete,
  onAiWrite,
  aiLoading,
}: {
  step: Step;
  index: number;
  onUpdate: (idx: number, field: keyof Step, value: string | number) => void;
  onDelete: (idx: number) => void;
  onAiWrite: (idx: number) => void;
  aiLoading: boolean;
}) {
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  function insertVariable(variable: string) {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newVal = step.body.slice(0, start) + variable + step.body.slice(end);
    onUpdate(index, "body", newVal);
    // Restore cursor after React re-render
    requestAnimationFrame(() => {
      ta.setSelectionRange(start + variable.length, start + variable.length);
      ta.focus();
    });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Step header */}
      <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-700">שלב {index + 1}</span>
        <button
          onClick={() => onDelete(index)}
          className="text-gray-400 hover:text-red-500 transition"
          title="מחק שלב"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Delay */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-600 w-20 flex-shrink-0">עיכוב</label>
          <div className="relative">
            <select
              value={step.delay_days}
              onChange={(e) => onUpdate(index, "delay_days", Number(e.target.value))}
              className="border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 text-sm focus:ring-2 focus:ring-indigo-300 outline-none bg-white appearance-none"
            >
              {DELAY_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d === 0 ? "מיד" : `אחרי ${d} יום`}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute left-2 top-2.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">נושא</label>
          <input
            value={step.subject}
            onChange={(e) => onUpdate(index, "subject", e.target.value)}
            placeholder="נושא המייל..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
          />
        </div>

        {/* Body */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-600">תוכן</label>
            <button
              onClick={() => onAiWrite(index)}
              disabled={aiLoading}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 transition disabled:opacity-50"
            >
              {aiLoading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Sparkles size={12} />
              )}
              AI כתוב מייל
            </button>
          </div>
          <textarea
            ref={bodyRef}
            value={step.body}
            onChange={(e) => onUpdate(index, "body", e.target.value)}
            placeholder="תוכן המייל..."
            rows={4}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none resize-y min-h-[80px]"
          />
          {/* Variable chips */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-xs text-gray-400">הכנס:</span>
            {VARIABLES.map((v) => (
              <button
                key={v}
                onClick={() => insertVariable(v)}
                className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 hover:bg-indigo-100 transition font-mono"
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SequenceBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoadingStep, setAiLoadingStep] = useState<number | null>(null);

  // Local editable state
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/email-sequences/${id}`);
      if (!res.ok) { toast.error("לא נמצא הרצף"); router.push("/admin/email-sequences"); return; }
      const data = await res.json() as { sequence: Sequence };
      setSequence(data.sequence);
      setName(data.sequence.name);
      setIsActive(data.sequence.isActive);
      setSteps(data.sequence.steps ?? []);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  function updateStep(idx: number, field: keyof Step, value: string | number) {
    setSteps((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  }

  function deleteStep(idx: number) {
    setSteps((prev) => prev.filter((_, i) => i !== idx));
  }

  function addStep() {
    setSteps((prev) => [
      ...prev,
      { delay_days: 1, subject: "", body: "" },
    ]);
  }

  async function aiWriteStep(idx: number) {
    if (!sequence) return;
    setAiLoadingStep(idx);
    try {
      const res = await fetch("/api/ai/email-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trigger: sequence.trigger,
          stepNumber: idx + 1,
          subject: steps[idx].subject,
          clientName: sequence.client.name,
        }),
      });
      if (!res.ok) { toast.error("שגיאה ב-AI"); return; }
      const data = await res.json() as { body?: string };
      if (data.body) {
        updateStep(idx, "body", data.body);
        toast.success("הטקסט נוצר!");
      }
    } finally {
      setAiLoadingStep(null);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/email-sequences/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, isActive, steps }),
      });
      if (!res.ok) { toast.error("שגיאה בשמירה"); return; }
      toast.success("הרצף נשמר!");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={24} className="animate-spin text-gray-300" />
      </div>
    );
  }

  if (!sequence) return null;

  const triggerLabel = TRIGGER_LABELS[sequence.trigger] ?? sequence.trigger;

  return (
    <div className="max-w-2xl mx-auto space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/email-sequences"
          className="text-gray-400 hover:text-gray-600 transition"
        >
          <ArrowRight size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-xl font-bold text-gray-900 bg-transparent border-b-2 border-transparent focus:border-indigo-400 outline-none w-full py-0.5"
          />
          <p className="text-xs text-gray-400 mt-0.5">{sequence.client.name}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Active toggle */}
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <div
              onClick={() => setIsActive((v) => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${isActive ? "bg-indigo-500" : "bg-gray-200"}`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isActive ? "translate-x-5" : "translate-x-0.5"}`}
              />
            </div>
            {isActive ? "פעיל" : "כבוי"}
          </label>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            שמור
          </button>
        </div>
      </div>

      {/* Trigger card */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
        <Mail size={16} className="text-gray-400" />
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">טריגר</p>
          <p className="text-sm font-semibold text-gray-700">{triggerLabel}</p>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, idx) => (
          <div key={idx}>
            <StepCard
              step={step}
              index={idx}
              onUpdate={updateStep}
              onDelete={deleteStep}
              onAiWrite={aiWriteStep}
              aiLoading={aiLoadingStep === idx}
            />
            {idx < steps.length - 1 && (
              <div className="flex justify-center my-1">
                <div className="w-px h-6 bg-gray-200" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add step button */}
      <button
        onClick={addStep}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition"
      >
        <Plus size={16} /> + הוסף שלב
      </button>

      {/* Bottom save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          שמור רצף
        </button>
      </div>
    </div>
  );
}
