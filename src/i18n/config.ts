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

export function switchLocalePath(current: Locale): string {
  return current === "nl" ? "/en" : "/";
}

export function agendaPath(locale: Locale): string {
  return locale === "en" ? "/en/agenda" : "/agenda";
}

export function experiencePath(locale: Locale, slug: string): string {
  const base = locale === "en" ? "/en/agenda" : "/agenda";
  return `${base}/${slug}`;
}
