import { NextResponse } from "next/server";

export async function GET() {
  const content = [
    "Contact: mailto:security@marketingos.co.il",
    "Preferred-Languages: he, en",
    "Canonical: https://marketingos.co.il/.well-known/security.txt",
    `Expires: ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()}`,
  ].join("\n");

  return new NextResponse(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
