import { prisma } from "@/lib/prisma";
import { triggerN8nWebhook } from "@/lib/webhooks";

type LeadMetadata = {
  budget?: number;
  rooms?: number;
  city?: string;
  area?: number;
};

function parseMetadata(meta: unknown): LeadMetadata {
  if (!meta || typeof meta !== "object") return {};
  const m = meta as Record<string, unknown>;
  return {
    budget: typeof m.budget === "number" ? m.budget : undefined,
    rooms: typeof m.rooms === "number" ? m.rooms : undefined,
    city: typeof m.city === "string" ? m.city : undefined,
    area: typeof m.area === "number" ? m.area : undefined,
  };
}

function scoreProperty(
  property: {
    price: number;
    rooms: number | null;
    area: number | null;
    city: string;
    status: string;
  },
  preferences: LeadMetadata
): number {
  if (property.status !== "AVAILABLE") return 0;

  let score = 0;
  let maxScore = 0;

  // Budget match (±20% tolerance) — weight 40
  if (preferences.budget) {
    maxScore += 40;
    const diff = Math.abs(property.price - preferences.budget) / preferences.budget;
    if (diff <= 0.1) score += 40;
    else if (diff <= 0.2) score += 30;
    else if (diff <= 0.3) score += 15;
  }

  // Rooms match — weight 30
  if (preferences.rooms && property.rooms) {
    maxScore += 30;
    const diff = Math.abs(property.rooms - preferences.rooms);
    if (diff === 0) score += 30;
    else if (diff <= 0.5) score += 20;
    else if (diff <= 1) score += 10;
  }

  // City match — weight 20
  if (preferences.city && property.city) {
    maxScore += 20;
    if (property.city.toLowerCase().includes(preferences.city.toLowerCase())) {
      score += 20;
    }
  }

  // Area match (±25% tolerance) — weight 10
  if (preferences.area && property.area) {
    maxScore += 10;
    const diff = Math.abs(property.area - preferences.area) / preferences.area;
    if (diff <= 0.15) score += 10;
    else if (diff <= 0.25) score += 5;
  }

  if (maxScore === 0) return 50; // No preferences = neutral match
  return Math.round((score / maxScore) * 100);
}

export async function matchLeadToProperties(leadId: string): Promise<void> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      clientId: true,
      firstName: true,
      lastName: true,
      metadata: true,
    },
  });

  if (!lead) return;

  const preferences = parseMetadata(lead.metadata);

  const properties = await prisma.property.findMany({
    where: { clientId: lead.clientId, status: "AVAILABLE" },
    select: { id: true, price: true, rooms: true, area: true, city: true, status: true, title: true },
  });

  if (properties.length === 0) return;

  const matches = properties
    .map((p) => ({ property: p, score: scoreProperty(p, preferences) }))
    .filter((m) => m.score >= 40)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (matches.length === 0) return;

  // Create PropertyLead records for top matches
  await Promise.all(
    matches.map((m) =>
      prisma.propertyLead.upsert({
        where: { leadId_propertyId: { leadId: lead.id, propertyId: m.property.id } },
        create: {
          leadId: lead.id,
          propertyId: m.property.id,
          matchScore: m.score,
        },
        update: { matchScore: m.score },
      })
    )
  );

  // Trigger webhook with matched properties
  triggerN8nWebhook(lead.clientId, "lead.properties_matched", {
    lead: { id: lead.id, name: `${lead.firstName} ${lead.lastName}` },
    matches: matches.map((m) => ({
      propertyId: m.property.id,
      title: m.property.title,
      score: m.score,
      price: m.property.price,
      city: m.property.city,
    })),
  }).catch(() => {});
}
