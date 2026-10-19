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
import {
  findSundayTableIntroBooking,
  type SundayTableIntro,
} from "@/lib/sunday-table-intro";
import { tryFulfillMembershipSession } from "@/lib/membership/fulfill";
import { getMembershipOffer, isOfferMembershipOf, type MembershipOffer } from "@/lib/membership/offer";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Boeking bevestigd | MyTable",
};

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string; lid?: string }>;
};

export default async function BookingConfirmedPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const { session_id: sessionId, lid: membershipSessionId } = await searchParams;
  if (!isValidLocale(locale)) notFound();

  const dict = getDictionary(locale);

  let confirmation: {
    summary: BookingOutcomeSummary | null;
    pending: boolean;
  } = { summary: null, pending: false };
  let purchase: ConfirmationPurchaseData | null = null;
  // Answers already saved for this booking, so coming back to this page
  // shows them instead of an empty form.
  let savedIntro: SundayTableIntro | null = null;
  let introReusable = false;
  // The membership offer comes before the confirmation, once per booking.
  let offer: MembershipOffer | null = null;
  // Back from Stripe after saying yes to it.
  let memberWelcome = false;

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
      if (confirmation.summary?.experienceType === "sunday-table") {
        const introBooking = await findSundayTableIntroBooking({ checkoutSessionId: sessionId });
        savedIntro = introBooking?.intro ?? null;
        introReusable = introBooking?.reusable ?? false;
      }
    } catch (err) {
      console.error("[confirmation page] failed to load booking status", err);
    }

    try {
      if (membershipSessionId) {
        const fulfilled = await tryFulfillMembershipSession(membershipSessionId);
        // "Elke zondag" in the booking card: one Checkout for both, so the
        // two ids are the same. Else the offer after a single seat.
        memberWelcome = Boolean(
          fulfilled?.ok &&
            (membershipSessionId === sessionId || (await isOfferMembershipOf(sessionId, fulfilled.membership.email))),
        );
      }
      if (confirmation.summary && !memberWelcome) offer = await getMembershipOffer(sessionId);
    } catch (err) {
      console.error("[confirmation page] membership offer failed", err);
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
        savedIntro={savedIntro}
        introReusable={introReusable}
        header={<Header dict={dict.header} locale={locale} />}
        footer={<Footer dict={dict.footer} locale={locale} />}
        offer={offer}
        memberWelcome={memberWelcome}
      />
    </>
  );
}
