export const N8N_BASE = process.env.N8N_WEBHOOK_BASE_URL ?? "";

export async function triggerN8nWebhook(
  path: string,
  payload: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  if (!N8N_BASE) return { ok: false, error: "N8N_WEBHOOK_BASE_URL not configured" };
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (process.env.N8N_BASIC_AUTH_USER && process.env.N8N_BASIC_AUTH_PASSWORD) {
      headers.Authorization =
        "Basic " +
        Buffer.from(
          `${process.env.N8N_BASIC_AUTH_USER}:${process.env.N8N_BASIC_AUTH_PASSWORD}`
        ).toString("base64");
    }
    const res = await fetch(`${N8N_BASE}/webhook/${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
    return { ok: res.ok };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function checkN8nHealth(): Promise<boolean> {
  if (!N8N_BASE) return false;
  try {
    const res = await fetch(`${N8N_BASE}/healthz`, {
      signal: AbortSignal.timeout(5_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
