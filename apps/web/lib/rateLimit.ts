/**
 * In-memory rate limiter.
 * Uses a sliding window per IP address.
 * NOTE: Resets on server restart and does not share state across instances.
 *       For multi-instance deployments, replace with Redis-backed solution.
 */

type Bucket = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Bucket>();

// Periodically clean up expired buckets to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of store) {
    if (bucket.resetAt < now) store.delete(key);
  }
}, 60_000);

export type RateLimitConfig = {
  /** Max requests allowed per window */
  max: number;
  /** Window duration in milliseconds */
  windowMs: number;
};

const PRESETS: Record<string, RateLimitConfig> = {
  leads:     { max: 10,  windowMs: 60_000 },
  login:     { max: 10,  windowMs: 60_000 },
  register:  { max: 3,   windowMs: 60_000 },
  intake:    { max: 20,  windowMs: 60_000 },
  broadcast: { max: 3,   windowMs: 300_000 }, // 3 broadcasts per 5 min
  api:       { max: 120, windowMs: 60_000 },  // general API throttle
};

/**
 * Returns null if the request is within limits.
 * Returns a { retryAfter } object if the limit has been exceeded.
 */
export function rateLimit(
  ip: string,
  preset: keyof typeof PRESETS
): { retryAfter: number } | null {
  const { max, windowMs } = PRESETS[preset];
  const now = Date.now();
  const key = `${preset}:${ip}`;

  const bucket = store.get(key);

  if (!bucket || bucket.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (bucket.count >= max) {
    return { retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count++;
  return null;
}

/**
 * Extract the real IP from a Next.js request.
 * Reads x-forwarded-for (Vercel/proxies) or falls back to localhost.
 */
export function getIp(req: Request): string {
  const forwarded = (req.headers as Headers).get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "127.0.0.1";
}
