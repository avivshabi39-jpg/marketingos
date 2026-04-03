import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";
import { Plus, Eye, MessageCircle, Users, Building2, Edit } from "lucide-react";
import { PropertiesActions } from "./PropertiesActions";

const PROPERTY_TYPE_HE: Record<string, string> = {
  APARTMENT: "דירה",
  HOUSE: "בית פרטי",
  PENTHOUSE: "פנטהאוז",
  GARDEN_APARTMENT: "דירת גן",
  DUPLEX: "דופלקס",
  STUDIO: "סטודיו",
  COMMERCIAL: "מסחרי",
  LAND: "קרקע",
};

const STATUS_HE: Record<string, string> = {
  AVAILABLE: "זמין",
  UNDER_CONTRACT: "בתהליך",
  SOLD: "נמכר",
  OFF_MARKET: "לא בשוק",
};

const STATUS_COLOR: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-700",
  UNDER_CONTRACT: "bg-yellow-100 text-yellow-700",
  SOLD: "bg-gray-100 text-gray-600",
  OFF_MARKET: "bg-red-100 text-red-600",
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(price);
}

export default async function ClientPropertiesPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getClientSession();
  if (!session || session.slug !== params.slug) {
    redirect(`/client/${params.slug}/login`);
  }

  const client = await prisma.client.findUnique({
    where: { slug: params.slug },
    select: { id: true, isActive: true },
  });

  if (!client || !client.isActive) notFound();

  const properties = await prisma.property.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      price: true,
      rooms: true,
      area: true,
      city: true,
      neighborhood: true,
      propertyType: true,
      status: true,
      images: true,
      views: true,
      waClicks: true,
      isFeatured: true,
      isExclusive: true,
      createdAt: true,
      _count: { select: { directLeads: true } },
    },
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">הנכסים שלי</h1>
          <p className="text-gray-500 mt-0.5 text-sm">{properties.length} נכסים בסה&quot;כ</p>
        </div>
        <Link
          href={`/client/${params.slug}/properties/new`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap flex-shrink-0"
        >
          <Plus size={16} />
          הוסף נכס
        </Link>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {properties.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Building2 size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">אין נכסים עדיין</p>
            <p className="text-gray-400 text-sm mt-1 mb-5">הוסף את הנכס הראשון שלך כדי להתחיל</p>
            <Link
              href={`/client/${params.slug}/properties/new`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus size={16} />
              הוסף נכס ראשון
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {["נכס", "מחיר", "סטטוס", "סטטיסטיקות", "פעולות"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {properties.map((property) => (
                    <tr key={property.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Property info */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {/* Thumbnail */}
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {property.images && property.images.length > 0 ? (
                              <Image
                                src={property.images[0]}
                                alt={property.title}
                                width={56}
                                height={56}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Building2 size={20} className="text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                              {property.title}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {PROPERTY_TYPE_HE[property.propertyType] ?? property.propertyType}
                              {property.city ? ` · ${property.city}` : ""}
                              {property.neighborhood ? `, ${property.neighborhood}` : ""}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {property.rooms != null && (
                                <span className="text-xs text-gray-400">{property.rooms} חד׳</span>
                              )}
                              {property.area != null && (
                                <span className="text-xs text-gray-400">{property.area} מ&quot;ר</span>
                              )}
                              {property.isExclusive && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">
                                  בלעדי
                                </span>
                              )}
                              {property.isFeatured && (
                                <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                                  מומלץ
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatPrice(property.price)}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${
                            STATUS_COLOR[property.status] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {STATUS_HE[property.status] ?? property.status}
                        </span>
                      </td>

                      {/* Stats */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1" title="צפיות">
                            <Eye size={12} />
                            {property.views}
                          </span>
                          <span className="flex items-center gap-1" title="וואטסאפ">
                            <MessageCircle size={12} />
                            {property.waClicks}
                          </span>
                          <span className="flex items-center gap-1" title="לידים">
                            <Users size={12} />
                            {property._count.directLeads}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 justify-end flex-wrap">
                          <Link
                            href={`/client/${params.slug}/properties/${property.id}/edit`}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors whitespace-nowrap"
                          >
                            <Edit size={12} />
                            עריכה
                          </Link>
                          <PropertiesActions
                            propertyId={property.id}
                            currentStatus={property.status}
                            slug={params.slug}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {properties.map((property) => (
                <div key={property.id} className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {property.images && property.images.length > 0 ? (
                        <Image
                          src={property.images[0]}
                          alt={property.title}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 size={22} className="text-gray-300" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {property.title}
                        </p>
                        <span
                          className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                            STATUS_COLOR[property.status] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {STATUS_HE[property.status] ?? property.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {PROPERTY_TYPE_HE[property.propertyType] ?? property.propertyType}
                        {property.city ? ` · ${property.city}` : ""}
                      </p>
                      <p className="text-sm font-semibold text-gray-800 mt-1">
                        {formatPrice(property.price)}
                      </p>

                      {/* Stats row */}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Eye size={11} />
                          {property.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle size={11} />
                          {property.waClicks}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={11} />
                          {property._count.directLeads}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile action row */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                    <Link
                      href={`/client/${params.slug}/properties/${property.id}/edit`}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                    >
                      <Edit size={12} />
                      עריכה
                    </Link>
                    <PropertiesActions
                      propertyId={property.id}
                      currentStatus={property.status}
                      slug={params.slug}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
