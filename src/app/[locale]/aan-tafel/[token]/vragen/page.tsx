import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { VenueQuestions } from "@/components/table-page/VenueQuestions";
import { getDb } from "@/db/index";
import { bookings } from "@/db/schema";
import { isValidLocale, sundayTableLpPath, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { longDate } from "@/lib/admin/sunday-mails";
import { loadTablePage, verifyTablePageToken } from "@/lib/table-page";
import { LIVE_MUSIC, LIVE_MUSIC_ANSWERS, parseVenueAnswers, type LiveMusicAnswer } from "@/lib/venue-questions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Twee vragen | MyTable",
  openGraph: { title: "MyTable" },
};

type Props = { params: Promise<{ locale: string; token: string }>; searchParams: Promise<{ dieet?: string; muziek?: string }> };

const MUSIC: Record<string, LiveMusicAnswer> = { ja: "yes", misschien: "maybe", nee: "no" };

/** The venue's questions before a Sunday (diet, live music). Never names the venue: the location may not be out yet. */
export default async function VenueQuestionsRoute({ params, searchParams }: Props) {
  const { locale: localeParam, token: rawToken } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const lang = locale === "en" ? "en" : "nl";
  const dict = getDictionary(locale);
  const token = decodeURIComponent(rawToken);
  const q = await searchParams;
  const bookingId = await verifyTablePageToken(token);
  const page = bookingId ? await loadTablePage(bookingId) : null;
  const usable = page && !page.cancelled && !page.started ? page : null;
  const [row] = usable
    ? await getDb().select({ answers: bookings.venueAnswers, eventId: bookings.eventId }).from(bookings).where(eq(bookings.id, usable.bookingId)).limit(1)
    : [];
  const music = row ? (LIVE_MUSIC[row.eventId] ?? null) : null;
  // The tap in the mail: saved by the page in the browser, not by fetching the link.
  const tapped = {
    ...(q.dieet === "nee" ? { diet: "none" as const } : q.dieet === "ja" ? { diet: "some" as const } : {}),
    ...(music && q.muziek && MUSIC[q.muziek] && LIVE_MUSIC_ANSWERS.includes(MUSIC[q.muziek]!) ? { liveMusic: MUSIC[q.muziek] } : {}),
  };
  const when = usable ? longDate(usable.startsAt, lang) : "";

  return (
    <>
      <Header dict={dict.header} locale={locale} />
      <main className="bg-beige pb-16 pt-28 sm:pt-36">
        <div className="mx-auto max-w-2xl px-5 sm:px-8">
          {usable && row ? (
            <VenueQuestions
              token={token}
              locale={lang}
              sunday={`${when.charAt(0).toUpperCase()}${when.slice(1)}`}
              musicFrom={music?.from ?? null}
              initial={parseVenueAnswers(row.answers)}
              tapped={tapped}
            />
          ) : (
            <section className="rounded-3xl border border-gold/30 bg-cream px-6 py-8 text-center sm:px-8">
              <h1 className="font-serif text-2xl text-wine">{lang === "en" ? "This link doesn't work anymore" : "Deze link werkt niet meer"}</h1>
              <Link href={sundayTableLpPath(locale)} className="mt-5 inline-flex rounded-full bg-burgundy px-5 py-2.5 text-sm font-semibold text-cream">
                Sunday Social
              </Link>
            </section>
          )}
        </div>
      </main>
      <Footer dict={dict.footer} locale={locale} showFormats={false} />
    </>
  );
}
