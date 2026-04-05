import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";
import { withCache, CacheKeys, CACHE_TTL } from "@/lib/cache";

interface SeoCheck {
  name: string;
  passed: boolean;
  impact: "high" | "medium" | "low";
  tip: string;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  const clientSession = !session ? await getClientSession() : null;
  if (!session && !clientSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (clientSession && clientSession.clientId !== params.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await withCache(
    CacheKeys.seoScore(params.id),
    CACHE_TTL.SEO_SCORE,
    () => computeSeoScore(params.id)
  );

  return NextResponse.json(result);
}

async function computeSeoScore(clientId: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      name: true,
      slug: true,
      pagePublished: true,
      pageBlocks: true,
      landingPageTitle: true,
      seoDescription: true,
      seoKeywords: true,
      logoUrl: true,
      phone: true,
      email: true,
      customDomain: true,
      customDomainVerified: true,
      _count: { select: { leads: true } },
    },
  });

  if (!client) {
    return { score: 0, grade: "F", checks: [], topTips: [], totalLeads: 0 };
  }

  const blocks = Array.isArray(client.pageBlocks)
    ? (client.pageBlocks as Record<string, unknown>[])
    : [];
  const heroBlock = blocks.find(
    (b) => b.type === "hero"
  ) as Record<string, unknown> | undefined;
  const heroContent = heroBlock?.content as Record<string, string> | undefined;
  const testimonialCount = blocks.filter(
    (b) => b.type === "testimonial" || b.type === "testimonials"
  ).length;
  const hasForm = blocks.some(
    (b) => b.type === "form" || b.type === "cta" || b.type === "whatsapp"
  );

  const checks: SeoCheck[] = [
    {
      name: "דף נחיתה פורסם",
      passed: !!client.pagePublished,
      impact: "high",
      tip: "פרסם את הדף שלך כדי שגוגל יוכל לאנדקס אותו",
    },
    {
      name: "כותרת SEO הוגדרה",
      passed: !!(
        client.landingPageTitle && client.landingPageTitle.length > 10
      ),
      impact: "high",
      tip: 'הוסף כותרת SEO בהגדרות → הדף שלי (60 תווים)',
    },
    {
      name: "תיאור Meta הוגדר",
      passed: !!(
        client.seoDescription && client.seoDescription.length > 50
      ),
      impact: "high",
      tip: 'הוסף תיאור Meta בהגדרות → הדף שלי (160 תווים)',
    },
    {
      name: "כותרת Hero קיימת",
      passed: !!(heroContent?.title && heroContent.title.length > 5),
      impact: "high",
      tip: "הדף שלך חייב כותרת ראשית ברורה",
    },
    {
      name: "טלפון קיים בדף",
      passed: !!client.phone,
      impact: "medium",
      tip: "הוסף מספר טלפון בהגדרות → פרטי העסק",
    },
    {
      name: "המלצות לקוחות קיימות",
      passed: testimonialCount >= 2,
      impact: "medium",
      tip: "הוסף לפחות 2 המלצות לקוחות לדף",
    },
    {
      name: "טופס צור קשר קיים",
      passed: hasForm,
      impact: "high",
      tip: "הדף חייב להכיל טופס לקבלת לידים",
    },
    {
      name: "לוגו קיים",
      passed: !!client.logoUrl,
      impact: "low",
      tip: "הוסף לוגו לעסק שלך",
    },
    {
      name: "דומיין מותאם מחובר",
      passed: !!(client.customDomain && client.customDomainVerified),
      impact: "medium",
      tip: 'חבר דומיין משלך בהגדרות → הדף שלי',
    },
    {
      name: "מילות מפתח הוגדרו",
      passed: !!(client.seoKeywords && client.seoKeywords.length > 5),
      impact: "medium",
      tip: "הוסף מילות מפתח רלוונטיות בהגדרות SEO",
    },
  ];

  const weights: Record<string, number> = { high: 3, medium: 2, low: 1 };
  const maxScore = checks.reduce((s, c) => s + weights[c.impact], 0);
  const score = checks
    .filter((c) => c.passed)
    .reduce((s, c) => s + weights[c.impact], 0);

  const percentage = Math.round((score / maxScore) * 100);

  const grade =
    percentage >= 90
      ? "A"
      : percentage >= 75
        ? "B"
        : percentage >= 60
          ? "C"
          : percentage >= 40
            ? "D"
            : "F";

  const topTips = checks
    .filter((c) => !c.passed)
    .sort((a, b) => weights[b.impact] - weights[a.impact])
    .slice(0, 3)
    .map((c) => c.tip);

  return {
    score: percentage,
    grade,
    checks,
    topTips,
    totalLeads: client._count.leads,
  };
}
