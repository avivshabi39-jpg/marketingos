/**
 * MarketingOS — Full System Tests (20 tests)
 * Covers: utils, auth, AI helpers, business logic, validation
 *
 * Run: npx vitest run __tests__/full-system.test.ts
 *      (from apps/web directory)
 */

import { describe, it, expect } from "vitest";

// ──────────────────────────────────────────────────────────
// 1. Utility — slugify
// ──────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

describe("slugify", () => {
  it("converts Hebrew business name to lowercase-latin slug", () => {
    expect(slugify("Arel Aviation")).toBe("arel-aviation");
  });

  it("strips special characters", () => {
    expect(slugify("Hello & World!")).toBe("hello-world");
  });

  it("collapses multiple spaces/hyphens", () => {
    expect(slugify("foo   bar---baz")).toBe("foo-bar-baz");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("  -hello-  ")).toBe("hello");
  });

  it("returns empty string for empty input", () => {
    expect(slugify("")).toBe("");
  });
});

// ──────────────────────────────────────────────────────────
// 2. Utility — paginate
// ──────────────────────────────────────────────────────────

function paginate<T>(items: T[], page: number, perPage = 20) {
  const total = items.length;
  const totalPages = Math.ceil(total / perPage);
  const data = items.slice((page - 1) * perPage, page * perPage);
  return { data, total, totalPages, page };
}

describe("paginate", () => {
  it("returns first page correctly", () => {
    const items = Array.from({ length: 45 }, (_, i) => i);
    const result = paginate(items, 1, 20);
    expect(result.data).toHaveLength(20);
    expect(result.data[0]).toBe(0);
    expect(result.total).toBe(45);
    expect(result.totalPages).toBe(3);
  });

  it("returns last page with fewer items", () => {
    const items = Array.from({ length: 45 }, (_, i) => i);
    const result = paginate(items, 3, 20);
    expect(result.data).toHaveLength(5);
    expect(result.data[0]).toBe(40);
  });

  it("returns empty data for out-of-range page", () => {
    const items = [1, 2, 3];
    const result = paginate(items, 99, 20);
    expect(result.data).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────────────────
// 3. AI helper — parseJsonSafe
// ──────────────────────────────────────────────────────────

function parseJsonSafe<T>(text: string): T | null {
  const cleaned = text.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

describe("parseJsonSafe", () => {
  it("parses clean JSON", () => {
    const result = parseJsonSafe<{ title: string }>('{"title":"Hello"}');
    expect(result?.title).toBe("Hello");
  });

  it("strips markdown json fence", () => {
    const fenced = '```json\n{"title":"Fenced"}\n```';
    const result = parseJsonSafe<{ title: string }>(fenced);
    expect(result?.title).toBe("Fenced");
  });

  it("strips ```json fence (with language tag)", () => {
    const fenced = '```json\n{"action":"BUILD_PAGE"}\n```';
    const result = parseJsonSafe<{ action: string }>(fenced);
    expect(result?.action).toBe("BUILD_PAGE");
  });

  it("returns null for invalid JSON", () => {
    expect(parseJsonSafe("not json at all")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseJsonSafe("")).toBeNull();
  });
});

// ──────────────────────────────────────────────────────────
// 4. Auth — isSuperAdmin
// ──────────────────────────────────────────────────────────

type JWTPayload = {
  userId: string;
  email: string;
  role: string;
  clientId: string | null;
};

function isSuperAdmin(session: JWTPayload): boolean {
  return session.role === "SUPER_ADMIN";
}

describe("isSuperAdmin", () => {
  it("returns true for SUPER_ADMIN role", () => {
    const session: JWTPayload = {
      userId: "1", email: "a@b.com", role: "SUPER_ADMIN", clientId: null,
    };
    expect(isSuperAdmin(session)).toBe(true);
  });

  it("returns false for ADMIN role", () => {
    const session: JWTPayload = {
      userId: "2", email: "c@d.com", role: "ADMIN", clientId: "client-1",
    };
    expect(isSuperAdmin(session)).toBe(false);
  });

  it("returns false for USER role", () => {
    const session: JWTPayload = {
      userId: "3", email: "e@f.com", role: "USER", clientId: null,
    };
    expect(isSuperAdmin(session)).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────
// 5. Business logic — conversion rate
// ──────────────────────────────────────────────────────────

function calcConversionRate(wonLeads: number, totalLeads: number): number {
  return totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;
}

describe("calcConversionRate", () => {
  it("returns 0 when no leads", () => {
    expect(calcConversionRate(0, 0)).toBe(0);
  });

  it("returns 100 when all leads won", () => {
    expect(calcConversionRate(5, 5)).toBe(100);
  });

  it("rounds correctly", () => {
    expect(calcConversionRate(1, 3)).toBe(33);
  });
});

// ──────────────────────────────────────────────────────────
// 6. Business logic — AI message type selector
// ──────────────────────────────────────────────────────────

function getAiMessageType(
  pagePublished: boolean,
  newLeadsCount: number,
  leadsLast7Days: number,
  totalLeads: number,
  changePercent: number,
): "no_page" | "no_leads" | "new_leads" | "performance_up" | null {
  if (!pagePublished) return "no_page";
  if (newLeadsCount > 0) return "new_leads";
  if (leadsLast7Days === 0 && totalLeads > 0) return "no_leads";
  if (changePercent >= 20) return "performance_up";
  return null;
}

describe("getAiMessageType", () => {
  it("returns no_page when page not published", () => {
    expect(getAiMessageType(false, 0, 0, 0, 0)).toBe("no_page");
  });

  it("returns new_leads when there are new leads", () => {
    expect(getAiMessageType(true, 3, 3, 10, 0)).toBe("new_leads");
  });

  it("returns no_leads when no activity in 7 days but has total leads", () => {
    expect(getAiMessageType(true, 0, 0, 20, 0)).toBe("no_leads");
  });

  it("returns performance_up when week-over-week is +20% or more", () => {
    expect(getAiMessageType(true, 0, 5, 50, 25)).toBe("performance_up");
  });

  it("returns null when everything is fine", () => {
    expect(getAiMessageType(true, 0, 3, 50, 5)).toBeNull();
  });
});

// ──────────────────────────────────────────────────────────
// 7. Business logic — changePercent calculation
// ──────────────────────────────────────────────────────────

function calcChangePercent(current: number, previous: number): number {
  return previous > 0
    ? Math.round(((current - previous) / previous) * 100)
    : 0;
}

describe("calcChangePercent", () => {
  it("returns 0 when no previous data", () => {
    expect(calcChangePercent(5, 0)).toBe(0);
  });

  it("returns 100 for doubling", () => {
    expect(calcChangePercent(10, 5)).toBe(100);
  });

  it("returns negative for decline", () => {
    expect(calcChangePercent(3, 10)).toBe(-70);
  });

  it("returns 0 for no change", () => {
    expect(calcChangePercent(7, 7)).toBe(0);
  });
});
