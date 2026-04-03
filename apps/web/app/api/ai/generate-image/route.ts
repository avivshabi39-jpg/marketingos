import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";
import { callClaude, checkAiRateLimit, trackAiUsage } from "@/lib/ai";

const SIZES: Record<string, { w: number; h: number }> = {
  instagram: { w: 1080, h: 1080 },
  facebook: { w: 1200, h: 630 },
  story: { w: 1080, h: 1920 },
  linkedin: { w: 1200, h: 627 },
  whatsapp: { w: 800, h: 800 },
};

// GET: list past AI-generated images
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = req.nextUrl.searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);

  const [images, usedThisMonth] = await Promise.all([
    prisma.campaignImage.findMany({
      where: { clientId, template: "ai_photo" },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.campaignImage.count({
      where: { clientId, template: "ai_photo", createdAt: { gte: thisMonth } },
    }),
  ]);

  return NextResponse.json({ images, usedThisMonth });
}

// POST: generate a new AI image
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI לא מוגדר" }, { status: 503 });
  }

  const rate = await checkAiRateLimit(session.userId);
  if (!rate.ok) {
    return NextResponse.json({ error: `הגעת למגבלת ${rate.limit} קריאות AI ליום.` }, { status: 429 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    clientId?: string;
    description?: string;
    style?: string;
    platform?: string;
    colors?: string;
  };

  const { clientId, description, style = "modern", platform = "instagram", colors } = body;
  if (!clientId || !description?.trim()) {
    return NextResponse.json({ error: "חסר תיאור או לקוח" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, name: true, industry: true, ownerId: true },
  });
  if (!client) return NextResponse.json({ error: "לקוח לא נמצא" }, { status: 404 });
  if (!isSuperAdmin(session) && client.ownerId !== session.userId) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  // Step 1: Claude enhances the Hebrew description to an English prompt
  const enhancePrompt = `You are an expert prompt engineer for AI image generation.
Convert this Hebrew marketing image request into a detailed English prompt.

Business: ${client.name}
Industry: ${client.industry ?? "general"}
User description: ${description}
Style: ${style}
${colors ? `Brand colors: ${colors}` : ""}

Write ONLY the image generation prompt in English. No explanation.
Include: specific visual details, lighting, composition, mood, professional quality.
Make it photorealistic and suitable for marketing.
Do NOT include any text or words in the image.`;

  let enhancedPrompt: string;
  try {
    const result = await callClaude(enhancePrompt, 300);
    enhancedPrompt = result.text.trim();
    await trackAiUsage(session.userId, "generate-image", result.inputTokens + result.outputTokens);
  } catch {
    return NextResponse.json({ error: "שגיאת AI" }, { status: 502 });
  }

  // Step 2: Build Pollinations URL
  const size = SIZES[platform] ?? SIZES.instagram;
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${size.w}&height=${size.h}&nologo=true&enhance=true`;

  // Step 3: Save to DB
  const record = await prisma.campaignImage.create({
    data: {
      clientId,
      imageType: platform,
      template: "ai_photo",
      headline: description.slice(0, 200),
      imageUrl,
      settingsJson: { description, style, platform, colors, enhancedPrompt },
    },
  });

  // Usage count
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  const usedThisMonth = await prisma.campaignImage.count({
    where: { clientId, template: "ai_photo", createdAt: { gte: thisMonth } },
  });

  return NextResponse.json({
    ok: true,
    imageUrl,
    enhancedPrompt,
    generationId: record.id,
    usedThisMonth,
  });
}
