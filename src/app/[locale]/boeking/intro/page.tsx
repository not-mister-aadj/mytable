import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SundayTableIntroForm } from "@/components/booking/SundayTableIntroForm";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  findSundayTableIntroBooking,
  isIntroWine,
  saveSundayTableIntroWine,
  verifySundayTableIntroToken,
} from "@/lib/sunday-table-intro";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Meet your table | MyTable",
};

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string; wine?: string }>;
};

/** Where the "introduce yourself" reminder email links to. A wine button in
 * the email already carries the answer (`?wine=red`), so that one click is
 * saved on arrival and the rest of the questions are right there. */
export default async function SundayTableIntroPage({ params, searchParams }: Props) {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const { token, wine } = await searchParams;

  const bookingId = token ? await verifySundayTableIntroToken(token) : null;
  if (!token || !bookingId) notFound();

  if (isIntroWine(wine)) {
    await saveSundayTableIntroWine(bookingId, wine);
  }
  const booking = await findSundayTableIntroBooking({ bookingId });
  if (!booking) notFound();

  const dict = getDictionary(locale);

  return (
    <>
      <Header dict={dict.header} locale={locale} />
      <main className="bg-beige pt-28 sm:pt-36">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <SundayTableIntroForm
            locale={locale}
            city={booking.city}
            auth={{ token }}
            initial={booking.intro}
          />
        </div>
      </main>
      <Footer dict={dict.footer} locale={locale} />
    </>
  );
}
