import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { BookingOutcomeContent } from "@/components/booking/BookingOutcomeContent";
import { BookingOutcomeTracker } from "@/components/booking/BookingOutcomeTracker";
import { GoogleAdsConfirmationConversion } from "@/components/booking/GoogleAdsConfirmationConversion";
import { MetaConfirmationPurchase } from "@/components/booking/MetaConfirmationPurchase";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getConfirmationPurchase } from "@/lib/analytics/confirmationPurchase";
import { sendMetaCapiPurchaseForSession } from "@/lib/analytics/metaCapi";
import { getBookingConfirmationStatus } from "@/lib/booking-outcome-data";
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
  const purchase = sessionId
    ? await getConfirmationPurchase(sessionId, locale as Locale)
    : null;

  if (sessionId && (summary?.bookingId || purchase?.bookingId)) {
    void sendMetaCapiPurchaseForSession(sessionId, await headers());
  }

  return (
    <>
      <Header dict={dict.header} locale={locale} />
      {sessionId ? (
        <>
          <MetaConfirmationPurchase
            initial={purchase}
            sessionId={sessionId}
            locale={locale as Locale}
          />
          <GoogleAdsConfirmationConversion
            initial={purchase}
            sessionId={sessionId}
            locale={locale as Locale}
          />
        </>
      ) : null}
      <BookingOutcomeTracker
        variant="success"
        locale={locale as Locale}
        summary={summary}
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
