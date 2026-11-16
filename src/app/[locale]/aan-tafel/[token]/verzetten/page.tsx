import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MoveSeat } from "@/components/table-page/MoveSeat";
import { isValidLocale, jouwTafelSettingsPath, sundayTableLpPath, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { longDate } from "@/lib/admin/sunday-mails";

import { loadMovePage } from "@/lib/seat-move";
import { verifyTablePageToken } from "@/lib/table-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Verzetten | MyTable",
  openGraph: { title: "MyTable" },
};

type Props = { params: Promise<{ locale: string; token: string }> };

const COPY = {
  nl: {
    invalid: "Deze link werkt niet meer",
    movedTitle: "Je plek is verzet.",
    moved: (to: string) => `Je schuift nu aan op ${to}.`,
    table: "Naar je tafelpagina",
    too_late: ["Verzetten kan niet meer", "Je plek ligt vast. Je tafel is op jou ingedeeld."],
    member: ["Je plek hoort bij je lidmaatschap", "Afmelden kan in je account, tot 48 uur vooraf."],
    gone: ["Deze boeking is niet meer actief", ""],
    account: "Naar je account",
  },
  en: {
    invalid: "This link doesn't work anymore",
    movedTitle: "Your seat has been moved.",
    moved: (to: string) => `You're now joining on ${to}.`,
    table: "To your table page",
    too_late: ["Moving is no longer possible", "Your seat is fixed. Your table is made around you."],
    member: ["Your seat is part of your membership", "You can cancel in your account, until 48 hours before."],
    gone: ["This booking is no longer active", ""],
    account: "To your account",
  },
} as const;

const card = "rounded-3xl border border-gold/30 bg-cream px-6 py-8 text-center sm:px-8";
const cta = "mt-5 inline-flex rounded-full bg-burgundy px-5 py-2.5 text-sm font-semibold text-cream";

/** "Ik wil verzetten" from "Kom je zondag?" and from the table page. */
export default async function MoveSeatRoute({ params }: Props) {
  const { locale: localeParam, token: rawToken } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const dict = getDictionary(locale);
  const lang = locale === "en" ? "en" : "nl";
  const t = COPY[lang];
  const token = decodeURIComponent(rawToken);
  const bookingId = await verifyTablePageToken(token);
  const page = bookingId ? await loadMovePage(bookingId, lang) : null;
  const tableHref = `${locale === "en" ? "/en" : ""}/aan-tafel/${encodeURIComponent(token)}`;
  const label = (startsAt: string, city: string) => `${longDate(new Date(startsAt), lang)} ${lang === "en" ? "in" : "in"} ${city}`;

  return (
    <>
      <Header dict={dict.header} locale={locale} />
      <main className="bg-beige pb-16 pt-28 sm:pt-36">
        <div className="mx-auto max-w-2xl px-5 sm:px-8">
          {!page ? (
            <section className={card}>
              <h1 className="font-serif text-2xl text-wine">{t.invalid}</h1>
              <Link href={sundayTableLpPath(locale)} className={cta}>
                Sunday Social
              </Link>
            </section>
          ) : page.state === "open" ? (
            <MoveSeat
              token={token}
              locale={lang}
              own={label(page.startsAt, page.city)}
              options={page.options.map((o) => ({ eventId: o.eventId, label: label(o.startsAt, o.city).replace(" in ", " · ") }))}
              tableHref={tableHref}
            />
          ) : page.state === "moved" ? (
            <section className={card}>
              <h1 className="font-serif text-3xl text-wine">{t.movedTitle}</h1>
              <p className="mt-2 text-sm text-wine/70">{t.moved(label(page.startsAt, page.city))}</p>
              <Link href={page.tableUrl} className={cta}>
                {t.table}
              </Link>
            </section>
          ) : (
            <section className={card}>
              <h1 className="font-serif text-2xl text-wine">{t[page.reason][0]}</h1>
              {t[page.reason][1] ? <p className="mt-2 text-sm text-wine/70">{t[page.reason][1]}</p> : null}
              {page.reason === "member" ? (
                <Link href={jouwTafelSettingsPath(locale)} className={cta}>
                  {t.account}
                </Link>
              ) : page.reason !== "gone" ? (
                <Link href={tableHref} className={cta}>
                  {t.table}
                </Link>
              ) : null}
            </section>
          )}
        </div>
      </main>
      <Footer dict={dict.footer} locale={locale} showFormats={false} />
    </>
  );
}
