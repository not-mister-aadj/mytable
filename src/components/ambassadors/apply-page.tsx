import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AmbassadorApplyView } from "@/components/ambassadors/AmbassadorApplyView";
import { ambassadorsApplyPath, isValidLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { ambassadorCopy } from "@/lib/ambassadors/copy";

/** Shared by /ambassadors/aanmelden (NL) and /en/ambassadors/apply (EN). */
export function applyMetadata(locale: string): Metadata {
  if (!isValidLocale(locale)) return {};
  return { title: ambassadorCopy(locale).apply.metaTitle, robots: { index: false, follow: true } };
}

export function renderApplyPage(localeParam: string, slugLocale: Locale) {
  if (!isValidLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  // Each language has its own slug; the other one goes to the right place.
  if (locale !== slugLocale) redirect(ambassadorsApplyPath(locale));
  const dict = getDictionary(locale);
  return <AmbassadorApplyView locale={locale} headerDict={dict.header} footerDict={dict.footer} />;
}
