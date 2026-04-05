/**
 * Input sanitization helpers — strip HTML/XSS from user-supplied text.
 * Uses isomorphic-dompurify (works in Node.js server-side).
 */
import DOMPurify from "isomorphic-dompurify";

/** Strip all HTML tags, trim, and limit length. Safe for plain-text fields. */
export function sanitizeText(input: string, maxLength = 1000): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] }).trim().slice(0, maxLength);
}

/** Allow a small safe subset of HTML. Safe for rich-text fields. */
export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ["b", "i", "u", "br", "p"],
    ALLOWED_ATTR: [],
  });
}

/** Sanitize a phone number — only digits, spaces, +, -, () */
export function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== "string") return "";
  return phone.trim().replace(/[^0-9+\-\s()]/g, "").slice(0, 20);
}

/** Sanitize an email address */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== "string") return "";
  return email.trim().toLowerCase().replace(/[^a-z0-9@._+\-]/g, "").slice(0, 254);
}

/** Sanitize a URL — only allow http/https */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return "";
  if (/javascript:|data:/i.test(trimmed)) return "";
  return trimmed.slice(0, 2048);
}

// ─── Detection helpers ───────────────────────────────────────────────────────

const XSS_PATTERNS = [
  /<script/i, /<iframe/i, /<object/i, /<embed/i, /<svg/i,
  /javascript:/i, /vbscript:/i, /on\w+\s*=/i, /data:text\/html/i,
];

const SQL_PATTERNS = [
  /\b(DROP|DELETE|INSERT|UPDATE)\s+(TABLE|FROM|INTO)\b/i,
  /\bUNION\s+SELECT\b/i, /\bEXEC\s*\(/i,
  /\bWAITFOR\s+DELAY\b/i, /\bBENCHMARK\s*\(/i,
  /xp_\w+/i,
];

/** Check if string contains XSS attempt */
export function hasXss(input: string): boolean {
  if (!input) return false;
  return XSS_PATTERNS.some((p) => p.test(input));
}

/** Check if string contains SQL injection attempt */
export function hasSqlInjection(input: string): boolean {
  if (!input) return false;
  return SQL_PATTERNS.some((p) => p.test(input));
}

/** Check if input is suspicious (XSS or SQL injection) */
export function isSuspicious(input: string): boolean {
  return hasXss(input) || hasSqlInjection(input);
}
