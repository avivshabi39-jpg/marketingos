import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { LeadFormClient } from "./LeadFormClient";
import { LandingPageClient } from "./LandingPageClient";

export async function generateMetadata({
  params,
}: {
  params: { tenant: string; slug: string };
}) {
  const client = await prisma.client.findUnique({ where: { slug: params.tenant } });
  if (!client) return {};

  // Try LandingPage first for metadata
  const lp = await prisma.landingPage.findFirst({
    where: { clientId: client.id, slug: params.slug, isPublished: true },
  });
  if (lp) return { title: lp.metaTitle ?? lp.title };

  // Try LeadForm
  const form = await prisma.leadForm.findUnique({
    where: { clientId_slug: { clientId: client.id, slug: params.slug } },
  });
  if (form) return { title: `${form.name} — ${client.name}` };

  return {};
}

export default async function TenantSlugPage({
  params,
  searchParams,
}: {
  params: { tenant: string; slug: string };
  searchParams: Record<string, string>;
}) {
  // Guard: /[tenant]/intake is handled by its own route
  if (params.slug === "intake") return notFound();

  const client = await prisma.client.findUnique({
    where: { slug: params.tenant },
    select: { id: true, name: true, slug: true, primaryColor: true, isActive: true, industry: true, whatsappNumber: true },
  });
  if (!client || !client.isActive) return notFound();

  // ── Try template-based LandingPage ──────────────────────────────────────────
  const lp = await prisma.landingPage.findFirst({
    where: { clientId: client.id, slug: params.slug, isPublished: true },
    include: { template: true },
  });

  if (lp) {
    const templateVars = (lp.template.variables as { key: string; defaultValue: string }[]).reduce<
      Record<string, string>
    >((acc, v) => ({ ...acc, [v.key]: v.defaultValue }), {});

    const merged = {
      ...templateVars,
      primaryColor: client.primaryColor,
      ...(lp.customVars as Record<string, string>),
    };

    function renderTemplate(html: string, vars: Record<string, string>) {
      return html.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
    }

    return (
      <LandingPageClient
        html={renderTemplate(lp.template.htmlContent, merged)}
        css={lp.template.cssContent ? renderTemplate(lp.template.cssContent, merged) : ""}
        clientId={client.id}
        landingPageId={lp.id}
      />
    );
  }

  // ── Try dynamic LeadForm ─────────────────────────────────────────────────────
  const form = await prisma.leadForm.findUnique({
    where: { clientId_slug: { clientId: client.id, slug: params.slug } },
    select: {
      id: true,
      name: true,
      formType: true,
      thankYouMessage: true,
      redirectUrl: true,
      isActive: true,
    },
  });
  if (!form || !form.isActive) return notFound();

  const utmParams = {
    utm_source:   searchParams.utm_source   ?? null,
    utm_medium:   searchParams.utm_medium   ?? null,
    utm_campaign: searchParams.utm_campaign ?? null,
    utm_content:  searchParams.utm_content  ?? null,
    utm_term:     searchParams.utm_term     ?? null,
  };

  return <LeadFormClient client={{ ...client, whatsappNumber: client.whatsappNumber ?? null }} form={form} utmParams={utmParams} />;
}
