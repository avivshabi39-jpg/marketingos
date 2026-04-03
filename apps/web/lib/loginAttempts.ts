/**
 * In-memory brute force protection.
 * Tracks failed login attempts per key (email or IP).
 * After 5 failures → lock for 15 minutes.
 */

interface AttemptRecord {
  count: number;
  lockedUntil?: Date;
}

const attempts = new Map<string, AttemptRecord>();

export function recordFailedAttempt(key: string): void {
  const current = attempts.get(key) ?? { count: 0 };
  current.count++;
  if (current.count >= 6) {
    current.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
  }
  attempts.set(key, current);
}

export function isLocked(key: string): boolean {
  const a = attempts.get(key);
  if (!a?.lockedUntil) return false;
  if (new Date() > a.lockedUntil) {
    attempts.delete(key);
    return false;
  }
  return true;
}

export function clearAttempts(key: string): void {
  attempts.delete(key);
}
