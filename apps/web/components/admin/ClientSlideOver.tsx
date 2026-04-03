"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Globe,
  Settings,
  ExternalLink,
  Plus,
  Loader2,
  ChevronRight,
  Home,
  Copy,
  Check,
  Save,
  Phone,
  Mail,
  Webhook,
  Lock,
  Paintbrush,
} from "lucide-react";

type Client = {
  id: string;
  name: string;
  slug: string;
  primaryColor: string;
  industry: string | null;
  isActive: boolean;
  leadsThisMonth: number;
  totalLeads: number;
  wonLeads: number;
};

type Lead = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  status: string;
  createdAt: string;
};

type Property = {
  id: string;
  title: string;
  price: number | null;
  status: string;
  propertyType: string;
  images: string[];
};

type ClientDetails = {
  phone: string | null;
  email: string | null;
  whatsappNumber: string | null;
  n8nWebhookUrl: string | null;
  portalPassword: string | null;
};

type Tab = "overview" | "properties" | "landing" | "settings";

const INDUSTRY_LABELS: Record<string, string> = {
  REAL_ESTATE: 'נדל"ן',
  ROOFING: "גגות",
  ALUMINUM: "אלומיניום",
  COSMETICS: "קוסמטיקה",
  BEAUTY: "קוסמטיקה",
  CLEANING: "ניקיון",
  SOLAR: "סולארי",
  OTHER: "אחר",
  AVIATION: "תעופה",
  TOURISM: "תיירות",
  FINANCE: "פיננסים",
  LEGAL: "משפטי",
  MEDICAL: "רפואה",
  FOOD: "מזון ומסעדנות",
  FITNESS: "כושר ובריאות",
  EDUCATION: "חינוך",
  GENERAL: "כללי",
};

const INDUSTRY_COLORS: Record<string, string> = {
  REAL_ESTATE: "bg-blue-100 text-blue-700",
  ROOFING: "bg-orange-100 text-orange-700",
  BEAUTY: "bg-pink-100 text-pink-700",
  CLEANING: "bg-green-100 text-green-700",
  SOLAR: "bg-yellow-100 text-yellow-700",
  OTHER: "bg-gray-100 text-gray-600",
};

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-yellow-100 text-yellow-700",
  QUALIFIED: "bg-purple-100 text-purple-700",
  PROPOSAL: "bg-orange-100 text-orange-700",
  WON: "bg-green-100 text-green-700",
  LOST: "bg-red-100 text-red-700",
};

const STATUS_HE: Record<string, string> = {
  NEW: "חדש",
  CONTACTED: "פנייה",
  QUALIFIED: "מוסמך",
  PROPOSAL: "הצעה",
  WON: "סגור",
  LOST: "אבוד",
};

