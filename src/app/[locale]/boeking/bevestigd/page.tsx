import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { BookingOutcomeContent } from "@/components/booking/BookingOutcomeContent";
import { BookingOutcomeTracker } from "@/components/booking/BookingOutcomeTracker";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getBookingConfirmationStatus } from "@/lib/booking-outcome-data";
import { sendMetaCapiPurchaseForSession } from "@/lib/analytics/metaCapi";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string }>;
};

export default async function BookingConfirmedPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const { session_id: sessionId } = await searchParams;
  if (!isValidLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const confirmation = sessionId
    ? await getBookingConfirmationStatus(sessionId, locale as Locale)
    : { summary: null, pending: false };
  const summary = confirmation.summary;

  if (sessionId && summary?.bookingId) {
    void sendMetaCapiPurchaseForSession(sessionId, await headers());
  }

  return (
    <>
      <Header dict={dict.header} locale={locale} />
      <BookingOutcomeTracker
        variant="success"
        locale={locale as Locale}
        summary={summary}
        sessionId={sessionId}
      />
      <BookingOutcomeContent
        variant="success"
        dict={dict.bookingOutcome}
        locale={locale}
        summary={summary}
      />
      <Footer dict={dict.footer} locale={locale} />
    </>
  );
}
