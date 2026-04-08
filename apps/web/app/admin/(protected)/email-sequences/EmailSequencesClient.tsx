"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Mail, Plus, Trash2, ToggleLeft, ToggleRight, Loader2, Check } from "lucide-react";

const TRIGGER_LABELS: Record<string, string> = {
  new_lead: "ליד חדש",
  won_lead: "ליד שנסגר",
  no_reply_3days: "ללא תגובה 3 ימים",
};

const TRIGGER_OPTIONS = Object.entries(TRIGGER_LABELS);
const DELAY_OPTIONS = [0, 1, 2, 3, 7, 14, 30];

type Step = {
  id: string;
  delayDays: number;
  subject: string;
  body: string;
};

type Sequence = {
  id: string;
  name: string;
  trigger: string;
  isActive: boolean;
  steps: Step[];
  client: { name: string; primaryColor: string };
  clientId: string;
};

type ClientItem = {
  id: string;
  name: string;
  primaryColor: string;
};

function makeStep(): Step {
  return { id: Math.random().toString(36).slice(2), delayDays: 1, subject: "", body: "" };
}

function rawToStep(raw: Record<string, unknown>): Step {
  return {
    id: (raw.id as string) ?? Math.random().toString(36).slice(2),
    delayDays: (raw.delay_days as number) ?? (raw.delayDays as number) ?? 0,
    subject: (raw.subject as string) ?? "",
    body: (raw.body as string) ?? "",
  };
}

function stepToRaw(s: Step) {
  return { id: s.id, delay_days: s.delayDays, subject: s.subject, body: s.body };
}

interface Props {
  clients: ClientItem[];
  initialClientId?: string;
}

