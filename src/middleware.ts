import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { defaultLocale, type Locale } from "./i18n/config";

function resolveLocale(pathname: string): Locale | null {
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en";
  if (pathname === "/nl" || pathname.startsWith("/nl/")) return "nl";
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
