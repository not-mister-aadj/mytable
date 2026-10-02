import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { JouwTafelLanding } from "@/components/jouw-tafel/JouwTafelLanding";
import { PlaceholderViewTracker } from "@/components/jouw-tafel/PlaceholderViewTracker";
import { ArrowLeftIcon } from "@/components/jouw-tafel/icons";
import { jouwTafelPath, type Locale } from "@/i18n/config";
import { getLandingCopy } from "@/lib/jouw-tafel/copy";
import { getJouwTafelEvents, getWaitlistProof } from "@/lib/jouw-tafel/data";
import { requestCity, type JouwTafelSearchParams } from "@/lib/jouw-tafel/request-city";

const NO_INDEX: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
};

/** Ad landing page only: kept out of search results and the sitemap. */
export function jouwTafelMetadata(locale: Locale): Metadata {
  const copy = getLandingCopy(locale);
  return { title: copy.meta.title, description: copy.meta.description, robots: NO_INDEX };
}

export function jouwTafelPlaceholderMetadata(locale: Locale, kind: "signup" | "login"): Metadata {
  const copy = getLandingCopy(locale).placeholder;
  return {
    title: kind === "signup" ? copy.signUpTitle : copy.logInTitle,
    robots: NO_INDEX,
  };
}

/**
 * "Jouw tafel" landing page (variant B of the homepage test). Logo only, no
 * navigation: the only actions are "Aanmelden" and "Inloggen". Renders per
 * request because the visitor's city comes from the request headers; the
 * table list itself is cached.
 */
export async function JouwTafelPage({
  locale,
  searchParams,
}: {
  locale: Locale;
  searchParams: JouwTafelSearchParams;
}) {
  const [{ events, now }, geoCity] = await Promise.all([getJouwTafelEvents(), requestCity(searchParams)]);
  const proof = await getWaitlistProof(geoCity);
  return (
    <JouwTafelLanding
      locale={locale}
      events={events}
      geoCity={geoCity}
      proof={proof}
      now={now}
      preview={searchParams.voorbeeld === "1"}
    />
  );
}

/** Where "Aanmelden" and "Inloggen" land until accounts exist. */
export function JouwTafelPlaceholderPage({
  locale,
  kind,
}: {
  locale: Locale;
  kind: "signup" | "login";
}) {
  const copy = getLandingCopy(locale).placeholder;
  return (
    <div className="flex min-h-[100svh] flex-col bg-cream text-wine">
      <PlaceholderViewTracker kind={kind} locale={locale} />
      <header className="flex h-16 items-center justify-between px-5 sm:px-8">
        <Link href={jouwTafelPath(locale)} aria-label="MyTable">
          <Logo priority />
        </Link>
        <LanguageSwitcher locale={locale} label={locale === "nl" ? "EN" : "NL"} />
      </header>
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-5 pb-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(197,154,91,0.16),transparent_60%)]" />
        <div className="relative w-full max-w-md rounded-[1.75rem] border border-wine/8 bg-white/70 px-7 py-10 text-center shadow-[0_24px_60px_rgba(43,13,18,0.1)]">
          <span aria-hidden className="mx-auto block h-px w-12 bg-gold" />
          <h1 className="mt-6 font-serif text-[2rem] font-medium leading-[1.1] tracking-tight text-wine text-balance">
            {copy.title}
          </h1>
          <p className="mt-4 text-[1.02rem] leading-relaxed text-wine/70">
            {kind === "signup" ? copy.signUpBody : copy.logInBody}
          </p>
          <Link
            href={jouwTafelPath(locale)}
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-1.5 rounded-full border border-wine/20 px-7 text-xs font-semibold uppercase tracking-[0.16em] text-wine/75 transition hover:border-wine/40 hover:text-wine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/60"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            {copy.back}
          </Link>
        </div>
      </main>
    </div>
  );
}
