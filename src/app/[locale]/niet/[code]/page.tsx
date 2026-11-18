import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import { isDbConfigured } from "@/db/index";
import { isValidLocale, jouwTafelPath, type Locale } from "@/i18n/config";
import { sundayDate } from "@/lib/invites/logic";
import { sundaySocialDatePath } from "@/lib/sunday-social-cities";
import { confirmDecline } from "./actions";
import { loadDeclineLink } from "./load";

type Props = {
  params: Promise<{ locale: string; code: string }>;
  searchParams: Promise<{ klaar?: string }>;
};

export const metadata: Metadata = { title: "MyTable", robots: { index: false, follow: false } };

const COPY = {
  nl: {
    ask: (date: string, city: string) => `Kun je ${date} in ${city} niet?`,
    askBody: "Laat het ons weten, dan hoor je niet meer van ons over deze zondag.",
    confirm: "Klopt, ik kan niet",
    doneTitle: "Helder, dank je dat je het laat weten",
    doneBody: (date: string, city: string) =>
      `Je hoort niet meer van ons over ${date}. De volgende keer dat er een tafel in ${city} is, laten we het je weten.`,
    change: "Kan je toch wel?",
    view: "Bekijk deze zondag",
  },
  en: {
    ask: (date: string, city: string) => `Can't make ${date} in ${city}?`,
    askBody: "Let us know, and you won't hear from us about this Sunday again.",
    confirm: "That's right, I can't make it",
    doneTitle: "Got it, thanks for letting us know",
    doneBody: (date: string, city: string) =>
      `You won't hear from us about ${date} again. Next time there's a table in ${city}, we'll let you know.`,
    change: "Can you make it after all?",
    view: "See this Sunday",
  },
};

/** /niet/{code}{n}: "Deze zondag kan ik niet" from an invite, no login needed. */
export default async function DeclinePage({ params, searchParams }: Props) {
  const { locale, code } = await params;
  if (!isValidLocale(locale) || !isDbConfigured()) notFound();
  const link = await loadDeclineLink(code);
  if (!link) notFound();
  const copy = COPY[locale as Locale];
  const date = sundayDate(link.startsAt.toISOString(), locale as Locale);
  const done = link.declined || Boolean((await searchParams).klaar);
  const eventPath = sundaySocialDatePath(locale as Locale, link);

  return (
    <div className="flex min-h-[100svh] flex-col bg-cream text-wine">
      <header className="flex h-16 items-center px-5 sm:px-8">
        <Link href={jouwTafelPath(locale as Locale)} aria-label="MyTable">
          <Logo priority />
        </Link>
      </header>
      <main className="flex flex-1 justify-center px-4 pb-16 pt-4 sm:items-center">
        <div className="h-fit w-full max-w-md rounded-[1.75rem] border border-wine/8 bg-white/70 px-6 py-8 shadow-[0_24px_60px_rgba(43,13,18,0.1)] sm:px-8">
          <span aria-hidden className="block h-px w-12 bg-gold" />
          {done ? (
            <>
              <h1 className="mt-6 font-serif text-3xl text-burgundy">{copy.doneTitle}</h1>
              <p className="mt-3 text-sm leading-relaxed text-wine/70">{copy.doneBody(date, link.city)}</p>
              {eventPath ? (
                <p className="mt-6 text-sm text-wine/60">
                  {copy.change}{" "}
                  <Link href={eventPath} className="font-semibold text-burgundy underline-offset-4 hover:underline">
                    {copy.view}
                  </Link>
                </p>
              ) : null}
            </>
          ) : (
            <>
              <h1 className="mt-6 font-serif text-3xl text-burgundy">{copy.ask(date, link.city)}</h1>
              <p className="mt-3 text-sm leading-relaxed text-wine/70">{copy.askBody}</p>
              <form action={confirmDecline} className="mt-6">
                <input type="hidden" name="code" value={code} />
                <input type="hidden" name="locale" value={locale} />
                <button type="submit" className="w-full rounded-full bg-burgundy px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-cream">
                  {copy.confirm}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
