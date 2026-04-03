import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error("ENCRYPTION_KEY is not set in environment variables");
  return Buffer.from(key, "hex");
}

/**
 * Encrypt a plain-text string with AES-256-GCM.
 * Returns: iv:authTag:ciphertext (all hex)
 */
export function encrypt(text: string): string {
  if (!text) return text;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt a string produced by encrypt().
 * Returns original plain text, or the input unchanged if it does not look encrypted.
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText || !encryptedText.includes(":")) return encryptedText;
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) return encryptedText;
    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    // If decryption fails, return as-is (value may not be encrypted yet)
    return encryptedText;
  }
}

/**
 * Mask a sensitive value for display: show only the last 4 characters.
 * e.g. "sk-1234567890abcdef" → "••••••••cdef"
 */
export function maskSensitive(value: string | null | undefined): string {
  if (!value) return "";
  const last4 = value.slice(-4);
  return "••••••••" + last4;
}
