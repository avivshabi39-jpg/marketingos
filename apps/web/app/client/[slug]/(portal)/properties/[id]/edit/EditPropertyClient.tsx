"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useCallback } from "react";
import {
  Save,
  Trash2,
  CheckCircle,
  Loader2,
  Sparkles,
  Upload,
  X,
  Image as ImageIcon,
  ChevronRight,
  Copy,
  ExternalLink,
  Plus,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

type PropertyType =
  | "APARTMENT"
  | "HOUSE"
  | "PENTHOUSE"
  | "GARDEN_APARTMENT"
  | "DUPLEX"
  | "STUDIO"
  | "COMMERCIAL"
  | "LAND";

type PropertyStatus = "AVAILABLE" | "UNDER_CONTRACT" | "SOLD" | "OFF_MARKET";

type LogEntry = { id: string; date: string; text: string };

interface PropertyData {
  id: string;
  title: string;
  description: string | null;
  price: number;
  rooms: number | null;
  floor: number | null;
  totalFloors: number | null;
  area: number | null;
  city: string;
  neighborhood: string | null;
  street: string | null;
  propertyType: string;
  status: string;
  images: string[];
  features: string[];
  isExclusive: boolean;
  isFeatured: boolean;
  clientId: string;
  published: boolean;
  privateNotes: string | null;
  marketingLog: LogEntry[];
}

interface Props {
  property: PropertyData;
  slug: string;
  appUrl?: string;
}

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "APARTMENT", label: "דירה" },
  { value: "HOUSE", label: "בית פרטי" },
  { value: "PENTHOUSE", label: "פנטהאוז" },
  { value: "GARDEN_APARTMENT", label: "דירת גן" },
  { value: "DUPLEX", label: "דופלקס" },
  { value: "STUDIO", label: "סטודיו" },
  { value: "COMMERCIAL", label: "מסחרי" },
  { value: "LAND", label: "קרקע" },
];

const PROPERTY_STATUSES: { value: PropertyStatus; label: string }[] = [
  { value: "AVAILABLE", label: "זמין" },
  { value: "UNDER_CONTRACT", label: "בתהליך" },
  { value: "SOLD", label: "נמכר" },
  { value: "OFF_MARKET", label: "לא בשוק" },
];

const FEATURES = [
  "מרפסת",
  "חניה",
  "מחסן",
  "מעלית",
  'ממ"ד',
  "גינה",
  "בריכה",
  "מיזוג",
  "שיפוץ חדש",
  "נוף לים",
];

