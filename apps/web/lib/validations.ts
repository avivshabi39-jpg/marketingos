import { z } from "zod";

// ─── Common Schemas ──────────────────────────────────────────────────────────

export const phoneSchema = z
  .string()
  .regex(/^[0-9+\-\s()]{7,15}$/, "מספר טלפון לא תקין")
  .optional()
  .nullable();

export const emailFieldSchema = z
  .string()
  .email("כתובת מייל לא תקינה")
  .optional()
  .nullable();

export const colorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "צבע לא תקין")
  .optional()
  .nullable();

export const slugSchema = z
  .string()
  .min(2, "שם קצר מדי")
  .max(50, "שם ארוך מדי")
  .regex(/^[a-z0-9-]+$/, "רק אותיות קטנות, מספרים ומקפים");

export const domainSchema = z
  .string()
  .regex(
    /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/,
    "פורמט דומיין לא תקין"
  )
  .optional()
  .nullable();

// ─── Auth Schemas ────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("אימייל לא תקין"),
  password: z.string().min(1, "סיסמה חובה"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "הכנס סיסמה נוכחית"),
  newPassword: z
    .string()
    .min(8, "סיסמה חדשה חייבת לפחות 8 תווים")
    .regex(/[A-Z]/, "חייב לפחות אות גדולה אחת")
    .regex(/[0-9]/, "חייב לפחות ספרה אחת"),
});

// ─── Broadcast Schema ────────────────────────────────────────────────────────

export const createBroadcastSchema = z.object({
  clientId: z.string().min(1, "clientId חובה"),
  message: z
    .string()
    .min(1, "הודעה חובה")
    .max(4096, "הודעה ארוכה מדי — מקסימום 4096 תווים"),
  filter: z.enum(["all", "new", "won", "lost"]).default("all"),
});

// ─── Social Post Schema ──────────────────────────────────────────────────────

export const generatePostSchema = z.object({
  clientId: z.string().min(1, "clientId חובה"),
  topic: z.string().min(2, "נושא חובה").max(200, "נושא ארוך מדי"),
  platform: z.enum(["facebook", "instagram", "whatsapp", "linkedin"]),
  style: z.string().max(50).optional(),
  language: z.enum(["hebrew", "arabic", "english"]).optional(),
});

// ─── Helper: Parse + Validate Request Body ───────────────────────────────────

/**
 * Parse JSON body and validate against a Zod schema.
 * Returns typed data or a Hebrew error message.
 */
export async function validateBody<T>(
  req: Request,
  schema: z.ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: string }> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const first = result.error.errors[0];
      const field = first.path.join(".");
      const message = first.message;
      return {
        data: null,
        error: field ? `${field}: ${message}` : message,
      };
    }

    return { data: result.data, error: null };
  } catch {
    return { data: null, error: "בקשה לא תקינה — JSON שגוי" };
  }
}
