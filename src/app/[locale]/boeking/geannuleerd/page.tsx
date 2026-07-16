import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { BookingOutcomeContent } from "@/components/booking/BookingOutcomeContent";
import { BookingOutcomeTracker } from "@/components/booking/BookingOutcomeTracker";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getEventSummaryBySlug } from "@/lib/booking-outcome-data";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Boeking geannuleerd | MyTable",
};

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ event?: string }>;
};

export default async function BookingCancelledPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const { event: eventSlug } = await searchParams;
  if (!isValidLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const summary = eventSlug
    ? await getEventSummaryBySlug(eventSlug, locale as Locale)
    : null;

  return (
    <>
      <Header dict={dict.header} locale={locale} />
      <BookingOutcomeTracker
        variant="failed"
        locale={locale as Locale}
        summary={summary}
        eventSlug={eventSlug}
      />
      <BookingOutcomeContent
        variant="failed"
        dict={dict.bookingOutcome}
        locale={locale}
        summary={summary}
      />
      <Footer dict={dict.footer} locale={locale} />
    </>
  );
}
