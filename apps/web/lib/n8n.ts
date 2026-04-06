// lib/n8n.ts — Railway direct connection with retry + health check
// lib/webhooks.ts — per-client webhook dispatcher (encrypted URL), kept for backward compat

const N8N_BASE = process.env.N8N_WEBHOOK_BASE_URL ?? "";
const N8N_USER = process.env.N8N_BASIC_AUTH_USER ?? "";
const N8N_PASS = process.env.N8N_BASIC_AUTH_PASSWORD ?? "";

function getBasicAuth(): string {
  return "Basic " + Buffer.from(`${N8N_USER}:${N8N_PASS}`).toString("base64");
}

function isConfigured(): boolean {
  return N8N_BASE.length > 0;
}

export async function triggerN8nWebhook(
  path: string,
  payload: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  if (!isConfigured()) {
    return { ok: false, error: "N8N not configured" };
  }

  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      const res = await fetch(`${N8N_BASE}/webhook/${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: getBasicAuth(),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      });

      if (res.ok) return { ok: true };

      const text = await res.text().catch(() => "");
      console.warn(
        `[n8n] Webhook attempt ${attempt} failed — ${res.status}: ${text}`
      );

      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, attempt * 1000));
      }
    } catch (err) {
      console.error(`[n8n] Webhook attempt ${attempt} error:`, err);
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, attempt * 1000));
      }
    }
  }

  return { ok: false, error: `Failed after ${maxAttempts} attempts` };
}

export async function checkN8nHealth(): Promise<{
  healthy: boolean;
  responseMs: number;
  error?: string;
}> {
  if (!isConfigured()) {
    return { healthy: false, responseMs: 0, error: "N8N_WEBHOOK_BASE_URL not set" };
  }

  const start = Date.now();
  try {
    const res = await fetch(`${N8N_BASE}/healthz`, {
      signal: AbortSignal.timeout(5_000),
    });
    const responseMs = Date.now() - start;

    if (!res.ok) {
      return { healthy: false, responseMs, error: `HTTP ${res.status}` };
    }

    return { healthy: true, responseMs };
  } catch (err) {
    const responseMs = Date.now() - start;
    return { healthy: false, responseMs, error: String(err) };
  }
}
