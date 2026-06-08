import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { BookingConfirmationView } from "@/components/booking/BookingConfirmationView";
import { GoogleAdsConfirmationConversion } from "@/components/booking/GoogleAdsConfirmationConversion";
import {
  ConfirmationPurchaseEmbed,
  MetaConfirmationPurchase,
} from "@/components/booking/MetaConfirmationPurchase";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getConfirmationPurchase } from "@/lib/analytics/confirmationPurchase";
import { sendMetaCapiPurchaseForSession } from "@/lib/analytics/metaCapi";
import { getBookingConfirmationStatus } from "@/lib/booking-outcome-data";
import { tryFulfillCheckoutSession } from "@/lib/stripe/fulfill-checkout";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

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

  if (sessionId) {
    await tryFulfillCheckoutSession(sessionId, {
      deferEmail: true,
      deferSideEffects: true,
    });
  }

  const confirmation = sessionId
    ? await getBookingConfirmationStatus(sessionId, locale as Locale)
    : { summary: null, pending: false };
  const purchase = sessionId
    ? await getConfirmationPurchase(sessionId, locale as Locale)
    : null;

  if (sessionId && (confirmation.summary?.bookingId || purchase?.bookingId)) {
    void sendMetaCapiPurchaseForSession(sessionId, await headers());
  }

  return (
    <>
      {purchase ? <ConfirmationPurchaseEmbed data={purchase} /> : null}
      <Header dict={dict.header} locale={locale} />
      <MetaConfirmationPurchase
        initial={purchase}
        locale={locale as Locale}
      />
      <GoogleAdsConfirmationConversion
        initial={purchase}
        locale={locale as Locale}
      />
      <BookingConfirmationView
        sessionId={sessionId ?? null}
        locale={locale as Locale}
        dict={dict.bookingOutcome}
        initialSummary={confirmation.summary}
      />
      <Footer dict={dict.footer} locale={locale} />
    </>
  );
}
