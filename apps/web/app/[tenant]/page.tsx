import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LandingPageView } from "./LandingPageView";
import { AgentPageView } from "./AgentPageView";
import BlockRenderer from "@/components/builder/BlockRenderer";
import type { Block } from "@/types/builder";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { LiveChat } from "@/components/LiveChat";
import { AbTestRenderer } from "./AbTestRenderer";
import Script from "next/script";

export async function generateMetadata({
  params,
}: {
  params: { tenant: string };
}): Promise<Metadata> {
  const client = await prisma.client.findUnique({
    where: { slug: params.tenant },
    select: { name: true, landingPageTitle: true, landingPageSubtitle: true, landingPageLogo: true },
  });
  if (!client) return {};
  const title = client.landingPageTitle ?? client.name;
  const description = client.landingPageSubtitle ?? `${client.name} — שירותים מקצועיים`;
  return {
    title: `${title} | ${client.name}`,
    description,
    openGraph: {
      title: `${title} | ${client.name}`,
      description,
      images: client.landingPageLogo ? [{ url: client.landingPageLogo }] : undefined,
    },
    twitter: {
      card: "summary",
      title: `${title} | ${client.name}`,
      description,
    },
  };
}

export default async function ClientLandingPage({
  params,
  searchParams,
}: {
  params: { tenant: string };
  searchParams: Record<string, string>;
}) {
  const client = await prisma.client.findUnique({
    where: { slug: params.tenant },
    select: {
      id: true,
      name: true,
      slug: true,
      phone: true,
      primaryColor: true,
      isActive: true,
      industry: true,
      whatsappNumber: true,
      landingPageTitle: true,
      landingPageSubtitle: true,
      landingPageCta: true,
      landingPageColor: true,
      landingPageLogo: true,
      landingPageActive: true,
      pageBlocks: true,
      pagePublished: true,
      abTestEnabled: true,
      pageBlocksB: true,
      pagePublishedB: true,
      agentPhone: true,
      agentBio: true,
      agentPhoto: true,
      agentCity: true,
      agentExperience: true,
      googleAnalyticsId: true,
    },
  });

  if (!client || !client.isActive) return notFound();

  const gaId = client.googleAnalyticsId ?? null;

  // If page builder is published, render it (with optional A/B testing)
  if (client.pagePublished && client.pageBlocks && Array.isArray(client.pageBlocks)) {
    const blocksA = client.pageBlocks as Block[];
    const blocksB = client.abTestEnabled && Array.isArray(client.pageBlocksB) ? client.pageBlocksB as Block[] : [];
    const isAbTest = client.abTestEnabled && blocksB.length > 0;

    return (
      <>
        {gaId && <GoogleAnalytics measurementId={gaId} />}
        {isAbTest ? (
          <AbTestRenderer
            clientId={client.id}
            clientSlug={client.slug}
            clientName={client.name}
            whatsappNumber={client.whatsappNumber ?? undefined}
            blocksA={blocksA}
            blocksB={blocksB}
          />
        ) : (
          <BlockRenderer
            blocks={blocksA}
            clientSlug={client.slug}
            whatsappNumber={client.whatsappNumber ?? undefined}
            clientName={client.name}
          />
        )}
        {client.whatsappNumber && (
          <LiveChat whatsappNumber={client.whatsappNumber} businessName={client.name} />
        )}
      </>
    );
  }

  if (client.industry === "REAL_ESTATE") {
    const [properties, activeCount, soldCount] = await Promise.all([
      prisma.property.findMany({
        where: { clientId: client.id, status: { in: ["AVAILABLE", "SOLD"] } },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          slug: true,
          title: true,
          price: true,
          rooms: true,
          area: true,
          floor: true,
          city: true,
          neighborhood: true,
          propertyType: true,
          status: true,
          images: true,
          isFeatured: true,
          isExclusive: true,
        },
      }),
      prisma.property.count({ where: { clientId: client.id, status: "AVAILABLE" } }),
      prisma.property.count({ where: { clientId: client.id, status: "SOLD" } }),
    ]);

    const agentJsonLd = {
      "@context": "https://schema.org",
      "@type": "RealEstateAgent",
      name: client.name,
      telephone: client.phone ?? client.agentPhone ?? undefined,
      image: client.agentPhoto ?? client.landingPageLogo ?? undefined,
      address: client.agentCity ? {
        "@type": "PostalAddress",
        addressLocality: client.agentCity,
        addressCountry: "IL",
      } : undefined,
      numberOfEmployees: { "@type": "QuantitativeValue", value: 1 },
    };

    return (
      <>
        {gaId && <GoogleAnalytics measurementId={gaId} />}
        <Script
          id="jsonld-agent"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(agentJsonLd) }}
        />
        <AgentPageView
          client={client}
          properties={properties}
          stats={{ activeProperties: activeCount, soldProperties: soldCount }}
        />
        {client.whatsappNumber && (
          <LiveChat whatsappNumber={client.whatsappNumber} businessName={client.name} />
        )}
      </>
    );
  }

  const utmParams = {
    utm_source:   searchParams.utm_source   ?? null,
    utm_medium:   searchParams.utm_medium   ?? null,
    utm_campaign: searchParams.utm_campaign ?? null,
    utm_content:  searchParams.utm_content  ?? null,
    utm_term:     searchParams.utm_term     ?? null,
  };

  return (
    <>
      {gaId && <GoogleAnalytics measurementId={gaId} />}
      <LandingPageView client={client} utmParams={utmParams} />
    </>
  );
}
