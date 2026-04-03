"use client";

import { useEffect, useRef, useState } from "react";
import BlockRenderer from "@/components/builder/BlockRenderer";
import type { Block } from "@/types/builder";

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie.split("; ").find((r) => r.startsWith(name + "="))?.split("=")[1];
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

interface Props {
  clientId: string;
  clientSlug: string;
  clientName: string;
  whatsappNumber?: string;
  blocksA: Block[];
  blocksB: Block[];
}

export function AbTestRenderer({ clientId, clientSlug, clientName, whatsappNumber, blocksA, blocksB }: Props) {
  const cookieKey = `ab_${clientId}`;
  const [version, setVersion] = useState<"A" | "B">("A");
  const tracked = useRef(false);

  useEffect(() => {
    let v = getCookie(cookieKey) as "A" | "B" | undefined;
    if (!v) {
      v = Math.random() < 0.5 ? "A" : "B";
      setCookie(cookieKey, v, 30);
    }
    setVersion(v);

    if (!tracked.current) {
      tracked.current = true;
      fetch("/api/ab-track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, version: v, event: "view" }),
      }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const blocks = version === "B" && blocksB.length > 0 ? blocksB : blocksA;

  return (
    <BlockRenderer
      blocks={blocks}
      clientSlug={clientSlug}
      whatsappNumber={whatsappNumber}
      clientName={clientName}
    />
  );
}
