import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { defaultLocale, type Locale } from "./i18n/config";
import { getAdminUrl, isAdminHost, isLocalDevHost, usesAdminSubdomainFromEnv } from "@/lib/admin-url";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

function resolveLocale(pathname: string): Locale | null {
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en";
  if (pathname === "/nl" || pathname.startsWith("/nl/")) return "nl";
  return null;
}

function handleAdminSubdomain(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-icon") ||
    pathname.startsWith("/apple-touch-icon") ||
    (pathname.includes(".") && !pathname.startsWith("/api"))
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    return updateSupabaseSession(request);
  }

  if (pathname.startsWith("/admin")) {
    const stripped = pathname.slice("/admin".length) || "/";
    const rewritePath = stripped === "/" ? "/admin" : `/admin${stripped}`;
    return updateSupabaseSession(request, { rewritePath });
  }

  const rewritePath = pathname === "/" ? "/admin" : `/admin${pathname}`;
  return updateSupabaseSession(request, { rewritePath });
}

export async function middleware(request: NextRequest) {
  const hostname = request.nextUrl.hostname;
  const { pathname } = request.nextUrl;

  if (pathname === "/api/auth/clear-session") {
    return NextResponse.next();
  }

  if (isAdminHost(hostname)) {
    return handleAdminSubdomain(request);
  }

  if (
    usesAdminSubdomainFromEnv() &&
    pathname.startsWith("/admin") &&
    !isLocalDevHost(hostname)
  ) {
    const subPath = pathname.slice("/admin".length) || "/";
    return NextResponse.redirect(new URL(subPath, getAdminUrl()));
  }

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/admin")
  ) {
    return updateSupabaseSession(request);
  }

  if (
    pathname === "/sitemap" ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-icon") ||
    pathname.startsWith("/apple-touch-icon") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const explicit = resolveLocale(pathname);

  if (explicit === "en") {
    const suffix = pathname.slice(3) || "";
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/en${suffix || ""}`;
    return NextResponse.rewrite(rewriteUrl);
  }

  if (explicit === "nl") {
    const suffix = pathname.slice(3) || "";
    const visible = suffix || "/";
    if (visible !== pathname) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = visible;
      return NextResponse.redirect(redirectUrl);
    }
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/nl${suffix || ""}`;
    return NextResponse.rewrite(rewriteUrl);
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = `/${defaultLocale}${pathname}`;
  return NextResponse.rewrite(rewriteUrl);
}

export const config = {
  matcher: [
    /*
     * Skip SEO/static assets so Googlebot never hits middleware for sitemaps.
     * (Known Next.js + GSC “Couldn't fetch” cause.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|icon(?:\\.png)?|apple-icon(?:\\.png)?|apple-touch-icon\\.png|robots\\.txt|sitemap(?:\\.xml)?).*)",
  ],
};
