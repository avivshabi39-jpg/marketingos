/**
 * Password strength validation — used in register + reset-password routes.
 * Returns null if valid, or a Hebrew error message.
 */
export function validatePassword(password: string): string | null {
  if (password.length < 8)          return "סיסמה חייבת להכיל לפחות 8 תווים";
  if (!/[A-Z]/.test(password))      return "סיסמה חייבת להכיל לפחות אות גדולה אחת (A-Z)";
  if (!/[0-9]/.test(password))      return "סיסמה חייבת להכיל לפחות ספרה אחת";
  return null;
}

/**
 * Returns 0 (weak) | 1 (medium) | 2 (strong) — for client-side UI only.
 */
export function passwordStrength(password: string): 0 | 1 | 2 {
  let score = 0;
  if (password.length >= 8)            score++;
  if (/[A-Z]/.test(password))          score++;
  if (/[0-9]/.test(password))          score++;
  if (/[^A-Za-z0-9]/.test(password))  score++;
  if (password.length >= 12)           score++;
  if (score <= 2) return 0;
  if (score <= 3) return 1;
  return 2;
}
