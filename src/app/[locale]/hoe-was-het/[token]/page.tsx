import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { isValidLocale, sundayTableLpPath, type Locale } from "@/i18n/config";
import { loadFeedbackPage, verifyFeedbackToken, type Mood } from "@/lib/feedback";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Hoe was het? | MyTable",
  openGraph: { title: "MyTable · Hoe was het?" },
};

type Props = { params: Promise<{ locale: string; token: string }>; searchParams: Promise<{ antwoord?: string | string[] }> };

const MOODS: readonly Mood[] = ["great", "good", "meh", "bad"];

/** The page behind the 20:00 mail: how was your afternoon. A quiet screen of
 * its own (the logo, no menu and no footer); `?antwoord=` is the answer
 * tapped in the mail. */
export default async function FeedbackRoute({ params, searchParams }: Props) {
  const { locale: localeParam, token: rawToken } = await params;
  const { antwoord } = await searchParams;
  const mailAnswer = MOODS.find((m) => m === antwoord) ?? null;
  if (!isValidLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const token = decodeURIComponent(rawToken);
  const bookingId = await verifyFeedbackToken(token);
  const page = bookingId ? await loadFeedbackPage(bookingId) : null;

  return (
    <>
      <main className="min-h-dvh bg-beige pb-16 pt-8 sm:pt-12">
        <div className="mx-auto max-w-2xl px-5 sm:px-8">
          <div className="mb-7 flex justify-center sm:mb-10">
            <Logo variant="header" priority />
          </div>
          {page ? (
            <FeedbackForm page={page} token={token} mailAnswer={mailAnswer} />
          ) : (
            <section className="rounded-3xl border border-gold/30 bg-cream px-6 py-8 text-center sm:px-8">
              <h1 className="font-serif text-2xl text-wine">{locale === "en" ? "This link doesn't work" : "Deze link werkt niet"}</h1>
              <Link href={sundayTableLpPath(locale)} className="mt-5 inline-flex rounded-full bg-burgundy px-5 py-2.5 text-sm font-semibold text-cream">
                Sunday Social
              </Link>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
