import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Plus, Home, Building, Store } from "lucide-react";
import { PropertyBroadcastButton } from "./PropertyBroadcastButton";

const TYPE_HE: Record<string, string> = {
  APARTMENT: "דירה",
  HOUSE:     "בית פרטי",
  COMMERCIAL:"מסחרי",
  PENTHOUSE: "פנטהאוז",
  GARDEN_APARTMENT: "דירת גן",
  DUPLEX:    "דופלקס",
  STUDIO:    "סטודיו",
  LAND:      "קרקע",
};

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE:      "bg-green-100 text-green-700",
  UNDER_CONTRACT: "bg-yellow-100 text-yellow-700",
  SOLD:           "bg-slate-100 text-slate-500",
};

const STATUS_HE: Record<string, string> = {
  AVAILABLE:      "זמין",
  UNDER_CONTRACT: "בתהליך",
  SOLD:           "נמכר",
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  APARTMENT: Home,
  HOUSE: Building,
  COMMERCIAL: Store,
};

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: { status?: string; city?: string; clientId?: string };
}) {
  const session = await getSession();
  const isSuperAdmin = session?.role === "SUPER_ADMIN";

  let clientScopeIds: string[] | null = null;
  if (!isSuperAdmin && !session?.clientId) {
    const owned = await prisma.client.findMany({
      where: { ownerId: session?.userId },
      select: { id: true },
    });
    clientScopeIds = owned.map((c) => c.id);
  }

  const where: Record<string, unknown> = {
    ...(session?.clientId
      ? { clientId: session.clientId }
      : clientScopeIds !== null
      ? { clientId: { in: clientScopeIds } }
      : {}),
    ...(searchParams.clientId ? { clientId: searchParams.clientId } : {}),
    ...(searchParams.status ? { status: searchParams.status } : {}),
    ...(searchParams.city ? { city: { contains: searchParams.city, mode: "insensitive" } } : {}),
  };

  const [properties, clients] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { name: true, primaryColor: true } },
        _count: { select: { propertyLeads: true } },
      },
    }),
    session?.clientId
      ? Promise.resolve([] as { id: string; name: string }[])
      : prisma.client.findMany({
          where: isSuperAdmin ? {} : { ownerId: session?.userId },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
  ]);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">נכסים</h1>
          <p className="text-sm text-slate-500 mt-0.5">{properties.length} נכסים</p>
        </div>
        <Link
          href="/admin/properties/new"
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          נכס חדש
        </Link>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3 bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
        {!session?.clientId && (
          <select
            name="clientId"
            defaultValue={searchParams.clientId ?? ""}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">כל הלקוחות</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
        <select
          name="status"
          defaultValue={searchParams.status ?? ""}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">כל הסטטוסים</option>
          <option value="AVAILABLE">זמין</option>
          <option value="UNDER_CONTRACT">בתהליך</option>
          <option value="SOLD">נמכר</option>
        </select>
        <input
          name="city"
          type="text"
          placeholder="עיר..."
          defaultValue={searchParams.city ?? ""}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          סנן
        </button>
      </form>

      {/* Grid */}
      {properties.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-20">
          <Home size={32} className="text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">לא נמצאו נכסים.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {properties.map((p) => {
            const Icon = TYPE_ICONS[p.propertyType] ?? Home;
            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Image placeholder */}
                <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 rounded-t-xl flex items-center justify-center">
                  <Icon size={36} className="text-slate-400" />
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-slate-900 text-sm leading-tight flex-1 ml-2">
                      {p.title}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[p.status] ?? "bg-slate-100 text-slate-500"}`}>
                      {STATUS_HE[p.status] ?? p.status}
                    </span>
                  </div>

                  <p className="text-xl font-bold text-slate-900 mb-1">
                    ₪{p.price.toLocaleString("he-IL")}
                  </p>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mb-3">
                    <span>{p.city}{p.neighborhood ? `, ${p.neighborhood}` : ""}</span>
                    {p.rooms && <span>{p.rooms} חדרים</span>}
                    {p.area && <span>{p.area} מ"ר</span>}
                    <span className="text-slate-400">{TYPE_HE[p.propertyType] ?? p.propertyType}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <span className="text-xs text-slate-400">
                      {p._count.propertyLeads} לידים מתאימים
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded font-medium text-white"
                      style={{ backgroundColor: p.client.primaryColor }}
                    >
                      {p.client.name}
                    </span>
                  </div>

                  {/* Broadcast button — only for available properties */}
                  {p.status === "AVAILABLE" && (
                    <div className="mt-3 pt-3 border-t border-slate-50">
                      <PropertyBroadcastButton propertyId={p.id} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