export function EmailSequencesClient({ clients, initialClientId }: Props) {
  const [selectedClientId, setSelectedClientId] = useState(initialClientId ?? clients[0]?.id ?? "");
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingSeqs, setLoadingSeqs] = useState(false);
  const [generatingStep, setGeneratingStep] = useState<number | null>(null);

  // Create dialog state
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTrigger, setNewTrigger] = useState("new_lead");
  const [creating, setCreating] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch sequences when client changes
  const fetchSequences = useCallback(async (clientId: string) => {
    if (!clientId) return;
    setLoadingSeqs(true);
    try {
      const res = await fetch(`/api/email-sequences?clientId=${clientId}`);
      if (res.ok) {
        const data = await res.json();
        const seqs: Sequence[] = (data.sequences ?? []).map((s: Record<string, unknown>) => ({
          id: s.id as string,
          name: s.name as string,
          trigger: s.trigger as string,
          isActive: s.isActive as boolean,
          clientId: s.clientId as string,
          client: s.client as { name: string; primaryColor: string },
          steps: ((s.steps as Record<string, unknown>[]) ?? []).map(rawToStep),
        }));
        setSequences(seqs);
      }
    } finally {
      setLoadingSeqs(false);
    }
  }, []);

  useEffect(() => {
    fetchSequences(selectedClientId);
    setSelectedId(null);
  }, [selectedClientId, fetchSequences]);

  // When a sequence is selected, load its steps
  function selectSequence(seq: Sequence) {
    setSelectedId(seq.id);
    setSteps(seq.steps.length > 0 ? seq.steps : []);
    setSaved(false);
  }

  const selectedSeq = sequences.find((s) => s.id === selectedId) ?? null;

  // Debounced save
  const scheduleSave = useCallback(
    (seqId: string, updatedSteps: Step[]) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaved(false);
      saveTimer.current = setTimeout(async () => {
        setSaving(true);
        try {
          await fetch(`/api/email-sequences/${seqId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ steps: updatedSteps.map(stepToRaw) }),
          });
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        } finally {
          setSaving(false);
        }
      }, 500);
    },
    []
  );

  function updateStep(index: number, field: keyof Step, value: string | number) {
    if (!selectedId) return;
    const updated = steps.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    );
    setSteps(updated);
    scheduleSave(selectedId, updated);
  }

  function addStep() {
    if (!selectedId) return;
    const updated = [...steps, makeStep()];
    setSteps(updated);
    scheduleSave(selectedId, updated);
  }

  function deleteStep(index: number) {
    if (!selectedId) return;
    const updated = steps.filter((_, i) => i !== index);
    setSteps(updated);
    scheduleSave(selectedId, updated);
  }

  async function toggleActive(seq: Sequence) {
    const res = await fetch(`/api/email-sequences/${seq.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !seq.isActive }),
    });
    if (res.ok) {
      setSequences((prev) =>
        prev.map((s) => (s.id === seq.id ? { ...s, isActive: !s.isActive } : s))
      );
    }
  }

  async function deleteSequence(id: string) {
    if (!confirm("למחוק את הרצף?")) return;
    await fetch(`/api/email-sequences/${id}`, { method: "DELETE" });
    setSequences((prev) => prev.filter((s) => s.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  async function createSequence() {
    if (!newName.trim() || !selectedClientId) return;
    setCreating(true);
    try {
      const res = await fetch("/api/email-sequences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId,
          name: newName.trim(),
          trigger: newTrigger,
          steps: [],
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setNewName("");
        setNewTrigger("new_lead");
        await fetchSequences(selectedClientId);
      }
    } finally {
      setCreating(false);
    }
  }

  async function generateAiStep(index: number) {
    if (!selectedSeq) return;
    setGeneratingStep(index);
    try {
      const res = await fetch("/api/ai/email-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepIndex: index + 1,
          trigger: selectedSeq.trigger,
          clientName: selectedSeq.client.name,
          delayDays: steps[index].delayDays,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.subject || data.body) {
          const updated = steps.map((s, i) =>
            i === index
              ? { ...s, subject: data.subject ?? s.subject, body: data.body ?? s.body }
              : s
          );
          setSteps(updated);
          if (selectedId) scheduleSave(selectedId, updated);
        }
      }
    } finally {
      setGeneratingStep(null);
    }
  }

  return (
    <div className="flex gap-6 min-h-[calc(100vh-120px)]" dir="rtl">
      {/* ── LEFT PANEL: Sequence list ── */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 text-sm">רצפי מייל</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={13} /> חדש
          </button>
        </div>

        {/* Client filter */}
        {clients.length > 1 && (
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}

        {/* Sequence cards */}
        <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
          {loadingSeqs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-slate-400" />
            </div>
          ) : sequences.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-200 flex flex-col items-center py-12 text-center">
              <Mail size={28} className="text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">אין רצפי מייל</p>
              <p className="text-xs text-slate-300 mt-1">צור ראשון ↑</p>
            </div>
          ) : (
            sequences.map((seq) => (
              <div
                key={seq.id}
                onClick={() => selectSequence(seq)}
                className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${
                  selectedId === seq.id
                    ? "border-blue-400 shadow-md ring-1 ring-blue-200"
                    : "border-slate-100 hover:border-slate-200 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{seq.name}</p>
                    <span className="inline-block mt-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      {TRIGGER_LABELS[seq.trigger] ?? seq.trigger}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">{seq.steps.length} שלבים</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleActive(seq); }}
                      className="text-slate-400 hover:text-blue-600 transition-colors"
                      title={seq.isActive ? "כבה" : "הפעל"}
                    >
                      {seq.isActive
                        ? <ToggleRight size={20} className="text-green-500" />
                        : <ToggleLeft size={20} />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSequence(seq.id); }}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: Step Builder ── */}
      <div className="flex-1 min-w-0">
        {!selectedSeq ? (
          <div className="h-full bg-white rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center py-24">
            <Mail size={40} className="text-slate-200 mb-3" />
            <p className="text-slate-400 text-sm">בחר רצף לעריכה</p>
            <p className="text-slate-300 text-xs mt-1">או צור רצף חדש</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            {/* Builder header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-900">{selectedSeq.name}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                {saving && <><Loader2 size={13} className="animate-spin" /> שומר...</>}
                {saved && !saving && <><Check size={13} className="text-green-500" /> נשמר</>}
              </div>
            </div>

            {/* Trigger pill */}
            <div
              className="inline-flex items-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-xl mb-0"
              style={{ background: "#6366f1" }}
            >
              🚀 {TRIGGER_LABELS[selectedSeq.trigger] ?? selectedSeq.trigger}
            </div>

            {/* Steps */}
            {steps.map((step, index) => (
              <div key={step.id}>
                {/* Delay connector */}
                <div className="flex flex-col items-start pr-5 my-1">
                  <div className="w-px h-4 bg-slate-200 mr-[9px]" />
                  <select
                    value={step.delayDays}
                    onChange={(e) => updateStep(index, "delayDays", Number(e.target.value))}
                    className="border border-slate-200 rounded-xl px-2 py-1 text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-300"
                  >
                    {DELAY_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d === 0 ? "מיידי" : `אחרי ${d} ימים`}
                      </option>
                    ))}
                  </select>
                  <div className="w-px h-4 bg-slate-200 mr-[9px]" />
                </div>

                {/* Email step card */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-slate-700 text-sm">📧 שלב {index + 1}</span>
                    <button
                      onClick={() => deleteStep(index)}
                      className="text-slate-300 hover:text-red-500 transition-colors text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>

                  <label className="text-xs text-slate-400 block mb-1">נושא המייל</label>
                  <input
                    value={step.subject}
                    onChange={(e) => updateStep(index, "subject", e.target.value)}
                    placeholder="נושא המייל..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />

                  <label className="text-xs text-slate-400 block mb-1">תוכן המייל</label>
                  <textarea
                    value={step.body}
                    onChange={(e) => updateStep(index, "body", e.target.value)}
                    placeholder={`תוכן המייל... השתמש ב-{name} {phone}`}
                    rows={4}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />

                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => generateAiStep(index)}
                      disabled={generatingStep === index}
                      className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-1.5 transition disabled:opacity-60"
                    >
                      {generatingStep === index
                        ? <><Loader2 size={11} className="animate-spin" /> מייצר...</>
                        : <>✨ AI כתוב מייל</>}
                    </button>
                    <span className="text-xs text-slate-300">
                      {"{name}"} {"{phone}"} {"{businessName}"}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Add step */}
            <div className={steps.length > 0 ? "mt-4" : "mt-4"}>
              {steps.length > 0 && (
                <div className="w-px h-4 bg-slate-200 mr-[9px] mb-1" />
              )}
              <button
                onClick={addStep}
                className="w-full border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 rounded-xl py-3 text-sm text-slate-400 hover:text-blue-500 transition-all"
              >
                + הוסף שלב
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Create dialog ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCreate(false)}>
          <div
            className="bg-white rounded-2xl shadow-xl p-6 w-96"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-slate-900 mb-4">רצף מייל חדש</h3>

            <label className="text-xs text-slate-500 block mb-1">שם הרצף</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="לדוגמה: ברוכים הבאים"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && createSequence()}
            />

            <label className="text-xs text-slate-500 block mb-1">טריגר</label>
            <select
              value={newTrigger}
              onChange={(e) => setNewTrigger(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {TRIGGER_OPTIONS.map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                onClick={createSequence}
                disabled={creating || !newName.trim()}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating ? <Loader2 size={14} className="animate-spin" /> : null}
                צור רצף
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg transition"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
