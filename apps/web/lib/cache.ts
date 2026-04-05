/**
 * Cache layer — Vercel KV (Redis) with in-memory fallback.
 * Falls back to memory store if KV env vars are not configured.
 */

// ─── In-memory store (fallback + dev) ────────────────────────────────────────

type Entry = { value: unknown; expiresAt: number };
const store = new Map<string, Entry>();

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of store) {
    if (v.expiresAt < now) store.delete(k);
  }
}, 120_000);

// ─── Vercel KV client (lazy init) ────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let kvClient: any = null;
let kvChecked = false;

async function getKV() {
  if (kvChecked) return kvClient;
  kvChecked = true;
  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const mod = await import("@vercel/kv");
      kvClient = mod.kv;
    }
  } catch {}
  return kvClient;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const kv = await getKV();
    if (kv) return (await kv.get(key)) as T | null;
    const entry = store.get(key);
    if (entry && Date.now() < entry.expiresAt) return entry.value as T;
    store.delete(key);
    return null;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds = 60
): Promise<void> {
  try {
    const kv = await getKV();
    if (kv) {
      await kv.set(key, value, { ex: ttlSeconds });
      return;
    }
    store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  } catch {}
}

export async function cacheDelete(pattern: string): Promise<void> {
  try {
    const kv = await getKV();
    if (kv) {
      const keys = await kv.keys(`${pattern}*`);
      if (keys.length) await Promise.all(keys.map((k: string) => kv.del(k)));
      return;
    }
    for (const key of store.keys()) {
      if (key.startsWith(pattern)) store.delete(key);
    }
  } catch {}
}

// ─── withCache helper ────────────────────────────────────────────────────────

/**
 * Fetch from cache or compute fresh value.
 * Usage: const data = await withCache('key', 60, () => prisma.x.findMany())
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;
  const fresh = await fetcher();
  cacheSet(key, fresh, ttlSeconds).catch(() => {});
  return fresh;
}

// ─── Cache TTL presets ───────────────────────────────────────────────────────

export const CACHE_TTL = {
  LANDING_PAGE: 60,
  DASHBOARD: 60,
  CLIENT_LIST: 30,
  ANALYTICS: 300,
  HEALTH: 60,
  SEO_SCORE: 600,
  SYSTEM_STATS: 120,
} as const;

// ─── Cache key builders ──────────────────────────────────────────────────────

export const CacheKeys = {
  landingPage: (slug: string) => `page:${slug}`,
  seoScore: (clientId: string) => `seo:${clientId}`,
  analytics: (clientId: string) => `analytics:${clientId}`,
  systemHealth: () => "system:health",
  dashboard: (userId: string) => `dashboard:${userId}`,
  clientList: (userId: string) => `clients:${userId}`,
};
