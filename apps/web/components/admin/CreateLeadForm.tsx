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
}

const SOURCE_OPTIONS = [
  { value: "manual", label: "Manual entry" },
  { value: "phone_call", label: "Phone call" },
  { value: "referral", label: "Referral" },
  { value: "walk_in", label: "Walk-in" },
  { value: "email", label: "Email" },
  { value: "other", label: "Other" },
];

export function CreateLeadForm({ clients }: Props) {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    source: "manual",
    clientId: clients[0]?.id ?? "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email || undefined,
        phone: form.phone || undefined,
        source: form.source,
        clientId: form.clientId,
      }),
    });

    if (res.ok) {
      router.push(`/admin/clients/${form.clientId}`);
    } else {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Failed to create lead.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div className="grid grid-cols-2 gap-4">
        <Input
          id="firstName"
          label="First Name"
          required
          value={form.firstName}
          onChange={(e) => set("firstName", e.target.value)}
        />
        <Input
          id="lastName"
          label="Last Name"
          required
          value={form.lastName}
          onChange={(e) => set("lastName", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="email"
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
        />
        <Input
          id="phone"
          label="Phone"
          type="tel"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="source" className="text-sm font-medium text-slate-700">
          Source
        </label>
        <select
          id="source"
          value={form.source}
          onChange={(e) => set("source", e.target.value)}
          className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {SOURCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="clientId" className="text-sm font-medium text-slate-700">
          Client
        </label>
        <select
          id="clientId"
          required
          value={form.clientId}
          onChange={(e) => set("clientId", e.target.value)}
          className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="" disabled>Select a client…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading}>
          Create Lead
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