function classNames(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const inputCls =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

interface UploadingFile {
  name: string;
  progress: "uploading" | "done" | "error";
  url?: string;
}

export function EditPropertyClient({ property, slug, appUrl = "" }: Props) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: property.title,
    description: property.description ?? "",
    price: String(property.price),
    rooms: property.rooms != null ? String(property.rooms) : "",
    floor: property.floor != null ? String(property.floor) : "",
    totalFloors: property.totalFloors != null ? String(property.totalFloors) : "",
    area: property.area != null ? String(property.area) : "",
    city: property.city,
    neighborhood: property.neighborhood ?? "",
    street: property.street ?? "",
    propertyType: property.propertyType as PropertyType,
    status: property.status as PropertyStatus,
    images: property.images as string[],
    features: property.features as string[],
    isExclusive: property.isExclusive,
    isFeatured: property.isFeatured,
    published: property.published,
    privateNotes: property.privateNotes ?? "",
  });

  const [marketingLog, setMarketingLog] = useState<LogEntry[]>(property.marketingLog ?? []);
  const [logEntry, setLogEntry] = useState("");
  const [addingLog, setAddingLog] = useState(false);

  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selling, setSelling] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  function update<K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function toggleFeature(feature: string) {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
  }

  async function uploadFile(file: File) {
    const entry: UploadingFile = { name: file.name, progress: "uploading" };
    setUploadingFiles((prev) => [...prev, entry]);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/client-upload", { method: "POST", body: fd });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "שגיאה");
      setUploadingFiles((prev) =>
        prev.map((f) => (f.name === file.name ? { ...f, progress: "done", url: data.url } : f))
      );
      update("images", [...formData.images, data.url]);
    } catch {
      setUploadingFiles((prev) =>
        prev.map((f) => (f.name === file.name ? { ...f, progress: "error" } : f))
      );
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    Array.from(e.target.files ?? []).forEach((file) => uploadFile(file));
    e.target.value = "";
  }

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      Array.from(e.dataTransfer.files)
        .filter((f) => f.type.startsWith("image/"))
        .forEach((file) => uploadFile(file));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [formData.images]
  );

  function removeImage(url: string) {
    update("images", formData.images.filter((i) => i !== url));
    setUploadingFiles((prev) => prev.filter((f) => f.url !== url));
  }

  async function generateAiDescription() {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/property-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          city: formData.city,
          neighborhood: formData.neighborhood,
          rooms: formData.rooms ? Number(formData.rooms) : undefined,
          area: formData.area ? Number(formData.area) : undefined,
          floor: formData.floor ? Number(formData.floor) : undefined,
          totalFloors: formData.totalFloors ? Number(formData.totalFloors) : undefined,
          propertyType: formData.propertyType,
          price: formData.price ? Number(formData.price) : undefined,
          features: formData.features,
        }),
      });
      const data = await res.json() as { description?: string };
      if (data.description) update("description", data.description);
    } catch {
      // silent
    } finally {
      setAiLoading(false);
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "כותרת היא שדה חובה";
    if (!formData.city.trim()) newErrors.city = "עיר היא שדה חובה";
    if (!formData.price.trim()) newErrors.price = "מחיר הוא שדה חובה";
    else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0)
      newErrors.price = "מחיר לא תקין";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const body = {
        title: formData.title,
        description: formData.description || undefined,
        price: Number(formData.price),
        city: formData.city,
        propertyType: formData.propertyType,
        status: formData.status,
        neighborhood: formData.neighborhood || undefined,
        street: formData.street || undefined,
        rooms: formData.rooms ? Number(formData.rooms) : undefined,
        floor: formData.floor ? Number(formData.floor) : undefined,
        totalFloors: formData.totalFloors ? Number(formData.totalFloors) : undefined,
        area: formData.area ? Number(formData.area) : undefined,
        features: formData.features,
        images: formData.images,
        isExclusive: formData.isExclusive,
        isFeatured: formData.isFeatured,
        published: formData.published,
        privateNotes: formData.privateNotes || undefined,
      };
      const res = await fetch(`/api/properties/${property.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("שגיאה בשמירה");
      router.refresh();
      router.push(`/client/${slug}/properties`);
    } catch {
      alert("שגיאה בשמירת השינויים. נסה שוב.");
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkSold() {
    const confirmed = window.confirm("לסמן נכס זה כנמכר?");
    if (!confirmed) return;
    setSelling(true);
    try {
      const res = await fetch(`/api/properties/${property.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SOLD" }),
      });
      if (!res.ok) throw new Error("שגיאה");
      update("status", "SOLD");
      router.refresh();
    } catch {
      alert("שגיאה בעדכון. נסה שוב.");
    } finally {
      setSelling(false);
    }
  }

  async function addLogEntry() {
    if (!logEntry.trim()) return;
    setAddingLog(true);
    try {
      const res = await fetch(`/api/properties/${property.id}/marketing-log`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entry: logEntry.trim() }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json() as { marketingLog: LogEntry[] };
      setMarketingLog(data.marketingLog);
      setLogEntry("");
    } catch {
      toast.error("שגיאה בשמירת הרשומה");
    } finally {
      setAddingLog(false);
    }
  }

  async function deleteLogEntry(entryId: string) {
    try {
      const res = await fetch(`/api/properties/${property.id}/marketing-log`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteId: entryId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json() as { marketingLog: LogEntry[] };
      setMarketingLog(data.marketingLog);
    } catch {
      toast.error("שגיאה במחיקת הרשומה");
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "האם אתה בטוח שברצונך למחוק את הנכס לצמיתות? פעולה זו אינה ניתנת לביטול."
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/properties/${property.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("שגיאה במחיקה");
      router.push(`/client/${slug}/properties`);
    } catch {
      alert("שגיאה במחיקה. נסה שוב.");
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/client/${slug}/properties`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ChevronRight size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">עריכת נכס</h1>
            <p className="text-slate-400 text-sm mt-0.5 truncate max-w-xs">{property.title}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {formData.status !== "SOLD" && (
            <button
              type="button"
              onClick={handleMarkSold}
              disabled={selling}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50 transition-colors border border-green-200"
            >
              {selling ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              <span className="hidden sm:inline">סמן נמכר</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-colors border border-red-200"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            <span className="hidden sm:inline">מחק נכס</span>
          </button>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">

        {/* ── Basic info ── */}
        <section className="space-y-5">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
            פרטי הנכס
          </h2>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              כותרת <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => update("title", e.target.value)}
              className={classNames(inputCls, errors.title ? "border-red-400" : "")}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Property type + status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">סוג נכס</label>
              <select
                value={formData.propertyType}
                onChange={(e) => update("propertyType", e.target.value as PropertyType)}
                className={inputCls}
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">סטטוס</label>
              <select
                value={formData.status}
                onChange={(e) => update("status", e.target.value as PropertyStatus)}
                className={inputCls}
              >
                {PROPERTY_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* City + Neighborhood */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                עיר <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => update("city", e.target.value)}
                className={classNames(inputCls, errors.city ? "border-red-400" : "")}
              />
              {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">שכונה</label>
              <input
                type="text"
                value={formData.neighborhood}
                onChange={(e) => update("neighborhood", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Street */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">רחוב</label>
            <input
              type="text"
              value={formData.street}
              onChange={(e) => update("street", e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              מחיר (₪) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => update("price", e.target.value)}
              min={0}
              className={classNames(inputCls, errors.price ? "border-red-400" : "")}
            />
            {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
          </div>

          {/* Rooms + Area */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">חדרים</label>
              <input
                type="number"
                value={formData.rooms}
                onChange={(e) => update("rooms", e.target.value)}
                min={0}
                step={0.5}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                שטח (מ&quot;ר)
              </label>
              <input
                type="number"
                value={formData.area}
                onChange={(e) => update("area", e.target.value)}
                min={0}
                className={inputCls}
              />
            </div>
          </div>

          {/* Floor + Total floors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">קומה</label>
              <input
                type="number"
                value={formData.floor}
                onChange={(e) => update("floor", e.target.value)}
                min={0}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                סה&quot;כ קומות
              </label>
              <input
                type="number"
                value={formData.totalFloors}
                onChange={(e) => update("totalFloors", e.target.value)}
                min={0}
                className={inputCls}
              />
            </div>
          </div>

          {/* Features */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">מאפיינים</label>
            <div className="flex flex-wrap gap-2">
              {FEATURES.map((feature) => {
                const selected = formData.features.includes(feature);
                return (
                  <button
                    key={feature}
                    type="button"
                    onClick={() => toggleFeature(feature)}
                    className={classNames(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                      selected
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600"
                    )}
                  >
                    {feature}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Exclusive + Featured */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isExclusive}
                onChange={(e) => update("isExclusive", e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">בלעדי</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => update("isFeatured", e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">מומלץ</span>
            </label>
          </div>
        </section>

        {/* ── Images ── */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
            תמונות
          </h2>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={classNames(
              "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
              dragging
                ? "border-blue-500 bg-blue-50"
                : "border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/40"
            )}
          >
            <Upload size={22} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">
              גרור תמונות לכאן או{" "}
              <span className="text-blue-600 underline">לחץ לבחירה</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Image grid */}
          {(formData.images.length > 0 || uploadingFiles.some((f) => f.progress === "uploading")) && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {formData.images.map((url) => (
                <div key={url} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt="תמונת נכס"
                    className="w-full aspect-square object-cover rounded-lg border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    className="absolute top-1 left-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {uploadingFiles
                .filter((f) => f.progress === "uploading" || f.progress === "error")
                .map((f) => (
                  <div
                    key={f.name}
                    className={classNames(
                      "w-full aspect-square rounded-lg border flex flex-col items-center justify-center gap-1.5",
                      f.progress === "error" ? "border-red-200 bg-red-50" : "border-slate-200 bg-slate-50"
                    )}
                  >
                    {f.progress === "uploading" ? (
                      <Loader2 size={20} className="text-blue-500 animate-spin" />
                    ) : (
                      <>
                        <ImageIcon size={20} className="text-red-400" />
                        <span className="text-xs text-red-500">שגיאה</span>
                      </>
                    )}
                  </div>
                ))}
            </div>
          )}
        </section>

        {/* ── Description ── */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
            תיאור
          </h2>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-slate-700">תיאור הנכס</label>
              <button
                type="button"
                onClick={generateAiDescription}
                disabled={aiLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 disabled:opacity-60 transition-all shadow-sm"
              >
                {aiLoading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Sparkles size={12} />
                )}
                {aiLoading ? "מייצר..." : "✨ צור תיאור אוטומטי"}
              </button>
            </div>
            <textarea
              value={formData.description}
              onChange={(e) => update("description", e.target.value)}
              rows={6}
              placeholder="תיאור מפורט של הנכס..."
              className={inputCls}
            />
          </div>
        </section>

        {/* ── Private notes ── */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
            📝 הערות פנימיות
          </h2>
          <p className="text-xs text-slate-400">רק אתה רואה את זה — כתוב ניסיונות שיווק, מה עבד, מה לא</p>
          <textarea
            value={formData.privateNotes}
            onChange={(e) => update("privateNotes", e.target.value)}
            rows={3}
            placeholder="לדוגמה: דיברתי עם קונה מרוצה, מחיר גבוה מדי לשוק..."
            className={inputCls}
          />
        </section>

        {/* ── Publish settings ── */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
            פרסום
          </h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.published}
              onChange={(e) => update("published", e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">פרסם באתר שלי מיד</span>
          </label>

          {formData.published && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-green-800 text-sm">✅ הנכס פורסם באתר שלך</p>
                <p className="text-xs text-slate-500 mt-0.5 break-all">
                  {appUrl}/client/{slug}/properties/{property.id}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${appUrl}/client/${slug}/properties/${property.id}`);
                    toast.success("קישור הועתק!");
                  }}
                  className="flex items-center gap-1 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 hover:border-slate-300 transition"
                >
                  <Copy size={11} /> העתק
                </button>
                <a
                  href={`/client/${slug}/properties/${property.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5 hover:bg-blue-100 transition"
                >
                  <ExternalLink size={11} /> צפה
                </a>
              </div>
            </div>
          )}
        </section>

        {/* ── Marketing log ── */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
            📝 יומן שיווק (רק אתה רואה)
          </h2>

          {/* Add entry */}
          <div className="flex gap-2">
            <input
              value={logEntry}
              onChange={(e) => setLogEntry(e.target.value)}
              placeholder="לדוגמה: פורסם ביד2, שינוי מחיר ל-1.2M..."
              className={`${inputCls} flex-1`}
              onKeyDown={(e) => e.key === "Enter" && !addingLog && addLogEntry()}
            />
            <button
              type="button"
              onClick={addLogEntry}
              disabled={addingLog || !logEntry.trim()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition flex-shrink-0"
            >
              {addingLog ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            </button>
          </div>

          {/* Log entries */}
          {marketingLog.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">אין רשומות עדיין</p>
          ) : (
            <div className="space-y-2">
              {marketingLog.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 bg-slate-50 rounded-lg px-3 py-2.5 group"
                >
                  <span className="text-base flex-shrink-0">📌</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400 mb-0.5">
                      {new Date(entry.date).toLocaleDateString("he-IL")}
                    </p>
                    <p className="text-sm text-slate-700">{entry.text}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteLogEntry(entry.id)}
                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Save button ── */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <Link
            href={`/client/${slug}/properties`}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            ביטול
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            שמור שינויים
          </button>
        </div>
      </div>
    </div>
  );
}
