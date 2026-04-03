import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-in-production"
);

const REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET ??
  (process.env.JWT_SECRET
    ? process.env.JWT_SECRET + "-refresh"
    : "dev-refresh-secret-change-in-production")
);

/** Try to issue a new access token from the refresh_token cookie (Edge-safe, no DB) */
async function tryRefresh(request: NextRequest, pathname: string) {
  const refreshToken = request.cookies.get("refresh_token")?.value;
  if (!refreshToken) return null;

  try {
    const { payload } = await jwtVerify(refreshToken, REFRESH_SECRET);
    if ((payload as Record<string, unknown>)._type !== "refresh") return null;

    // Re-sign a new access token with the same user data (Edge-safe — no DB needed here)
    const { _type: _, iat: __, exp: ___, nbf: ____, ...userPayload } = payload as Record<string, unknown>;

    const newAccessToken = await new SignJWT(userPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(SECRET);

    const subStatus = (userPayload as { subscriptionStatus?: string }).subscriptionStatus;

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    if (subStatus === "past_due") {
      requestHeaders.set("x-subscription-past-due", "1");
    }

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.cookies.set("auth_token", newAccessToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   60 * 60,
      path:     "/",
    });

    // Handle canceled subscription redirect
    if (
      subStatus === "canceled" &&
      !pathname.startsWith("/admin/billing") &&
      !pathname.startsWith("/admin/onboarding")
    ) {
      return NextResponse.redirect(new URL("/admin/billing", request.url));
    }

    return response;
  } catch {
    return null;
  }
}

const SUSPICIOUS_PATTERNS = [
  "../", "..\\", "<script", "javascript:",
  "UNION SELECT", "DROP TABLE", "/etc/passwd", "eval(",
];

const ROOT_DOMAINS = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost").split(",");

function getSubdomain(host: string): string | null {
  const hostWithoutPort = host.split(":")[0];
  for (const root of ROOT_DOMAINS) {
    const rootWithoutPort = root.split(":")[0];
    if (hostWithoutPort.endsWith(`.${rootWithoutPort}`)) {
      const sub = hostWithoutPort.slice(0, -(rootWithoutPort.length + 1));
      if (sub && sub !== "www") return sub;
    }
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";

  // ── Subdomain → path rewrite (e.g. myslug.domain.com → /myslug) ─────────────
  const subdomain = getSubdomain(host);
  if (subdomain && pathname === "/") {
    return NextResponse.rewrite(new URL(`/${subdomain}`, request.url));
  }
  if (subdomain && !pathname.startsWith("/admin") && !pathname.startsWith("/api") && !pathname.startsWith("/client")) {
    return NextResponse.rewrite(new URL(`/${subdomain}${pathname}`, request.url));
  }

  // ── Block suspicious patterns ────────────────────────────────────────────────
  // Check both raw and decoded URL to catch encoded and unencoded attacks
  const rawUrl = request.url.toLowerCase();
  const decodedUrl = (() => { try { return decodeURIComponent(rawUrl); } catch { return rawUrl; } })();
  if (SUSPICIOUS_PATTERNS.some((p) => {
    const lp = p.toLowerCase();
    return rawUrl.includes(lp) || decodedUrl.includes(lp);
  })) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // ── Public admin routes (no auth needed) ────────────────────────────────────
  const publicAdminPaths = ["/admin/login", "/admin/forgot-password", "/admin/reset-password"];
  if (publicAdminPaths.some((p) => pathname === p || pathname.startsWith(p + "?"))) {
    return NextResponse.next();
  }

  // ── Admin portal ────────────────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      // No access token — try refresh before redirecting to login
      const refreshed = await tryRefresh(request, pathname);
      if (refreshed) return refreshed;
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    try {
      const { payload } = await jwtVerify(token, SECRET);
      const subStatus = (payload as { subscriptionStatus?: string }).subscriptionStatus;

      if (
        subStatus === "canceled" &&
        !pathname.startsWith("/admin/billing") &&
        !pathname.startsWith("/admin/onboarding")
      ) {
        return NextResponse.redirect(new URL("/admin/billing", request.url));
      }

      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-pathname", pathname);
      if (subStatus === "past_due") {
        requestHeaders.set("x-subscription-past-due", "1");
      }

      return NextResponse.next({ request: { headers: requestHeaders } });
    } catch {
      // Access token expired — try refresh before redirecting to login
      const refreshed = await tryRefresh(request, pathname);
      if (refreshed) return refreshed;

      const res = NextResponse.redirect(new URL("/admin/login", request.url));
      res.cookies.delete("auth_token");
      return res;
    }
  }

  // ── Client portal ────────────────────────────────────────────────────────────
  if (pathname.startsWith("/client/")) {
    const parts = pathname.split("/");
    const slug = parts[2] ?? "";

    if (slug && pathname === `/client/${slug}/login`) {
      return NextResponse.next();
    }

    const token = request.cookies.get("client_token")?.value;

    if (!token) {
      const loginUrl = slug
        ? new URL(`/client/${slug}/login`, request.url)
        : new URL("/client/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(token, SECRET);
      if ((payload as { type?: string }).type !== "client_portal") {
        throw new Error("invalid token type");
      }

      if (slug && (payload as { slug?: string }).slug !== slug) {
        return NextResponse.redirect(
          new URL(`/client/${(payload as { slug: string }).slug}`, request.url)
        );
      }

      return NextResponse.next();
    } catch {
      const loginUrl = slug
        ? new URL(`/client/${slug}/login`, request.url)
        : new URL("/client/login", request.url);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete("client_token");
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
