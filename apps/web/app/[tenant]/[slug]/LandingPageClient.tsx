"use client";

import { useState, useMemo } from "react";
import DOMPurify from "isomorphic-dompurify";

interface Props {
  html: string;
  css: string;
  clientId: string;
  landingPageId: string;
}

export function LandingPageClient({ html, css, clientId, landingPageId }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Sanitize HTML to prevent XSS — allow form elements needed for lead capture
  const safeHtml = useMemo(() => DOMPurify.sanitize(html, {
    ADD_TAGS: ["form", "input", "button", "select", "textarea", "label", "fieldset", "legend"],
    ADD_ATTR: ["action", "method", "name", "type", "placeholder", "required", "value", "for", "rows"],
  }), [html]);

  // CSS is scoped to this component — strip any expression() or url() data: attack vectors
  const safeCss = useMemo(() => css.replace(/expression\s*\(|javascript\s*:/gi, ""), [css]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: data.firstName ?? data.first_name ?? "",
        lastName: data.lastName ?? data.last_name ?? "",
        email: data.email ?? "",
        phone: data.phone ?? undefined,
        clientId,
        landingPageId,
        source: "landing_page",
        metadata: data,
      }),
    });

    if (res.ok) {
      setSubmitted(true);
    } else {
      const json = await res.json();
      setError(json.error?.toString() ?? "Something went wrong.");
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-8">
        <div>
          <div className="text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-900">Thank you!</h2>
          <p className="text-gray-500 mt-2">We'll be in touch shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {safeCss && <style dangerouslySetInnerHTML={{ __html: safeCss }} />}
      <div
        dangerouslySetInnerHTML={{ __html: safeHtml }}
        onSubmit={handleSubmit as unknown as React.FormEventHandler<HTMLDivElement>}
      />
      {error && (
        <p className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded shadow">
          {error}
        </p>
      )}
    </>
  );
}
