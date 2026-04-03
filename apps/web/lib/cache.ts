/**
 * Lightweight in-memory cache for short-lived API responses.
 * Suitable for single-instance deployments (Vercel serverless / single server).
 * TTL is in seconds.
 */

type Entry = { value: unknown; expiresAt: number };
const store = new Map<string, Entry>();

// Cleanup every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of store) {
    if (v.expiresAt < now) store.delete(k);
  }
}, 120_000);

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry || entry.expiresAt < Date.now()) return null;
  return entry.value as T;
}

export function cacheSet(key: string, value: unknown, ttlSeconds: number) {
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export function cacheDelete(pattern: string) {
  for (const key of store.keys()) {
    if (key.startsWith(pattern)) store.delete(key);
  }
}
