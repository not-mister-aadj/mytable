import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { defaultLocale, type Locale } from "./i18n/config";
import {
  isAdminHost,
  isLocalDevHost,
  usesAdminSubdomainFromEnv,
} from "@/lib/admin-url";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

const BLOG_CATEGORY_IDS = new Set([
  "tips",
  "girls-only",
  "cities",
  "how-it-works",
]);

function resolveLocale(pathname: string): Locale | null {
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en";
  if (pathname === "/nl" || pathname.startsWith("/nl/")) return "nl";
  return null;
}

/** True for asset-like paths (foo.png), not JWT segments that contain dots. */
function looksLikeStaticAssetPath(pathname: string): boolean {
  if (pathname.endsWith("/feed.xml")) return false;
  return /\.[a-zA-Z0-9]{1,8}$/.test(pathname);
}

function handleAdminSubdomain(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-icon") ||
    pathname.startsWith("/apple-touch-icon") ||
    looksLikeStaticAssetPath(pathname)
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

  // Admin lives only on dashboard.mytable.club — never on www. Serve a
  // normal 404 here rather than cross-domain-redirecting to getAdminUrl():
  // that redirect crashed the Edge middleware (MIDDLEWARE_INVOCATION_FAILED)
  // whenever NEXT_PUBLIC_ADMIN_URL wasn't a fully-qualified URL, and even
  // when it is, this host should never expose (or link to) the admin app.
  if (
    usesAdminSubdomainFromEnv() &&
    (pathname.startsWith("/admin") ||
      pathname === "/dashboard" ||
      pathname.startsWith("/dashboard/")) &&
    !isLocalDevHost(hostname)
  ) {
    const notFoundUrl = request.nextUrl.clone();
    notFoundUrl.pathname = `/${defaultLocale}/__not-found__`;
    return NextResponse.rewrite(notFoundUrl);
  }

  // /login and /inloggen used to redirect into a sign-in modal on the
  // homepage — sign-in is paused, so they now render their own coming-soon
  // page (src/app/[locale]/login and /inloggen) instead of redirecting away.

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/auth/")
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

  const categoryQuery = request.nextUrl.searchParams.get("category");
  if (
    categoryQuery &&
    BLOG_CATEGORY_IDS.has(categoryQuery) &&
    (pathname === "/blog" || pathname === "/en/blog" || pathname === "/nl/blog")
  ) {
    const target = request.nextUrl.clone();
    target.search = "";
    if (pathname.startsWith("/en")) {
      target.pathname = `/en/blog/categorie/${categoryQuery}`;
    } else {
      target.pathname = `/blog/categorie/${categoryQuery}`;
    }
    return NextResponse.redirect(target, 308);
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-icon") ||
    pathname.startsWith("/apple-touch-icon") ||
    pathname.startsWith("/favicon") ||
    looksLikeStaticAssetPath(pathname)
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
    "/((?!_next/static|_next/image|favicon\\.ico|icon(?:\\.png)?|apple-icon(?:\\.png)?|apple-touch-icon\\.png|robots\\.txt|sitemap(?:\\.xml)?|monitoring).*)",
  ],
};
