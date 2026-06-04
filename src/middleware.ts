import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { defaultLocale, type Locale } from "./i18n/config";
import { getAdminUrl, isAdminHost, usesAdminSubdomain } from "@/lib/admin-url";
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
    return NextResponse.redirect(new URL(stripped, request.url));
  }

  const rewritePath = pathname === "/" ? "/admin" : `/admin${pathname}`;
  return updateSupabaseSession(request, { rewritePath });
}

export async function middleware(request: NextRequest) {
  const hostname = request.nextUrl.hostname;
  const { pathname } = request.nextUrl;

  if (isAdminHost(hostname)) {
    return handleAdminSubdomain(request);
  }

  if (usesAdminSubdomain() && pathname.startsWith("/admin")) {
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
    return NextResponse.rewrite(
      new URL(`/en${suffix || ""}`, request.url),
    );
  }

  if (explicit === "nl") {
    const suffix = pathname.slice(3) || "";
    const visible = suffix || "/";
    if (visible !== pathname) {
      return NextResponse.redirect(new URL(visible, request.url));
    }
    return NextResponse.rewrite(new URL(`/nl${suffix || ""}`, request.url));
  }

  return NextResponse.rewrite(
    new URL(`/${defaultLocale}${pathname}`, request.url),
  );
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|icon.png|apple-icon|apple-icon.png|apple-touch-icon.png).*)",
  ],
};
