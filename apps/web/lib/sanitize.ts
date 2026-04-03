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
