"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useCallback } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Upload,
  X,
  Sparkles,
  Loader2,
  Check,
  Image as ImageIcon,
} from "lucide-react";

interface Props {
  clientId: string;
  slug: string;
}

type PropertyType =
  | "APARTMENT"
  | "HOUSE"
  | "PENTHOUSE"
  | "GARDEN_APARTMENT"
  | "DUPLEX"
  | "STUDIO"
  | "COMMERCIAL"
  | "LAND";

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

interface FormData {
  propertyType: PropertyType;
  city: string;
  neighborhood: string;
  street: string;
  price: string;
  rooms: string;
  floor: string;
  totalFloors: string;
  area: string;
  features: string[];
  isExclusive: boolean;
  isFeatured: boolean;
  images: string[];
  title: string;
  description: string;
}

interface UploadingFile {
  name: string;
  progress: "uploading" | "done" | "error";
  url?: string;
}

const INITIAL_FORM: FormData = {
  propertyType: "APARTMENT",
  city: "",
  neighborhood: "",
  street: "",
  price: "",
  rooms: "",
  floor: "",
  totalFloors: "",
  area: "",
  features: [],
  isExclusive: false,
  isFeatured: false,
  images: [],
  title: "",
  description: "",
};

function classNames(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const inputCls =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

export function NewPropertyClient({ clientId, slug }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
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

  function validateStep1(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.city.trim()) newErrors.city = "עיר היא שדה חובה";
    if (!formData.price.trim()) newErrors.price = "מחיר הוא שדה חובה";
    else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0)
      newErrors.price = "מחיר לא תקין";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function validateStep3(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.title.trim()) newErrors.title = "כותרת היא שדה חובה";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleNextStep() {
    if (step === 1 && !validateStep1()) return;
    setStep((s) => s + 1);
  }

  async function uploadFile(file: File) {
    const uploadEntry: UploadingFile = { name: file.name, progress: "uploading" };
    setUploadingFiles((prev) => [...prev, uploadEntry]);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/client-upload", { method: "POST", body: fd });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "שגיאה בהעלאה");

      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.name === file.name ? { ...f, progress: "done", url: data.url } : f
        )
      );
      update("images", [...formData.images, data.url]);
    } catch {
      setUploadingFiles((prev) =>
        prev.map((f) => (f.name === file.name ? { ...f, progress: "error" } : f))
      );
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => uploadFile(file));
    e.target.value = "";
  }

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      files.forEach((file) => uploadFile(file));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [formData.images]
  );

  function removeImage(url: string) {
    update(
      "images",
      formData.images.filter((i) => i !== url)
    );
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
      // silent fail — user can still type manually
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit() {
    if (!validateStep3()) return;
    setSubmitting(true);
    try {
      const body = {
        title: formData.title,
        description: formData.description || undefined,
        price: Number(formData.price),
        city: formData.city,
        propertyType: formData.propertyType,
        clientId,
        neighborhood: formData.neighborhood || undefined,
        street: formData.street || undefined,
        rooms: formData.rooms ? Number(formData.rooms) : undefined,
        floor: formData.floor ? Number(formData.floor) : undefined,
        totalFloors: formData.totalFloors ? Number(formData.totalFloors) : undefined,
        area: formData.area ? Number(formData.area) : undefined,
        features: formData.features.length > 0 ? formData.features : undefined,
        images: formData.images.length > 0 ? formData.images : undefined,
        isExclusive: formData.isExclusive,
        isFeatured: formData.isFeatured,
      };

      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ? JSON.stringify(err.error) : "שגיאה ביצירת הנכס");
      }

      router.push(`/client/${slug}/properties`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "שגיאה בשמירת הנכס");
    } finally {
      setSubmitting(false);
    }
  }

  const stepLabels = ["פרטי הנכס", "תמונות", "תיאור"];

  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">הוספת נכס חדש</h1>
        <p className="text-slate-500 text-sm mt-0.5">מלא את הפרטים כדי לפרסם את הנכס</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {stepLabels.map((label, idx) => {
          const num = idx + 1;
          const active = step === num;
          const done = step > num;
          return (
            <div key={num} className="flex items-center gap-2">
              <div
                className={classNames(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-colors",
                  done
                    ? "bg-blue-600 text-white"
                    : active
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 text-slate-500"
                )}
              >
                {done ? <Check size={14} /> : num}
              </div>
              <span
                className={classNames(
                  "text-sm font-medium hidden sm:block",
                  active ? "text-blue-600" : done ? "text-slate-600" : "text-slate-400"
                )}
              >
                {label}
              </span>
              {idx < stepLabels.length - 1 && (
                <div className="flex-1 h-px bg-slate-200 w-6 sm:w-10 mx-1" />
              )}
            </div>
          );
        })}
      </div>

      {/* Form card */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        {/* ── Step 1: Property Details ── */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-slate-800 mb-4">פרטי הנכס</h2>

            {/* Property type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                סוג נכס
              </label>
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
                  placeholder="תל אביב"
                  className={classNames(inputCls, errors.city ? "border-red-400 focus:ring-red-400" : "")}
                />
                {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  שכונה
                </label>
                <input
                  type="text"
                  value={formData.neighborhood}
                  onChange={(e) => update("neighborhood", e.target.value)}
                  placeholder="פלורנטין"
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
                placeholder="רחוב הרצל 10"
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
                placeholder="1250000"
                min={0}
                className={classNames(inputCls, errors.price ? "border-red-400 focus:ring-red-400" : "")}
              />
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
            </div>

            {/* Rooms + Area */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  חדרים
                </label>
                <input
                  type="number"
                  value={formData.rooms}
                  onChange={(e) => update("rooms", e.target.value)}
                  placeholder="3"
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
                  placeholder="85"
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
                  placeholder="3"
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
                  placeholder="8"
                  min={0}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                מאפיינים
              </label>
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
          </div>
        )}

        {/* ── Step 2: Images ── */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-slate-800 mb-4">תמונות</h2>

            {/* Drop zone */}
            <div
              ref={dropZoneRef}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={classNames(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                dragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/40"
              )}
            >
              <Upload size={28} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">
                גרור תמונות לכאן או{" "}
                <span className="text-blue-600 underline">לחץ לבחירה</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP עד 2MB לתמונה</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Uploading / uploaded images */}
            {(uploadingFiles.length > 0 || formData.images.length > 0) && (
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
                        f.progress === "error"
                          ? "border-red-200 bg-red-50"
                          : "border-slate-200 bg-slate-50"
                      )}
                    >
                      {f.progress === "uploading" ? (
                        <>
                          <Loader2 size={20} className="text-blue-500 animate-spin" />
                          <span className="text-xs text-slate-400 text-center px-1 truncate max-w-full">
                            {f.name}
                          </span>
                        </>
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
          </div>
        )}

        {/* ── Step 3: Description ── */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-slate-800 mb-4">תיאור הנכס</h2>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                כותרת הנכס <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="דירת 3 חדרים מרוהטת בלב תל אביב"
                className={classNames(inputCls, errors.title ? "border-red-400 focus:ring-red-400" : "")}
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
            </div>

            {/* Description + AI button */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700">תיאור</label>
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
                  {aiLoading ? "מייצר תיאור..." : "✨ צור תיאור אוטומטי"}
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
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-slate-100">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ChevronRight size={16} />
                הקודם
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-sm text-slate-500 hover:text-slate-700 underline"
              >
                דלג
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                הבא
                <ChevronLeft size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                פרסם נכס
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
