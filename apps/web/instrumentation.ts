export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      enabled: process.env.NODE_ENV === "production",
      tracesSampleRate: 0.05,
      beforeSend(event) {
        if (event.extra) {
          const body = event.extra.body as Record<string, unknown> | undefined;
          if (body?.password) body.password = "[REDACTED]";
          if (body?.token) body.token = "[REDACTED]";
        }
        return event;
      },
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      enabled: process.env.NODE_ENV === "production",
      tracesSampleRate: 0.05,
    });
  }
}
