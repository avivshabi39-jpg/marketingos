import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") ?? "MarketingOS";
  const color = searchParams.get("color") ?? "#6366f1";
  const sub = searchParams.get("sub") ?? "שירותים מקצועיים";

  return new ImageResponse(
    (
      <div style={{ width: "1200px", height: "630px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${color}15, ${color}35)`, fontFamily: "sans-serif" }}>
        <div style={{ width: "100px", height: "100px", borderRadius: "24px", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "56px", marginBottom: "24px", boxShadow: `0 16px 48px ${color}55` }}>
          🏢
        </div>
        <div style={{ fontSize: "64px", fontWeight: 900, color: "#111827", textAlign: "center", marginBottom: "12px", lineHeight: 1.1 }}>
          {name}
        </div>
        <div style={{ fontSize: "28px", color: "#6b7280", textAlign: "center" }}>
          {sub}
        </div>
        <div style={{ marginTop: "28px", padding: "10px 28px", background: color, borderRadius: "40px", fontSize: "20px", color: "white", fontWeight: 700 }}>
          לחץ לפרטים →
        </div>
        <div style={{ position: "absolute", bottom: "20px", fontSize: "16px", color: "#9ca3af" }}>
          Powered by MarketingOS
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
