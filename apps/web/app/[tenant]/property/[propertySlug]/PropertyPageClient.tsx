"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Home, Building, MapPin, Phone, MessageSquare,
  BedDouble, Maximize, Layers, ChevronRight, Star,
  CheckCircle2, Loader2, ArrowRight, User,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type Property = {
  id: string;
  slug: string;
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
};

type ClientData = {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  primaryColor: string;
  whatsappNumber: string | null;
  agentPhone: string | null;
  agentBio: string | null;
  agentPhoto: string | null;
  agentCity: string | null;
  agentExperience: number | null;
};

type SimilarProperty = {
  id: string;
  slug: string;
  title: string;
  price: number;
  rooms: number | null;
  area: number | null;
  city: string;
  images: string[];
  propertyType: string;
};

type Props = {
  property: Property;
  client: ClientData;
  similarProperties: SimilarProperty[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: "דירה",
  HOUSE: "בית פרטי",
  PENTHOUSE: "פנטהאוז",
  GARDEN_APARTMENT: "דירת גן",
  DUPLEX: "דופלקס",
  STUDIO: "סטודיו",
  COMMERCIAL: "מסחרי",
  LAND: "קרקע",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  AVAILABLE:      { label: "זמין",         color: "bg-green-100 text-green-700" },
  UNDER_CONTRACT: { label: "בתהליך מכירה", color: "bg-amber-100 text-amber-700" },
  SOLD:           { label: "נמכר",          color: "bg-slate-100 text-slate-600"   },
  OFF_MARKET:     { label: "לא פעיל",       color: "bg-red-100 text-red-600"     },
};

function formatPrice(price: number): string {
  return `₪${price.toLocaleString("he-IL")}`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

// ── Lead Form ─────────────────────────────────────────────────────────────────

function LeadForm({
  client,
  property,
}: {
  client: ClientData;
  property: Property;
}) {
  const [values, setValues] = useState({ fullName: "", phone: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState("");

  function validate() {
    const e: Record<string, string> = {};
    if (!values.fullName.trim()) e.fullName = "שם מלא הוא שדה חובה";
    if (!values.phone.trim()) e.phone = "טלפון הוא שדה חובה";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError("");
    try {
      const [firstName = "", ...rest] = values.fullName.trim().split(" ");
      const lastName = rest.join(" ") || "-";
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone: values.phone,
          clientId: client.id,
          propertyId: property.id,
          source: "property_page",
          metadata: {
            propertyTitle: property.title,
            message: values.message || undefined,
          },
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setServerError(d.error ?? "שגיאה בשליחת הטופס. נסה שנית.");
        return;
      }
      setDone(true);
    } catch {
      setServerError("שגיאת חיבור לשרת. נסה שנית.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-8 space-y-3">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
          style={{ backgroundColor: client.primaryColor }}
        >
          <CheckCircle2 size={28} className="text-white" />
        </div>
        <h3 className="font-bold text-slate-900">תודה רבה!</h3>
        <p className="text-slate-500 text-sm">קיבלנו את הפנייה שלך ונחזור אליך בהקדם.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Full name */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          שם מלא <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <User size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={values.fullName}
            onChange={(e) => setValues((p) => ({ ...p, fullName: e.target.value }))}
            placeholder="ישראל ישראלי"
            className={`w-full rounded-lg border pr-9 px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
              errors.fullName
                ? "border-red-300 focus:ring-red-300"
                : "border-slate-200 focus:ring-blue-300"
            }`}
          />
        </div>
        {errors.fullName && <p className="text-red-500 text-xs mt-0.5">{errors.fullName}</p>}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          טלפון <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Phone size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="tel"
            dir="ltr"
            value={values.phone}
            onChange={(e) => setValues((p) => ({ ...p, phone: e.target.value }))}
            placeholder="050-0000000"
            className={`w-full rounded-lg border pr-9 px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
              errors.phone
                ? "border-red-300 focus:ring-red-300"
                : "border-slate-200 focus:ring-blue-300"
            }`}
          />
        </div>
        {errors.phone && <p className="text-red-500 text-xs mt-0.5">{errors.phone}</p>}
      </div>

      {/* Message */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">הודעה</label>
        <textarea
          rows={3}
          value={values.message}
          onChange={(e) => setValues((p) => ({ ...p, message: e.target.value }))}
          placeholder={`אני מתעניין בנכס: ${property.title}`}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {serverError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <p className="text-red-600 text-xs">{serverError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 text-white font-semibold rounded-lg py-2.5 text-sm shadow disabled:opacity-60 hover:opacity-90 transition-opacity"
        style={{ backgroundColor: client.primaryColor }}
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin" /> שולח...
          </>
        ) : (
          "שלח פנייה"
        )}
      </button>
    </form>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function PropertyPageClient({ property, client, similarProperties }: Props) {
  const [activeImage, setActiveImage] = useState(0);

  // Track view on mount (once)
  useEffect(() => {
    fetch(`/api/public/properties/${property.id}/view`, { method: "POST" }).catch(() => {});
  }, [property.id]);

  const waNumber = client.whatsappNumber?.replace(/[^0-9]/g, "");
  const waText = encodeURIComponent(`שלום, אני מתעניין בנכס: ${property.title}`);
  const waLink = waNumber ? `https://wa.me/${waNumber}?text=${waText}` : null;

  const phoneNumber = client.agentPhone ?? client.phone;
  const statusInfo = STATUS_LABELS[property.status] ?? { label: property.status, color: "bg-slate-100 text-slate-600" };
  const typeLabel = PROPERTY_TYPE_LABELS[property.propertyType] ?? property.propertyType;

  function handleWaClick() {
    fetch(`/api/public/properties/${property.id}/whatsapp`, { method: "POST" }).catch(() => {});
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <nav className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <ol className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
            <li>
              <Link href={`/${client.slug}`} className="hover:text-slate-800 transition-colors font-medium">
                {client.name}
              </Link>
            </li>
            <li><ChevronRight size={12} className="text-slate-300 rotate-180" /></li>
            <li>
              <Link href={`/${client.slug}`} className="hover:text-slate-800 transition-colors">
                {property.city}
              </Link>
            </li>
            <li><ChevronRight size={12} className="text-slate-300 rotate-180" /></li>
            <li className="text-slate-800 font-medium truncate max-w-[200px]">{property.title}</li>
          </ol>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* ── Image Gallery ──────────────────────────────────────────────────── */}
        {property.images.length > 0 ? (
          <div className="space-y-3">
            {/* Main image */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-100 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={property.images[activeImage]}
                alt={`${property.title} - תמונה ${activeImage + 1}`}
                className="w-full h-full object-cover"
              />
              {property.isExclusive && (
                <span className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                  בלעדי
                </span>
              )}
              {property.images.length > 1 && (
                <span className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                  {activeImage + 1} / {property.images.length}
                </span>
              )}
            </div>
            {/* Thumbnails */}
            {property.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {property.images.map((src, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === activeImage
                        ? "border-blue-500 opacity-100"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Gradient placeholder */
          <div
            className="w-full aspect-video rounded-2xl flex flex-col items-center justify-center shadow-sm"
            style={{ background: `linear-gradient(135deg, ${client.primaryColor}20 0%, ${client.primaryColor}40 100%)` }}
          >
            {property.propertyType === "HOUSE" ? (
              <Home size={64} style={{ color: client.primaryColor }} className="opacity-40" />
            ) : (
              <Building size={64} style={{ color: client.primaryColor }} className="opacity-40" />
            )}
            <p className="mt-3 text-sm font-medium" style={{ color: client.primaryColor }}>
              {typeLabel}
            </p>
          </div>
        )}

        {/* ── 2-col layout ───────────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* ── Left: main content ──────────────────────────────────────────── */}
          <div className="flex-1 space-y-6 min-w-0">
            {/* Price + badges */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <p
                  className="text-3xl font-bold"
                  style={{ color: client.primaryColor }}
                >
                  {formatPrice(property.price)}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                  {property.isExclusive && (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-700">
                      בלעדי
                    </span>
                  )}
                  {property.isFeatured && (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-600 flex items-center gap-1">
                      <Star size={11} fill="currentColor" /> מומלץ
                    </span>
                  )}
                </div>
              </div>
              <h1 className="text-xl font-bold text-slate-900 leading-snug">{property.title}</h1>
              {(property.city || property.neighborhood || property.street) && (
                <p className="text-sm text-slate-500 flex items-center gap-1.5">
                  <MapPin size={14} className="flex-shrink-0" />
                  {[property.street, property.neighborhood, property.city].filter(Boolean).join(", ")}
                </p>
              )}
            </div>

            {/* Details grid */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h2 className="font-bold text-slate-900 mb-4">פרטי הנכס</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {property.rooms != null && (
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <BedDouble size={20} className="mx-auto text-slate-400 mb-1" />
                    <p className="text-lg font-bold text-slate-900">{property.rooms}</p>
                    <p className="text-xs text-slate-500">חדרים</p>
                  </div>
                )}
                {property.area != null && (
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <Maximize size={20} className="mx-auto text-slate-400 mb-1" />
                    <p className="text-lg font-bold text-slate-900">{property.area}</p>
                    <p className="text-xs text-slate-500">מ״ר</p>
                  </div>
                )}
                {property.floor != null && (
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <Layers size={20} className="mx-auto text-slate-400 mb-1" />
                    <p className="text-lg font-bold text-slate-900">
                      {property.floor}
                      {property.totalFloors != null && (
                        <span className="text-sm font-normal text-slate-500">/{property.totalFloors}</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">קומה</p>
                  </div>
                )}
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <Building size={20} className="mx-auto text-slate-400 mb-1" />
                  <p className="text-sm font-bold text-slate-900">{typeLabel}</p>
                  <p className="text-xs text-slate-500">סוג</p>
                </div>
              </div>
            </div>

            {/* Features */}
            {property.features.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <h2 className="font-bold text-slate-900 mb-3">מאפיינים</h2>
                <div className="flex flex-wrap gap-2">
                  {property.features.map((f) => (
                    <span
                      key={f}
                      className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-slate-700"
                    >
                      <CheckCircle2 size={12} className="text-green-500" /> {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {property.description && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <h2 className="font-bold text-slate-900 mb-3">תיאור</h2>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {property.description}
                </p>
              </div>
            )}
          </div>

          {/* ── Right: sticky sidebar ────────────────────────────────────────── */}
          <div className="w-full lg:w-80 flex-shrink-0 space-y-4 lg:sticky lg:top-4">
            {/* Agent card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-center gap-3 mb-4">
                {client.agentPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={client.agentPhoto}
                    alt={client.name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                    style={{ backgroundColor: client.primaryColor }}
                  >
                    {initials(client.name)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-sm leading-tight">{client.name}</p>
                  {client.agentCity && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={11} /> {client.agentCity}
                    </p>
                  )}
                  {client.agentExperience != null && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Star size={11} /> {client.agentExperience} שנות ניסיון
                    </p>
                  )}
                </div>
              </div>
              {client.agentBio && (
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4 border-t border-slate-100 pt-3">
                  {client.agentBio}
                </p>
              )}

              {/* WhatsApp button */}
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleWaClick}
                  className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl py-3 text-sm transition-colors mb-2 shadow"
                >
                  <MessageSquare size={16} /> שלח וואצאפ
                </a>
              )}

              {phoneNumber && (
                <a
                  href={`tel:${phoneNumber}`}
                  className="flex items-center justify-center gap-2 w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl py-2.5 text-sm transition-colors"
                >
                  <Phone size={15} /> {phoneNumber}
                </a>
              )}

              {/* Book a visit via WhatsApp */}
              {waLink && (
                <a
                  href={`https://wa.me/${client.whatsappNumber?.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`שלום! אשמח לקבוע ביקור בנכס "${property.title}" — מתי אפשר?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full border border-blue-200 hover:bg-blue-50 text-blue-700 font-medium rounded-xl py-2.5 text-sm transition-colors mt-2"
                >
                  <User size={15} /> קביעת ביקור
                </a>
              )}
            </div>

            {/* Lead form */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="font-bold text-slate-900 mb-3 text-sm">השאר פרטים לקבלת מידע</h3>
              <LeadForm client={client} property={property} />
            </div>
          </div>
        </div>

        {/* ── Similar Properties ────────────────────────────────────────────── */}
        {similarProperties.length > 0 && (
          <section className="pt-2">
            <h2 className="text-lg font-bold text-slate-900 mb-4">נכסים דומים</h2>
            <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory">
              {similarProperties.map((p) => (
                <Link
                  key={p.id}
                  href={`/${client.slug}/property/${p.slug}`}
                  className="flex-shrink-0 w-60 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow snap-start group"
                >
                  <div className="relative aspect-video overflow-hidden">
                    {p.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.images[0]}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: `${client.primaryColor}15` }}
                      >
                        <Building size={32} style={{ color: client.primaryColor }} className="opacity-30" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="font-bold text-slate-900 text-sm">{formatPrice(p.price)}</p>
                    <p className="text-xs text-slate-700 line-clamp-1">{p.title}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {p.rooms != null && (
                        <span className="text-xs text-slate-500 flex items-center gap-0.5">
                          <BedDouble size={11} /> {p.rooms} חד׳
                        </span>
                      )}
                      {p.area != null && (
                        <span className="text-xs text-slate-500 flex items-center gap-0.5">
                          <Maximize size={11} /> {p.area} מ״ר
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-blue-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                      לפרטים נוספים <ArrowRight size={11} className="rotate-180" />
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="mt-10 bg-white border-t border-slate-100 py-5 text-center">
        <p className="text-xs text-slate-400">
          מופעל על ידי <span className="font-medium">MarketingOS</span>
        </p>
      </footer>
    </div>
  );
}
