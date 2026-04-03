export function getClientUrl(slug: string): string {
  if (process.env.NODE_ENV === "production") {
    return `https://${slug}.marketingos.co.il`;
  }
  return `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/client/${slug}`;
}

export function getIntakeUrl(slug: string): string {
  if (process.env.NODE_ENV === "production") {
    return `https://${slug}.marketingos.co.il/intake`;
  }
  return `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/intake/${slug}`;
}
