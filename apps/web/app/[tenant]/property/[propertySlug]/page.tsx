import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Script from "next/script";
import { PropertyPageClient } from "./PropertyPageClient";

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { tenant: string; propertySlug: string };
}): Promise<Metadata> {
  const propertySlug = decodeURIComponent(params.propertySlug);
  const property = await prisma.property.findFirst({
    where: {
      slug: propertySlug,
      client: { slug: params.tenant, isActive: true },
    },
    select: {
      title: true,
      description: true,
      rooms: true,
      city: true,
      images: true,
      client: { select: { name: true } },
    },
  });

  if (!property) return {};

  const description =
    property.description?.slice(0, 160) ??
    `${property.rooms ?? ""} חדרים ב${property.city}`.trim();

  return {
    title: `${property.title} | ${property.client.name}`,
    description,
    openGraph: {
      title: `${property.title} | ${property.client.name}`,
      description,
      images: property.images[0] ? [{ url: property.images[0] }] : undefined,
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PropertyPage({
  params,
}: {
  params: { tenant: string; propertySlug: string };
}) {
  const propertySlug = decodeURIComponent(params.propertySlug);
  const property = await prisma.property.findFirst({
    where: {
      slug: propertySlug,
      client: { slug: params.tenant, isActive: true },
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          slug: true,
          phone: true,
          primaryColor: true,
          whatsappNumber: true,
          agentPhone: true,
          agentBio: true,
          agentPhoto: true,
          agentCity: true,
          agentExperience: true,
        },
      },
    },
  });

  if (!property) return notFound();

  // JSON-LD for real estate listing
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description ?? undefined,
    price: property.price,
    priceCurrency: "ILS",
    address: {
      "@type": "PostalAddress",
      addressLocality: property.city,
      addressRegion: property.neighborhood ?? undefined,
      streetAddress: (property as Record<string, unknown>).street as string | undefined,
      addressCountry: "IL",
    },
    image: property.images,
    numberOfRooms: property.rooms ?? undefined,
    floorSize: property.area ? { "@type": "QuantitativeValue", value: property.area, unitCode: "MTK" } : undefined,
    seller: {
      "@type": "RealEstateAgent",
      name: property.client.name,
    },
  };

  const similarProperties = await prisma.property.findMany({
    where: {
      clientId: property.clientId,
      city: property.city,
      propertyType: property.propertyType,
      status: "AVAILABLE",
      NOT: { id: property.id },
    },
    take: 3,
    select: {
      id: true,
      slug: true,
      title: true,
      price: true,
      rooms: true,
      area: true,
      city: true,
      images: true,
      propertyType: true,
    },
  });

  return (
    <>
      <Script
        id="jsonld-property"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PropertyPageClient
        property={property}
        client={property.client}
        similarProperties={similarProperties}
      />
    </>
  );
}
