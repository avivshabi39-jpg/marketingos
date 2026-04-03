import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";
import { ExternalLink, ClipboardList, Users, FileText } from "lucide-react";
import { CopyLinkButton } from "@/components/admin/CopyLinkButton";
import { IntakeCreateButton } from "@/components/admin/IntakeCreateButton";
import { IntakeQuestionsButton } from "@/components/admin/IntakeQuestionsButton";
import { notFound } from "next/navigation";

export default async function IntakeFormsPage() {
  const session = await getSession();
  if (!session) return notFound();

  const where = isSuperAdmin(session)
    ? { isActive: true }
    : { isActive: true, ownerId: session.userId };

  const clients = await prisma.client.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      _count: { select: { intakeForms: true, leads: true } },
    },
  });

  const formCounts = await prisma.intakeForm.groupBy({
    by: ["clientId", "formType"],
    _count: { id: true },
    where: { clientId: { in: clients.map((c) => c.id) } },
  });

  function countByType(clientId: string, type: "CLIENT_ONBOARDING" | "LANDING_PAGE") {
    return formCounts
      .filter((f) => f.clientId === clientId && f.formType === type)
      .reduce((s, f) => s + f._count.id, 0);
  }

  // All clients list for the create modal
  const clientOptions = clients.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">טפסי קבלה ולידים</h1>
          <p className="text-sm text-gray-500 mt-0.5">{clients.length} לקוחות פעילים</p>
        </div>
        <IntakeCreateButton clients={clientOptions} />
      </div>

      {clients.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20">
          <ClipboardList size={28} className="text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 mb-3">עדיין אין לקוחות פעילים</p>
          <Link href="/admin/clients/new" className="text-indigo-500 hover:text-indigo-700 text-sm font-medium">
            הוסף לקוח ראשון
          </Link>
        </div>
      )}

      {/* ── Section 1: טפסי איפיון לקוח ── */}
      {clients.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Users size={16} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">טפסי קבלת לקוח</h2>
              <p className="text-xs text-gray-500">לשימוש פנימי — ממלאים יחד עם לקוח חדש</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {clients.map((client) => {
              const count = countByType(client.id, "CLIENT_ONBOARDING");
              return (
                <div key={"ob-" + client.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: client.primaryColor }}
                    >
                      {client.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{client.name}</h3>
                      <p className="text-xs text-gray-400">{count} תגובות</p>
                    </div>
                    <IntakeQuestionsButton formType="CLIENT_ONBOARDING" />
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                    <Link
                      href={`/admin/intake-forms/${client.id}`}
                      className="flex items-center gap-1.5 text-sm font-medium text-indigo-500 hover:text-indigo-700 flex-1"
                    >
                      <ClipboardList size={14} />
                      {count > 0 ? `${count} תגובות` : "אין תגובות עדיין"}
                    </Link>
                    <a
                      href={`/${client.slug}/intake`}
                      target="_blank"
                      className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 border border-indigo-200 rounded-lg px-2 py-1.5"
                    >
                      <FileText size={12} />
                      מלא טופס
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Section 2: טפסי אפיון לאתר ── */}
      {clients.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
              <FileText size={16} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">טפסי לידים ללקוחות</h2>
              <p className="text-xs text-gray-500">הטפסים שהלקוחות שלך שמים בדפי הנחיתה שלהם</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {clients.map((client) => {
              const leadsCount = client._count.leads;
              const intakeUrl  = `/${client.slug}/intake`;
              return (
                <div key={"lp-" + client.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: client.primaryColor }}
                    >
                      {client.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{client.name}</h3>
                      <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 mt-0.5">
                        {leadsCount} לידים
                      </span>
                    </div>
                    <IntakeQuestionsButton formType="LANDING_PAGE" />
                  </div>

                  <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-2 mb-3">
                    <span className="text-xs text-gray-500 truncate flex-1" dir="ltr">{intakeUrl}</span>
                  </div>

                  <div className="flex justify-center mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                        (process.env.NEXT_PUBLIC_APP_URL ?? "") + intakeUrl
                      )}`}
                      alt="QR"
                      className="w-16 h-16 rounded border border-gray-200"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                    <CopyLinkButton url={intakeUrl} />
                    <Link
                      href={`/admin/leads?clientId=${client.id}`}
                      className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 flex-1"
                    >
                      צפה בלידים
                    </Link>
                    <a
                      href={intakeUrl}
                      target="_blank"
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
