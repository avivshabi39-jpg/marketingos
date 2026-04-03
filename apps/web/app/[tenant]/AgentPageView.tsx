"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Phone, MessageSquare, BedDouble, Maximize, MapPin,
  Building, Home, Star, CheckCircle2, Loader2, User, Flame, Calendar,
} from "lucide-react";
import { PageViewTracker } from "@/components/PageViewTracker";

// ── Types ─────────────────────────────────────────────────────────────────────

type AgentPageProps = {
  client: {
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
    landingPageLogo: string | null;
  };
  properties: Array<{
    id: string;
    slug: string;
    title: string;
    price: number;
    rooms: number | null;
    area: number | null;
    floor: number | null;
    city: string;
    neighborhood: string | null;
    propertyType: string;
    status: string;
    images: string[];
    isFeatured: boolean;
    isExclusive?: boolean;
  }>;
  stats: { activeProperties: number; soldProperties: number };
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

// ── Property Card ─────────────────────────────────────────────────────────────

function PropertyCard({
  prop,
  clientSlug,
  primaryColor,
}: {
  prop: AgentPageProps["properties"][number];
  clientSlug: string;
  primaryColor: string;
}) {
  const mainImage = prop.images[0];
  return (
    <Link
      href={`/${clientSlug}/property/${prop.slug}`}
      className="group block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden">
        {mainImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mainImage}
            alt={prop.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `${primaryColor}20` }}
          >
            <Building size={40} style={{ color: primaryColor }} className="opacity-40" />
          </div>
        )}
        {prop.isExclusive && (
          <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            בלעדי
          </span>
        )}
        {prop.isFeatured && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
            <Flame size={11} /> נכס חם
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <p className="text-lg font-bold text-gray-900">{formatPrice(prop.price)}</p>
        <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">{prop.title}</p>
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <MapPin size={12} />
          {prop.city}
          {prop.neighborhood ? ` · ${prop.neighborhood}` : ""}
        </p>
        <div className="flex items-center gap-2 flex-wrap pt-1">
          {prop.rooms != null && (
            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">
              <BedDouble size={11} /> {prop.rooms} חד׳
            </span>
          )}
          {prop.area != null && (
            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">
              <Maximize size={11} /> {prop.area} מ״ר
            </span>
          )}
          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">
            <Home size={11} /> {PROPERTY_TYPE_LABELS[prop.propertyType] ?? prop.propertyType}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Contact Form ──────────────────────────────────────────────────────────────

function ContactForm({ client }: { client: AgentPageProps["client"] }) {
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
          source: "agent_page",
          metadata: { page: "agent", message: values.message || undefined },
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
      <div className="text-center py-10 space-y-3">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
          style={{ backgroundColor: client.primaryColor }}
        >
          <CheckCircle2 size={32} className="text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">תודה רבה!</h3>
        <p className="text-gray-500 text-sm">קיבלנו את הפנייה שלך ונחזור אליך בהקדם.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Full name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          שם מלא <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <User size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={values.fullName}
            onChange={(e) => setValues((p) => ({ ...p, fullName: e.target.value }))}
            placeholder="ישראל ישראלי"
            className={`w-full rounded-xl border pr-9 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${
              errors.fullName ? "border-red-300 focus:ring-red-300" : "border-gray-200 focus:ring-indigo-300"
            }`}
          />
        </div>
        {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          טלפון <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Phone size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="tel"
            dir="ltr"
            value={values.phone}
            onChange={(e) => setValues((p) => ({ ...p, phone: e.target.value }))}
            placeholder="050-0000000"
            className={`w-full rounded-xl border pr-9 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${
              errors.phone ? "border-red-300 focus:ring-red-300" : "border-gray-200 focus:ring-indigo-300"
            }`}
          />
        </div>
        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">הודעה</label>
        <textarea
          rows={3}
          value={values.message}
          onChange={(e) => setValues((p) => ({ ...p, message: e.target.value }))}
          placeholder="מה מחפשים? נשמח לעזור..."
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      {serverError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-red-600 text-sm">{serverError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 text-white font-semibold rounded-xl py-3 text-base shadow disabled:opacity-60 hover:opacity-90 transition-opacity"
        style={{ backgroundColor: client.primaryColor }}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> שולח...
          </>
        ) : (
          "שלח פנייה"
        )}
      </button>
    </form>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function AgentPageView({ client, properties, stats }: AgentPageProps) {
  const [typeFilter, setTypeFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [roomsFilter, setRoomsFilter] = useState("");

  const available = properties.filter((p) => p.status === "AVAILABLE");
  const sold = properties.filter((p) => p.status === "SOLD");

  // Client-side filtering
  const filtered = available.filter((p) => {
    if (typeFilter && p.propertyType !== typeFilter) return false;
    if (priceFilter) {
      const maxMap: Record<string, number> = {
        "1M": 1_000_000,
        "1.5M": 1_500_000,
        "2M": 2_000_000,
        "3M": 3_000_000,
        "5M": 5_000_000,
      };
      const max = maxMap[priceFilter];
      if (max && p.price > max) return false;
    }
    if (roomsFilter) {
      if (roomsFilter === "1-2" && (p.rooms == null || p.rooms > 2)) return false;
      if (roomsFilter === "3" && p.rooms !== 3) return false;
      if (roomsFilter === "4" && p.rooms !== 4) return false;
      if (roomsFilter === "5+" && (p.rooms == null || p.rooms < 5)) return false;
    }
    return true;
  });

  const phoneNumber = client.agentPhone ?? client.phone;
  const waNumber = client.whatsappNumber?.replace(/[^0-9]/g, "");
  const waLink = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(`שלום ${client.name}, אשמח לשמוע יותר על הנכסים שלך`)}`
    : null;

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <PageViewTracker clientSlug={client.slug} page="agent" />
      {/* ── Sticky Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            {client.landingPageLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={client.landingPageLogo}
                alt={client.name}
                className="w-9 h-9 rounded-lg object-contain"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: client.primaryColor }}
              >
                {initials(client.name)}
              </div>
            )}
            <div>
              <p className="font-bold text-gray-900 leading-tight text-sm sm:text-base">{client.name}</p>
              {client.agentCity && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin size={11} /> {client.agentCity}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {phoneNumber && (
              <a
                href={`tel:${phoneNumber}`}
                className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Phone size={14} />
                <span className="hidden sm:inline">{phoneNumber}</span>
                <span className="sm:hidden">התקשר</span>
              </a>
            )}
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                <MessageSquare size={14} /> וואצאפ
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section ──────────────────────────────────────────────────────── */}
      <section
        className="relative"
        style={{
          background: `linear-gradient(135deg, ${client.primaryColor} 0%, ${client.primaryColor}cc 100%)`,
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            {/* Agent info */}
            <div className="flex-1 text-white flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Photo or initials */}
              {client.agentPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={client.agentPhoto}
                  alt={client.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white/30 shadow-lg flex-shrink-0"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center text-white font-bold text-3xl flex-shrink-0 shadow-lg">
                  {initials(client.name)}
                </div>
              )}

              <div className="text-center sm:text-right">
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{client.name}</h1>
                {client.agentCity && (
                  <p className="text-white/80 text-sm mt-1 flex items-center justify-center sm:justify-start gap-1">
                    <MapPin size={14} /> {client.agentCity}
                  </p>
                )}
                {client.agentExperience != null && (
                  <span className="inline-flex items-center gap-1 mt-2 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    <Star size={12} fill="currentColor" /> {client.agentExperience} שנות ניסיון
                  </span>
                )}
                {client.agentBio && (
                  <p className="text-white/85 text-sm mt-3 max-w-md leading-relaxed line-clamp-3">
                    {client.agentBio}
                  </p>
                )}
              </div>
            </div>

            {/* Stat cards */}
            <div className="flex gap-3 flex-shrink-0">
              {[
                { value: stats.activeProperties, label: "נכסים זמינים" },
                { value: stats.soldProperties,   label: "נמכרו" },
                { value: client.agentExperience ?? 0, label: "שנות ניסיון" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white/15 backdrop-blur-sm border border-white/25 rounded-2xl px-4 py-4 text-center text-white min-w-[80px]"
                >
                  <p className="text-2xl sm:text-3xl font-bold">{s.value}</p>
                  <p className="text-xs text-white/80 mt-1 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Filter Bar ────────────────────────────────────────────────────────── */}
      <div className="sticky top-[57px] z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-700 hidden sm:inline">סינון:</span>

          {/* Property type */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">כל הסוגים</option>
            <option value="APARTMENT">דירה</option>
            <option value="HOUSE">בית פרטי</option>
            <option value="PENTHOUSE">פנטהאוז</option>
            <option value="GARDEN_APARTMENT">גן</option>
            <option value="DUPLEX">דופלקס</option>
            <option value="STUDIO">סטודיו</option>
            <option value="COMMERCIAL">מסחרי</option>
            <option value="LAND">קרקע</option>
          </select>

          {/* Max price */}
          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">כל המחירים</option>
            <option value="1M">עד ₪1M</option>
            <option value="1.5M">עד ₪1.5M</option>
            <option value="2M">עד ₪2M</option>
            <option value="3M">עד ₪3M</option>
            <option value="5M">עד ₪5M</option>
          </select>

          {/* Rooms */}
          <select
            value={roomsFilter}
            onChange={(e) => setRoomsFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">כל החדרים</option>
            <option value="1-2">1-2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5+">5+</option>
          </select>

          <span className="text-xs text-gray-400 mr-auto">
            {filtered.length} נכסים
          </span>
        </div>
      </div>

      {/* ── Available Properties Grid ─────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold text-gray-900 mb-6">נכסים זמינים</h2>
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Building size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">לא נמצאו נכסים התואמים לסינון</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((prop) => (
              <PropertyCard
                key={prop.id}
                prop={prop}
                clientSlug={client.slug}
                primaryColor={client.primaryColor}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Sold Properties ───────────────────────────────────────────────────── */}
      {sold.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-6">נמכרו</h2>
          <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory">
            {sold.map((prop) => {
              const mainImage = prop.images[0];
              return (
                <div
                  key={prop.id}
                  className="flex-shrink-0 w-56 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden snap-start"
                >
                  <div className="relative aspect-video">
                    {mainImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mainImage}
                        alt={prop.title}
                        className="w-full h-full object-cover grayscale"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <Building size={28} className="text-gray-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
                      <span className="bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full">
                        נמכר
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-bold text-gray-900">{formatPrice(prop.price)}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{prop.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{prop.city}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Contact Form ──────────────────────────────────────────────────────── */}
      <section className="bg-gray-100 border-t border-gray-200">
        <div className="max-w-xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">צור קשר</h2>
            <p className="text-gray-500 text-sm mt-2">השאר פרטים ונחזור אליך בהקדם</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <ContactForm client={client} />
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-100 py-5 text-center">
        <p className="text-xs text-gray-400">
          מופעל על ידי <span className="font-medium">MarketingOS</span>
        </p>
      </footer>

      {/* ── Sticky WhatsApp + Call buttons ────────────────────────────────────── */}
      <div className="fixed bottom-5 left-4 z-50 flex flex-col gap-2 items-start">
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold px-4 py-2.5 rounded-full shadow-lg transition-all hover:scale-105"
          >
            <MessageSquare size={16} /> וואצאפ
          </a>
        )}
        {phoneNumber && (
          <a
            href={`tel:${phoneNumber}`}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-bold px-4 py-2.5 rounded-full shadow-lg border border-gray-200 transition-all hover:scale-105"
          >
            <Calendar size={16} /> קבעו ביקור
          </a>
        )}
      </div>
    </div>
  );
}
