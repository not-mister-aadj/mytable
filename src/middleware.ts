import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { defaultLocale, type Locale } from "./i18n/config";
import {
  getAdminUrl,
  isAdminHost,
  isLocalDevHost,
  usesAdminSubdomainFromEnv,
} from "@/lib/admin-url";
import {
  updateSupabaseSession,
  updateSupabaseSessionWithUser,
} from "@/lib/supabase/middleware";

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

/** Path without /en or /nl prefix. */
function stripLocaleVisible(pathname: string): string {
  if (pathname === "/en" || pathname === "/nl") return "/";
  if (pathname.startsWith("/en/")) return pathname.slice(3) || "/";
  if (pathname.startsWith("/nl/")) return pathname.slice(3) || "/";
  return pathname || "/";
}

function isMemberGatedPath(pathname: string): boolean {
  const p = stripLocaleVisible(pathname);
  if (p.startsWith("/account")) return true;
  if (p === "/clubmember" || p.startsWith("/clubmember/")) return true;
  return false;
}

function signInHomeRedirect(request: NextRequest): NextResponse {
  const target = request.nextUrl.clone();
  const isEn =
    request.nextUrl.pathname === "/en" ||
    request.nextUrl.pathname.startsWith("/en/");
  target.pathname = isEn ? "/en" : "/";
  target.search = "";
  target.searchParams.set("signin", "1");
  return NextResponse.redirect(target);
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

  // Admin lives only on dashboard.mytable.club — never on www
  if (
    usesAdminSubdomainFromEnv() &&
    (pathname.startsWith("/admin") ||
      pathname === "/dashboard" ||
      pathname.startsWith("/dashboard/")) &&
    !isLocalDevHost(hostname)
  ) {
    const subPath = pathname.startsWith("/admin")
      ? pathname.slice("/admin".length) || "/"
      : pathname === "/dashboard" || pathname === "/dashboard/"
        ? "/"
        : pathname.slice("/dashboard".length) || "/";
    return NextResponse.redirect(new URL(subPath, getAdminUrl()));
  }

  if (pathname === "/login") {
    const target = request.nextUrl.clone();
    target.pathname = "/";
    target.searchParams.set("signin", "1");
    return NextResponse.redirect(target, 308);
  }
  if (pathname === "/inloggen") {
    const target = request.nextUrl.clone();
    target.pathname = "/";
    target.searchParams.set("signin", "1");
    return NextResponse.redirect(target, 308);
  }
  if (pathname === "/en/login" || pathname === "/en/inloggen") {
    const target = request.nextUrl.clone();
    target.pathname = "/en";
    target.searchParams.set("signin", "1");
    return NextResponse.redirect(target, 308);
  }

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/auth/")
  ) {
    return updateSupabaseSession(request);
  }

  // Signed-in members skip the marketing landing → account
  if (pathname === "/" || pathname === "/en") {
    const isEn = pathname === "/en";
    const rewritePath = isEn ? "/en" : `/${defaultLocale}`;
    const { response, user } = await updateSupabaseSessionWithUser(request, {
      rewritePath,
    });
    if (user) {
      const target = request.nextUrl.clone();
      target.pathname = isEn ? "/en/account" : "/account";
      target.search = "";
      const redirect = NextResponse.redirect(target);
      for (const cookie of response.cookies.getAll()) {
        redirect.cookies.set(cookie);
      }
      return redirect;
    }
    return response;
  }

  if (isMemberGatedPath(pathname)) {
    const isEn = pathname === "/en" || pathname.startsWith("/en/");
    const bare = stripLocaleVisible(pathname);
    const rewritePath = isEn
      ? pathname
      : `/${defaultLocale}${bare === "/" ? "" : bare}`;

    const { response, user } = await updateSupabaseSessionWithUser(request, {
      rewritePath,
    });

    if (!user) {
      return signInHomeRedirect(request);
    }
    return response;
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
    (pathname.includes(".") && !pathname.endsWith("/feed.xml"))
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
    "/((?!_next/static|_next/image|favicon\\.ico|icon(?:\\.png)?|apple-icon(?:\\.png)?|apple-touch-icon\\.png|robots\\.txt|sitemap(?:\\.xml)?).*)",
  ],
};
