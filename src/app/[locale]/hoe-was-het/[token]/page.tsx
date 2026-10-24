import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { isValidLocale, sundayTableLpPath, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getSiteUrl } from "@/lib/env";
import { loadFeedbackPage, verifyFeedbackToken } from "@/lib/feedback";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Hoe was het? | MyTable",
  openGraph: { title: "MyTable · Hoe was het?" },
};

type Props = { params: Promise<{ locale: string; token: string }> };

/** The page behind the 20:00 mail: how was your afternoon. */
export default async function FeedbackRoute({ params }: Props) {
  const { locale: localeParam, token: rawToken } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const dict = getDictionary(locale);
  const token = decodeURIComponent(rawToken);
  const bookingId = await verifyFeedbackToken(token);
  const page = bookingId ? await loadFeedbackPage(bookingId) : null;

  return (
    <>
      <Header dict={dict.header} locale={locale} />
      <main className="bg-beige pb-16 pt-28 sm:pt-36">
        <div className="mx-auto max-w-2xl px-5 sm:px-8">
          {page ? (
            <FeedbackForm page={page} token={token} shareUrl={`${getSiteUrl().replace(/\/$/, "")}${page.cityPath}`} />
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
      <Footer dict={dict.footer} locale={locale} showFormats={false} />
    </>
  );
}