function formatPrice(price: number | null): string {
  if (price === null) return "—";
  return `₪${price.toLocaleString("he-IL")}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-medium px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0"
      title="העתק"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "הועתק!" : "העתק"}
    </button>
  );
}

export default function ClientSlideOver({
  client,
  onClose,
}: {
  client: Client | null;
  onClose: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [loadingProperties, setLoadingProperties] = useState(false);

  // Settings tab state
  const [details, setDetails] = useState<ClientDetails>({
    phone: null, email: null, whatsappNumber: null,
    n8nWebhookUrl: null, portalPassword: null,
  });
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  useEffect(() => {
    if (client) {
      setIsOpen(true);
      setActiveTab("overview");
      setLeads([]);
      setProperties([]);
      setDetails({ phone: null, email: null, whatsappNumber: null, n8nWebhookUrl: null, portalPassword: null });
      setSettingsSaved(false);
      setSettingsError(null);

      setLoadingLeads(true);
      fetch(`/api/leads?clientId=${client.id}&limit=5`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setLeads(data);
          else if (data.leads) setLeads(data.leads);
        })
        .catch(() => {})
        .finally(() => setLoadingLeads(false));
    } else {
      setIsOpen(false);
    }
  }, [client]);

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);

    if (tab === "properties" && client && properties.length === 0) {
      setLoadingProperties(true);
      fetch(`/api/properties?clientId=${client.id}`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setProperties(data);
          else if (data.properties) setProperties(data.properties);
        })
        .catch(() => {})
        .finally(() => setLoadingProperties(false));
    }

    if (tab === "settings" && client) {
      setLoadingDetails(true);
      fetch(`/api/clients/${client.id}`)
        .then((r) => r.json())
        .then((data) => {
          const c = data.client ?? data;
          setDetails({
            phone: c.phone ?? null,
            email: c.email ?? null,
            whatsappNumber: c.whatsappNumber ?? null,
            n8nWebhookUrl: c.n8nWebhookUrl ?? null,
            portalPassword: c.portalPassword ?? null,
          });
        })
        .catch(() => {})
        .finally(() => setLoadingDetails(false));
    }
  };

  const handleSaveSettings = async () => {
    if (!client) return;
    setSavingSettings(true);
    setSettingsError(null);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: details.phone ?? undefined,
          email: details.email ?? undefined,
          whatsappNumber: details.whatsappNumber ?? undefined,
          n8nWebhookUrl: details.n8nWebhookUrl ?? undefined,
          portalPassword: details.portalPassword ?? undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "שגיאה בשמירה");
      }
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (e) {
      setSettingsError(e instanceof Error ? e.message : "שגיאה בשמירה");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300);
  };

  if (!client) return null;

  const initials = client.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const industryLabel = INDUSTRY_LABELS[client.industry ?? ""] ?? "כללי";
  const industryColor = INDUSTRY_COLORS[client.industry ?? ""] ?? "bg-gray-100 text-gray-600";
  const conversionRate = client.totalLeads > 0
    ? Math.round((client.wonLeads / client.totalLeads) * 100)
    : 0;

  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${client.slug}`
    : `/${client.slug}`;

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "סקירה" },
    ...(client.industry === "REAL_ESTATE"
      ? [{ id: "properties" as Tab, label: "נכסים" }]
      : []),
    { id: "landing", label: "דף נחיתה" },
    { id: "settings", label: "הגדרות" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="fixed inset-0 z-50 flex justify-end pointer-events-none" dir="rtl">
        <div
          className={`w-full max-w-lg bg-white shadow-2xl flex flex-col pointer-events-auto transition-transform duration-300 ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Header */}
          <div className="flex items-start gap-4 px-6 py-5 border-b border-gray-100">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ backgroundColor: client.primaryColor }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-gray-900 text-lg truncate">{client.name}</p>
                <Link
                  href={`/admin/clients/${client.id}`}
                  className="text-gray-400 hover:text-indigo-500 transition-colors"
                >
                  <ExternalLink size={15} />
                </Link>
              </div>
              <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${industryColor}`}>
                {industryLabel}
              </span>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 px-4 sticky top-0 bg-white z-10 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">

            {/* ─── Overview ─────────────────────────────────────────────── */}
            {activeTab === "overview" && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-indigo-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-indigo-700 tabular-nums">{client.leadsThisMonth}</p>
                    <p className="text-xs text-indigo-500 mt-1">לידים החודש</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-700 tabular-nums">{client.wonLeads}</p>
                    <p className="text-xs text-green-500 mt-1">סגורים</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-purple-700 tabular-nums">{conversionRate}%</p>
                    <p className="text-xs text-purple-500 mt-1">המרה %</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 text-sm">לידים אחרונים</h3>
                    <Link
                      href={`/admin/leads?clientId=${client.id}`}
                      className="text-xs text-indigo-500 hover:text-indigo-700 font-medium flex items-center gap-1"
                    >
                      כל הלידים <ChevronRight size={12} />
                    </Link>
                  </div>

                  {loadingLeads ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 size={20} className="animate-spin text-gray-400" />
                    </div>
                  ) : leads.length === 0 ? (
                    <div className="text-center py-8 text-sm text-gray-400">אין לידים עדיין</div>
                  ) : (
                    <div className="space-y-2">
                      {leads.map((lead) => (
                        <div
                          key={lead.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: client.primaryColor }}
                          >
                            {`${lead.firstName[0] ?? ""}${lead.lastName[0] ?? ""}`.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {lead.firstName} {lead.lastName}
                            </p>
                            <p className="text-xs text-gray-400">{lead.phone ?? lead.email ?? "—"}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[lead.status] ?? "bg-gray-100 text-gray-600"}`}>
                            {STATUS_HE[lead.status] ?? lead.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── Properties (REAL_ESTATE only) ────────────────────────── */}
            {activeTab === "properties" && (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 text-sm">נכסים</h3>
                  <Link
                    href={`/client/${client.slug}/properties/new`}
                    className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                  >
                    <Plus size={13} /> הוסף נכס
                  </Link>
                </div>

                {loadingProperties ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={20} className="animate-spin text-gray-400" />
                  </div>
                ) : properties.length === 0 ? (
                  <div className="text-center py-12">
                    <Home size={32} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">אין נכסים עדיין</p>
                    <Link
                      href={`/client/${client.slug}/properties/new`}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                    >
                      <Plus size={13} /> הוסף נכס ראשון
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {properties.map((property) => (
                      <div key={property.id} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100 hover:border-indigo-200 transition-colors">
                        {property.images.length > 0 ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={property.images[0]}
                            alt={property.title}
                            className="w-full h-24 object-cover"
                          />
                        ) : (
                          <div className="w-full h-24 bg-gray-200 flex items-center justify-center">
                            <Home size={24} className="text-gray-400" />
                          </div>
                        )}
                        <div className="p-2.5">
                          <p className="text-xs font-semibold text-gray-900 truncate">{property.title}</p>
                          <p className="text-xs text-indigo-600 font-medium mt-0.5">{formatPrice(property.price)}</p>
                          <span className={`inline-block mt-1 text-xs px-1.5 py-0.5 rounded font-medium ${
                            property.status === "SOLD"
                              ? "bg-red-100 text-red-600"
                              : property.status === "AVAILABLE"
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            {property.status === "SOLD" ? "נמכר" : property.status === "AVAILABLE" ? "זמין" : property.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── Landing Page ─────────────────────────────────────────── */}
            {activeTab === "landing" && (
              <div className="p-6 space-y-4">
                <h3 className="font-semibold text-gray-900 text-sm">דף נחיתה</h3>

                {/* Public URL */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-medium text-gray-500">כתובת ציבורית</p>
                  <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                    <Globe size={13} className="text-gray-400 flex-shrink-0" />
                    <p className="text-sm text-gray-700 font-mono truncate flex-1 text-left" dir="ltr">
                      {publicUrl}
                    </p>
                    <CopyButton text={publicUrl} />
                  </div>
                  <a
                    href={`/${client.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 w-full justify-center bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
                  >
                    <ExternalLink size={15} />
                    פתח דף ציבורי
                  </a>
                </div>

                {/* Client Portal */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-medium text-gray-500">פורטל לקוח</p>
                  <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                    <Globe size={13} className="text-gray-400 flex-shrink-0" />
                    <p className="text-sm text-gray-700 font-mono truncate flex-1 text-left" dir="ltr">
                      {typeof window !== "undefined" ? `${window.location.origin}/client/${client.slug}` : `/client/${client.slug}`}
                    </p>
                    <CopyButton text={typeof window !== "undefined" ? `${window.location.origin}/client/${client.slug}` : `/client/${client.slug}`} />
                  </div>
                  <Link
                    href={`/client/${client.slug}`}
                    target="_blank"
                    className="flex items-center gap-2 w-full justify-center bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
                  >
                    <ExternalLink size={15} />
                    פתח פורטל לקוח
                  </Link>
                </div>

                {/* Page Builder */}
                <div className="bg-indigo-50 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-medium text-indigo-600">בונה דפים</p>
                  <Link
                    href={`/admin/clients/${client.id}/builder`}
                    className="flex items-center gap-2 w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
                  >
                    <Paintbrush size={15} />
                    פתח בונה הדפים &larr;
                  </Link>
                </div>

                {/* Intake Form */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-medium text-gray-500">טופס קבלת לידים</p>
                  <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                    <Globe size={13} className="text-gray-400 flex-shrink-0" />
                    <p className="text-sm text-gray-700 font-mono truncate flex-1 text-left" dir="ltr">
                      {typeof window !== "undefined" ? `${window.location.origin}/intake/${client.slug}` : `/intake/${client.slug}`}
                    </p>
                    <CopyButton text={typeof window !== "undefined" ? `${window.location.origin}/intake/${client.slug}` : `/intake/${client.slug}`} />
                  </div>
                </div>
              </div>
            )}

            {/* ─── Settings ─────────────────────────────────────────────── */}
            {activeTab === "settings" && (
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 text-sm">הגדרות לקוח</h3>
                  <Link
                    href={`/admin/clients/${client.id}`}
                    className="text-xs text-indigo-500 hover:text-indigo-700 font-medium flex items-center gap-1"
                  >
                    עמוד מלא <ChevronRight size={12} />
                  </Link>
                </div>

                {loadingDetails ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={20} className="animate-spin text-gray-400" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Phone */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                        <Phone size={12} /> טלפון
                      </label>
                      <input
                        type="tel"
                        value={details.phone ?? ""}
                        onChange={(e) => setDetails((d) => ({ ...d, phone: e.target.value }))}
                        placeholder="050-0000000"
                        dir="ltr"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 text-left"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                        <Mail size={12} /> אימייל
                      </label>
                      <input
                        type="email"
                        value={details.email ?? ""}
                        onChange={(e) => setDetails((d) => ({ ...d, email: e.target.value }))}
                        placeholder="client@example.com"
                        dir="ltr"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 text-left"
                      />
                    </div>

                    {/* WhatsApp */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                        <Phone size={12} /> WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={details.whatsappNumber ?? ""}
                        onChange={(e) => setDetails((d) => ({ ...d, whatsappNumber: e.target.value }))}
                        placeholder="972501234567"
                        dir="ltr"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 text-left"
                      />
                      <p className="text-xs text-gray-400 mt-1">כולל קידומת מדינה ללא +</p>
                    </div>

                    {/* n8n Webhook */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                        <Webhook size={12} /> n8n Webhook URL
                      </label>
                      <input
                        type="url"
                        value={details.n8nWebhookUrl ?? ""}
                        onChange={(e) => setDetails((d) => ({ ...d, n8nWebhookUrl: e.target.value }))}
                        placeholder="https://n8n.example.com/webhook/..."
                        dir="ltr"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 text-left"
                      />
                    </div>

                    {/* Portal Password */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                        <Lock size={12} /> סיסמת פורטל
                      </label>
                      <input
                        type="password"
                        value={details.portalPassword ?? ""}
                        onChange={(e) => setDetails((d) => ({ ...d, portalPassword: e.target.value }))}
                        placeholder="הזן סיסמה חדשה..."
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      />
                    </div>

                    {/* Save button */}
                    {settingsError && (
                      <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{settingsError}</p>
                    )}
                    {settingsSaved && (
                      <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2 flex items-center gap-1.5">
                        <Check size={12} /> נשמר בהצלחה
                      </p>
                    )}
                    <button
                      onClick={handleSaveSettings}
                      disabled={savingSettings}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                    >
                      {savingSettings ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                      {savingSettings ? "שומר..." : "שמור הגדרות"}
                    </button>

                    <div className="pt-2 border-t border-gray-100">
                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        <Settings size={16} className="text-gray-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">הגדרות מתקדמות</p>
                          <p className="text-xs text-gray-400">לוגו, צבעים, תבנית</p>
                        </div>
                        <ChevronRight size={14} className="text-gray-300" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
