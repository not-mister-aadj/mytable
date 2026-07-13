export const locales = ["nl", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "nl";

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

/** User-visible path: Dutch at `/`, English at `/en` */
export function localePath(locale: Locale, hash = ""): string {
  const base = locale === "en" ? "/en" : "/";
  return hash ? `${base}${hash}` : base;
}

/** Strip visible locale prefix; default locale (nl) has no prefix in URLs. */
export function stripLocalePrefix(pathname: string): {
  locale: Locale;
  path: string;
} {
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    return {
      locale: "en",
      path: pathname === "/en" ? "/" : pathname.slice(3),
    };
  }
  if (pathname === "/nl" || pathname.startsWith("/nl/")) {
    return {
      locale: "nl",
      path: pathname === "/nl" ? "/" : pathname.slice(3),
    };
  }
  return { locale: defaultLocale, path: pathname || "/" };
}

function localizePathForLocale(path: string, locale: Locale): string {
  if (locale === "en" && path === "/algemene-voorwaarden") return "/terms";
  if (locale === "nl" && path === "/terms") return "/algemene-voorwaarden";
  return path;
}

/** Same page in the other locale, preserving path (and optional hash). */
export function switchLocalePath(
  pathname: string,
  currentLocale: Locale,
  hash = "",
): string {
  const nextLocale: Locale = currentLocale === "nl" ? "en" : "nl";
  const { path } = stripLocalePrefix(pathname);
  const localizedPath = localizePathForLocale(path, nextLocale);
  const base =
    nextLocale === "en"
      ? localizedPath === "/"
        ? "/en"
        : `/en${localizedPath}`
      : localizedPath;
  return hash ? `${base}${hash}` : base;
}

export function agendaPath(locale: Locale): string {
  return locale === "en" ? "/en/agenda" : "/agenda";
}

export function experiencePath(locale: Locale, slug: string): string {
  const base = locale === "en" ? "/en/agenda" : "/agenda";
  return `${base}/${slug}`;
}

export function termsPath(locale: Locale): string {
  return locale === "en" ? "/en/terms" : "/algemene-voorwaarden";
}

export function privacyPath(locale: Locale): string {
  return locale === "en" ? "/en/privacy" : "/privacy";
}

export function girlsOnlyPath(locale: Locale): string {
  return locale === "en" ? "/en/girls-only" : "/girls-only";
}
