import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { callClaude, checkAiRateLimit, trackAiUsage } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  clientId: z.string().min(1),
  imageType: z.enum(["facebook_post", "instagram_post", "instagram_story", "whatsapp"]),
  template: z.enum(["real_estate", "cosmetics", "cleaning", "roofing", "general"]),
  data: z.object({
    headline: z.string().min(1),
    subheadline: z.string().optional(),
    price: z.string().optional(),
    phone: z.string().optional(),
    logoUrl: z.string().optional(),
    backgroundImage: z.string().optional(),
    primaryColor: z.string().optional(),
    businessName: z.string().optional(),
  }),
});

const DIMENSIONS: Record<string, { width: number; height: number }> = {
  facebook_post:    { width: 1200, height: 630 },
  instagram_post:   { width: 1080, height: 1080 },
  instagram_story:  { width: 1080, height: 1920 },
  whatsapp:         { width: 800,  height: 800 },
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateCheck = await checkAiRateLimit(session.userId);
  if (!rateCheck.ok) {
    return NextResponse.json({ error: "חרגת ממגבלת השימוש היומית ב-AI" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { clientId, imageType, template, data } = parsed.data;
  const dims = DIMENSIONS[imageType];
  const primaryColor = data.primaryColor || "#2563eb";

  const bgStyle = data.backgroundImage
    ? `image(${data.backgroundImage})`
    : `linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(primaryColor, -30)} 100%)`;

  const prompt = `Create a beautiful Hebrew marketing campaign SVG image with these exact dimensions: width="${dims.width}" height="${dims.height}".

Template: ${template}
Business: ${data.businessName || "עסק"}
Headline: ${data.headline}
${data.subheadline ? `Sub-headline: ${data.subheadline}` : ""}
${data.price ? `Price: ${data.price}` : ""}
${data.phone ? `Phone: ${data.phone}` : ""}
Primary color: ${primaryColor}
Background: ${data.backgroundImage ? `image URL (use as background): ${data.backgroundImage}` : "gradient"}

Return ONLY a complete valid SVG string, starting with <svg and ending with </svg>.
Requirements:
- Full ${dims.width}x${dims.height} dimensions
- Beautiful gradient background using ${primaryColor}
- Large, bold Hebrew RTL headline text
- Professional business/marketing design
- Brand color elements
- If price provided: show prominently with ₪ symbol
- If phone provided: show with phone icon styling
- Use system Hebrew fonts or specify font-family: "Arial", sans-serif
- Clean, modern, professional look
- Text must be in Hebrew (right-to-left)
- NO external images or fonts
- Decorative geometric shapes for visual interest`;

  try {
    const result = await callClaude(prompt, 3000);
    await trackAiUsage(session.userId, "campaign-image", result.inputTokens + result.outputTokens);

    // Extract SVG from response
    const svgMatch = result.text.match(/<svg[\s\S]*<\/svg>/i);
    if (!svgMatch) {
      return NextResponse.json({ error: "לא ניתן ליצור תמונה" }, { status: 500 });
    }
    const svg = svgMatch[0];

    // Encode SVG as data URL
    const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

    // Save to CampaignImage history
    await prisma.campaignImage.create({
      data: {
        clientId,
        imageType,
        template,
        headline: data.headline,
        imageUrl: svgDataUrl,
        settingsJson: { imageType, template, data },
      },
    });

    return NextResponse.json({ svg, dataUrl: svgDataUrl, dimensions: dims });
  } catch (err) {
    console.error("Campaign image error:", err);
    return NextResponse.json({ error: "שגיאה ביצירת תמונה" }, { status: 500 });
  }
}

// GET - fetch campaign image history for a client
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  const images = await prisma.campaignImage.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return NextResponse.json({ images });
}

function adjustColor(hex: string, amount: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, n));
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `#${[r, g, b].map(c => clamp(c + amount).toString(16).padStart(2, "0")).join("")}`;
}
