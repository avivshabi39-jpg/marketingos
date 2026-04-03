import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getClientSession } from "@/lib/clientAuth";
import { checkAiRateLimit } from "@/lib/ai";

interface PropertyDescriptionBody {
  title: string;
  city: string;
  neighborhood?: string;
  rooms?: number | string;
  area?: number | string;
  floor?: number | string;
  totalFloors?: number | string;
  propertyType: string;
  price: number | string;
  features?: string[];
}

interface AnthropicResponse {
  content: Array<{ type: string; text: string }>;
}

// POST /api/ai/property-description — Requires admin OR client portal session.
// Body: { title, city, neighborhood?, rooms?, area?, floor?, totalFloors?, propertyType, price, features? }
// Returns: { description: string }
export async function POST(req: NextRequest) {
  // Require either an admin session or a client portal session
  const [adminSession, clientSession] = await Promise.all([
    getSession(),
    getClientSession(),
  ]);

  if (!adminSession && !clientSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (adminSession) {
    const rate = await checkAiRateLimit(adminSession.userId);
    if (!rate.ok) {
      return NextResponse.json({ error: `הגעת למגבלת ${rate.limit} קריאות AI ליום.` }, { status: 429 });
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  let body: PropertyDescriptionBody;
  try {
    body = (await req.json()) as PropertyDescriptionBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    title,
    city,
    neighborhood,
    rooms,
    area,
    floor,
    totalFloors,
    propertyType,
    price,
    features,
  } = body;

  if (!title || !city || !propertyType || !price) {
    return NextResponse.json(
      { error: "Missing required fields: title, city, propertyType, price" },
      { status: 400 }
    );
  }

  // Build a details string from all provided fields
  const detailLines: string[] = [
    `סוג נכס: ${propertyType}`,
    `כותרת: ${title}`,
    `עיר: ${city}`,
  ];
  if (neighborhood) detailLines.push(`שכונה: ${neighborhood}`);
  if (rooms) detailLines.push(`חדרים: ${rooms}`);
  if (area) detailLines.push(`שטח: ${area} מ"ר`);
  if (floor !== undefined && floor !== null && floor !== "")
    detailLines.push(`קומה: ${floor}${totalFloors ? ` מתוך ${totalFloors}` : ""}`);
  detailLines.push(`מחיר: ${Number(price).toLocaleString("he-IL")} ₪`);
  if (features && features.length > 0)
    detailLines.push(`מאפיינים: ${features.join(", ")}`);

  const prompt = `אתה כותב תיאורי נכסים מקצועיים בעברית עבור אתר תיווך נדל"ן.

כתוב תיאור נכס בעברית בן 3 פסקאות, מקצועי ומושך, באורך 150-200 מילים.
התיאור צריך להציג את פרטי הנכס בצורה טבעית ונעימה לקריאה — אל תפרט את הנתונים כרשימה יבשה, אלא שלב אותם בצורה אורגנית בתוך הטקסט.

פרטי הנכס:
${detailLines.join("\n")}

החזר את התיאור בלבד, ללא כותרת, ללא הקדמה, וללא הסברים נוספים.`;

  let anthropicRes: Response;
  try {
    anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch (err) {
    console.error("[property-description] fetch error", err);
    return NextResponse.json(
      { error: "Failed to reach AI service" },
      { status: 502 }
    );
  }

  if (!anthropicRes.ok) {
    const errBody = await anthropicRes.json().catch(() => ({}));
    console.error("[property-description] Anthropic error", errBody);
    return NextResponse.json(
      { error: "AI service error" },
      { status: 502 }
    );
  }

  const data = (await anthropicRes.json()) as AnthropicResponse;
  const description = data?.content?.[0]?.text ?? "";

  return NextResponse.json({ description });
}
