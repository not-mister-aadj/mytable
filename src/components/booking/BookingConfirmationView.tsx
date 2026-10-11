"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { bookingOutcomeEn } from "@/i18n/booking-outcome-en";
import { bookingOutcomeNl } from "@/i18n/booking-outcome-nl";
import { BookingOutcomeContent } from "@/components/booking/BookingOutcomeContent";
import { BookingOutcomeTracker } from "@/components/booking/BookingOutcomeTracker";
import { SundayTableIntroForm } from "@/components/booking/SundayTableIntroForm";
import { MembershipOfferScreen } from "@/components/booking/MembershipOfferScreen";
import { MemberWelcomeCard } from "@/components/booking/MemberWelcomeCard";
import type { MembershipOffer } from "@/lib/membership/offer";
import { SUNDAY_SOCIAL_CITIES } from "@/lib/sunday-social-cities";
import type { BookingOutcomeSummary } from "@/lib/booking-outcome-data";
import type { SundayTableIntro } from "@/lib/sunday-table-intro";

const POLL_MS = 1000;
const POLL_MAX = 45;

type Props = {
  sessionId: string | null;
  locale: Locale;
  initialSummary: BookingOutcomeSummary | null;
  /** "Meet your table" answers already saved for this booking, if any. */
  savedIntro?: SundayTableIntro | null;
  /** The site header and footer, left out while the offer shows. */
  header?: React.ReactNode;
  footer?: React.ReactNode;
  /** The membership offer for this booking, shown before the confirmation. */
  offer?: MembershipOffer | null;
  /** They just became a member through that offer. */
  memberWelcome?: boolean;
};

/** "Zondag 8 november · 14:00" -> "zondag 8 november". */
function sundayOf(dateTime: string | undefined, locale: Locale): string | null {
  const day = dateTime?.split("·")[0]?.trim();
  if (!day) return null;
  return locale === "en" ? day : day.charAt(0).toLocaleLowerCase("nl-NL") + day.slice(1);
}

export function BookingConfirmationView({
  sessionId,
  locale,
  initialSummary,
  savedIntro = null,
  header = null,
  footer = null,
  offer = null,
  memberWelcome = false,
}: Props) {
  const dict = locale === "en" ? bookingOutcomeEn : bookingOutcomeNl;
  const [summary, setSummary] = useState(initialSummary);
  const [timedOut, setTimedOut] = useState(false);
  const [offerOpen, setOfferOpen] = useState(Boolean(offer));

  useEffect(() => {
    if (!sessionId || summary) return;

    let cancelled = false;

    async function poll(attempt = 0): Promise<void> {
      if (cancelled) return;

      try {
        const params = new URLSearchParams({ session_id: sessionId!, locale });
        const res = await fetch(`/api/booking/confirmation?${params.toString()}`);
        if (res.ok) {
          const body = (await res.json()) as {
            summary?: BookingOutcomeSummary | null;
            pending?: boolean;
          };
          if (body.summary) {
            setSummary(body.summary);
            setTimedOut(false);
            return;
          }
        }
      } catch {
        // retry
      }

      if (attempt >= POLL_MAX) {
        setTimedOut(true);
        return;
      }

      window.setTimeout(() => void poll(attempt + 1), POLL_MS);
    }

    void poll();

    return () => {
      cancelled = true;
    };
  }, [sessionId, locale, summary]);

  const showPending = Boolean(sessionId && !summary);

  if (offer && offerOpen && sessionId && summary) {
    return (
      <>
        <BookingOutcomeTracker variant="success" locale={locale} summary={summary} />
        <MembershipOfferScreen
          locale={locale}
          sessionId={sessionId}
          sunday={sundayOf(summary.dateTime, locale)}
          amounts={{
            ...offer,
            paidCents: summary.amountCents ?? offer.singleSeatCents,
            cities: SUNDAY_SOCIAL_CITIES.length,
          }}
          onDone={() => {
            setOfferOpen(false);
            window.scrollTo({ top: 0 });
          }}
        />
      </>
    );
  }

  return (
    <>
      {header}
      <BookingOutcomeTracker
        variant="success"
        locale={locale}
        summary={summary}
      />
      <BookingOutcomeContent
        variant={showPending ? "pending" : "success"}
        dict={dict}
        locale={locale}
        summary={summary}
        timedOut={timedOut}
        afterSummary={
          <>
            {memberWelcome ? <MemberWelcomeCard locale={locale} /> : null}
            {sessionId && summary?.experienceType === "sunday-table" ? (
              <SundayTableIntroForm
                locale={locale}
                city={summary.city}
                auth={{ sessionId }}
                bookingCode={summary.reservationCode}
                seats={summary.seats}
                initial={savedIntro}
              />
            ) : null}
          </>
        }
      />
      {footer}
    </>
  );
}
