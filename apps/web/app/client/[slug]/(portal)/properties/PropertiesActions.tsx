"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2, CheckCircle, Loader2 } from "lucide-react";

interface Props {
  propertyId: string;
  currentStatus: string;
  slug: string;
}

export function PropertiesActions({ propertyId, currentStatus, slug }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [selling, setSelling] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm("האם למחוק את הנכס לצמיתות?");
    if (!confirmed) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("שגיאה במחיקה");
      router.refresh();
    } catch {
      alert("שגיאה במחיקת הנכס. נסה שוב.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleMarkSold() {
    const confirmed = window.confirm("לסמן נכס זה כנמכר?");
    if (!confirmed) return;
    setSelling(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SOLD" }),
      });
      if (!res.ok) throw new Error("שגיאה בעדכון");
      router.refresh();
    } catch {
      alert("שגיאה בעדכון הסטטוס. נסה שוב.");
    } finally {
      setSelling(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5 justify-end">
      {currentStatus !== "SOLD" && (
        <button
          onClick={handleMarkSold}
          disabled={selling}
          title="סמן נמכר"
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {selling ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <CheckCircle size={12} />
          )}
          נמכר
        </button>
      )}
      <button
        onClick={handleDelete}
        disabled={deleting}
        title="מחק נכס"
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-colors"
      >
        {deleting ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Trash2 size={12} />
        )}
        מחק
      </button>
    </div>
  );
}
