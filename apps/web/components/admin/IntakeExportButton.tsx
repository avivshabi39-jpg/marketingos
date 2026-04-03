"use client";

export type IntakeFormExport = {
  id: string;
  fullName: string;
  businessName: string;
  email: string;
  phone: string | null;
  preferredContact: string | null;
  businessType: string | null;
  targetAudience: string | null;
  operatingAreas: string | null;
  uniqueSellingPoint: string | null;
  projectType: string | null;
  mainGoal: string | null;
  description: string | null;
  painPoints: string | null;
  marketingChannels: string | null;
  budgetRange: string | null;
  goals: string | null;
  notes: string | null;
  createdAt: string;
};

const HEADERS: Array<[keyof IntakeFormExport, string]> = [
  ["fullName",           "Full Name"],
  ["businessName",       "Business Name"],
  ["email",              "Email"],
  ["phone",              "Phone"],
  ["preferredContact",   "Preferred Contact"],
  ["businessType",       "Business Type"],
  ["targetAudience",     "Target Audience"],
  ["operatingAreas",     "Operating Areas"],
  ["uniqueSellingPoint", "Unique Selling Point"],
  ["projectType",        "Project Type"],
  ["mainGoal",           "Main Goal"],
  ["description",        "Description"],
  ["painPoints",         "Pain Points"],
  ["marketingChannels",  "Marketing Channels"],
  ["budgetRange",        "Budget Range"],
  ["goals",              "Goals"],
  ["notes",              "Notes"],
  ["createdAt",          "Submitted At"],
];

function escapeCSV(val: string | null | undefined): string {
  if (val == null) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCSV(forms: IntakeFormExport[]): string {
  const headerRow = HEADERS.map(([, label]) => label).join(",");
  const rows = forms.map((f) =>
    HEADERS.map(([key]) => escapeCSV(f[key] as string | null)).join(",")
  );
  return [headerRow, ...rows].join("\n");
}

function download(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface Props {
  forms: IntakeFormExport[];
  clientName: string;
}

export function IntakeExportButton({ forms, clientName }: Props) {
  if (forms.length === 0) return null;

  const slug = clientName.toLowerCase().replace(/\s+/g, "-");

  function exportCSV() {
    download(toCSV(forms), `${slug}-intake-forms.csv`, "text/csv;charset=utf-8;");
  }

  function exportJSON() {
    download(JSON.stringify(forms, null, 2), `${slug}-intake-forms.json`, "application/json");
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={exportCSV}
        className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded px-2 py-1 hover:border-gray-400 transition-colors"
        title="Download as CSV spreadsheet"
      >
        ↓ CSV
      </button>
      <button
        onClick={exportJSON}
        className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded px-2 py-1 hover:border-gray-400 transition-colors"
        title="Download as JSON"
      >
        ↓ JSON
      </button>
    </div>
  );
}
