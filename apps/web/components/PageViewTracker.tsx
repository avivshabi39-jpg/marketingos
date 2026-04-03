"use client";

import { useEffect } from "react";

export function PageViewTracker({
  clientSlug,
  page,
}: {
  clientSlug: string;
  page: string;
}) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let source = params.get("utm_source");
    if (!source) {
      if (params.get("fbclid")) source = "facebook";
      else if (params.get("gclid")) source = "google";
      else if (document.referrer) {
        try { source = new URL(document.referrer).hostname.replace("www.", ""); } catch { source = "referral"; }
      } else source = "direct";
    }

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientSlug, page, source }),
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
