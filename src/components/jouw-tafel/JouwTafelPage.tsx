import type { Metadata } from "next";
import { JouwTafelLanding } from "@/components/jouw-tafel/JouwTafelLanding";
import type { Locale } from "@/i18n/config";
import { getLandingCopy } from "@/lib/jouw-tafel/copy";
import { devCountOverride, getJouwTafelEvents, getWaitlistProof } from "@/lib/jouw-tafel/data";
import { getSettingsCopy } from "@/lib/jouw-tafel/settings-copy";
import { requestCity, type JouwTafelSearchParams } from "@/lib/jouw-tafel/request-city";

export const NO_INDEX: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
};

/** Ad landing page only: kept out of search results and the sitemap. */
export function jouwTafelMetadata(locale: Locale): Metadata {
  const copy = getLandingCopy(locale);
  return { title: copy.meta.title, description: copy.meta.description, robots: NO_INDEX };
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
  const proof = await getWaitlistProof(geoCity, devCountOverride(searchParams.aantal));
  return (
    <JouwTafelLanding
      locale={locale}
      events={events}
      geoCity={geoCity}
      proof={proof}
      now={now}
      preview={searchParams.voorbeeld === "1"}
      notice={searchParams.verwijderd === "1" ? getSettingsCopy(locale).deletedNotice : null}
    />
  );
}
