import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { BookingConfirmationView } from "@/components/booking/BookingConfirmationView";
import { GoogleAdsConfirmationConversion } from "@/components/booking/GoogleAdsConfirmationConversion";
import {
  MetaConfirmationPurchase,
} from "@/components/booking/MetaConfirmationPurchase";
import { ConfirmationPurchaseEmbed } from "@/components/booking/ConfirmationPurchaseEmbed";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getConfirmationPurchase } from "@/lib/analytics/confirmationPurchase";
import { sendMetaCapiPurchaseForSession } from "@/lib/analytics/metaCapi";
import { getBookingConfirmationStatus } from "@/lib/booking-outcome-data";
import type { BookingOutcomeSummary } from "@/lib/booking-outcome-data";
import type { ConfirmationPurchaseData } from "@/lib/analytics/confirmationPurchase";
import { tryFulfillCheckoutSessionSafe } from "@/lib/stripe/fulfill-checkout";
import { ensureConfirmationEmailForCheckoutSession } from "@/lib/email/ensure-confirmation-email";
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

  let confirmation: {
    summary: BookingOutcomeSummary | null;
    pending: boolean;
  } = { summary: null, pending: false };
  let purchase: ConfirmationPurchaseData | null = null;

  if (sessionId) {
    await tryFulfillCheckoutSessionSafe(sessionId, {
      deferEmail: true,
      deferSideEffects: true,
    });
    void ensureConfirmationEmailForCheckoutSession(sessionId);

    try {
      confirmation = await getBookingConfirmationStatus(
        sessionId,
        locale as Locale,
      );
      purchase = await getConfirmationPurchase(sessionId, locale as Locale);
    } catch (err) {
      console.error("[confirmation page] failed to load booking status", err);
    }

    if (confirmation.summary?.bookingId || purchase?.bookingId) {
      void sendMetaCapiPurchaseForSession(sessionId, await headers()).catch(
        (err) => {
          console.error("[confirmation page] Meta CAPI failed", err);
        },
      );
    }
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
        initialSummary={confirmation.summary}
      />
      <Footer dict={dict.footer} locale={locale} />
    </>
  );
}
