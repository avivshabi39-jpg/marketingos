"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Client {
  id: string;
  name: string;
}

interface Props {
  clients: Client[];
  defaultClientId?: string;
}

const WORKFLOW_TYPES = [
  { value: "EMAIL",        label: "אימייל" },
  { value: "SMS",          label: "SMS" },
  { value: "WEBHOOK",      label: "Webhook" },
  { value: "NOTIFICATION", label: "התראה" },
  { value: "OTHER",        label: "אחר" },
];

const WORKFLOW_STATUSES = [
  { value: "DRAFT",  label: "טיוטה" },
  { value: "ACTIVE", label: "פעיל" },
  { value: "PAUSED", label: "מושהה" },
  { value: "ERROR",  label: "שגיאה" },
];

const TRIGGER_SUGGESTIONS = [
  "ליד חדש נוצר",
  "טופס קבלה הוגש",
  "סטטוס ליד השתנה",
  "ידני",
  "מתוזמן",
  "Webhook התקבל",
];

export function CreateWorkflowForm({ clients, defaultClientId }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    name:        "",
    type:        "EMAIL",
    status:      "DRAFT",
    trigger:     "",
    destination: "",
    webhookUrl:  "",
    notes:       "",
    clientId:    defaultClientId ?? clients[0]?.id ?? "",
  });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        webhookUrl: form.type === "WEBHOOK" ? form.webhookUrl || undefined : undefined,
      }),
    });

    if (res.ok) {
      router.push(`/admin/clients/${form.clientId}`);
    } else {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Failed to create workflow.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">

      <Input
        id="name"
        label="Workflow Name *"
        required
        placeholder="e.g. New Lead Welcome Email"
        value={form.name}
        onChange={(e) => set("name", e.target.value)}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="type" className="text-sm font-medium text-gray-700">Type *</label>
          <select
            id="type"
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {WORKFLOW_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-sm font-medium text-gray-700">Status</label>
          <select
            id="status"
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {WORKFLOW_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {form.type === "WEBHOOK" && (
        <Input
          id="webhookUrl"
          label="Webhook URL *"
          type="url"
          required
          placeholder="https://hooks.example.com/..."
          value={form.webhookUrl}
          onChange={(e) => set("webhookUrl", e.target.value)}
        />
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="trigger" className="text-sm font-medium text-gray-700">Trigger</label>
        <input
          id="trigger"
          list="trigger-suggestions"
          value={form.trigger}
          onChange={(e) => set("trigger", e.target.value)}
          placeholder="e.g. Lead Created"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <datalist id="trigger-suggestions">
          {TRIGGER_SUGGESTIONS.map((t) => <option key={t} value={t} />)}
        </datalist>
      </div>

      <Input
        id="destination"
        label="Destination"
        placeholder="e.g. team@company.com or https://hooks.example.com/..."
        value={form.destination}
        onChange={(e) => set("destination", e.target.value)}
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="clientId" className="text-sm font-medium text-gray-700">Client *</label>
        <select
          id="clientId"
          required
          value={form.clientId}
          onChange={(e) => set("clientId", e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="" disabled>Select a client…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm font-medium text-gray-700">Notes</label>
        <textarea
          id="notes"
          rows={3}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Optional notes about this workflow…"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading}>Create Workflow</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
