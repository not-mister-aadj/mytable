"use client";

import { AccountAfterBooking } from "@/components/booking/AccountAfterBooking";
import { useEffect, useState } from "react";
import { jouwTafelKiesPath, type Locale } from "@/i18n/config";
import { bookingOutcomeEn } from "@/i18n/booking-outcome-en";
import { bookingOutcomeNl } from "@/i18n/booking-outcome-nl";
import { BookingOutcomeContent } from "@/components/booking/BookingOutcomeContent";
import { BookingOutcomeTracker } from "@/components/booking/BookingOutcomeTracker";
import { SundayTableIntroForm } from "@/components/booking/SundayTableIntroForm";
import { IntroStep, TellFriendsStep } from "@/components/booking/TellFriendsStep";
import { MembershipOfferScreen } from "@/components/booking/MembershipOfferScreen";
import { MemberWelcomeCard } from "@/components/booking/MemberWelcomeCard";
import type { MembershipOffer } from "@/lib/membership/offer";
import { SUNDAY_SOCIAL_CITIES } from "@/lib/sunday-social-cities";
import { isSharedTableType } from "@/lib/event-concepts";
import type { BookingOutcomeSummary } from "@/lib/booking-outcome-data";
import type { SundayTableIntro } from "@/lib/sunday-table-intro";

const POLL_MS = 1000;
const POLL_MAX = 45;

type Step = "friends" | "intro";

type Props = {
  sessionId: string | null;
  locale: Locale;
  initialSummary: BookingOutcomeSummary | null;
  /** Paid while the Sunday filled up: refunded, nothing booked. */
  initialFull?: "refunded" | "member" | null;
  /** "Meet your table" answers already saved for this booking, if any. */
  savedIntro?: SundayTableIntro | null;
  /** Answered before: the intro form first offers to keep those answers. */
  introReusable?: boolean;
  /** The site header and footer, left out while the offer shows. */
  header?: React.ReactNode;
  footer?: React.ReactNode;
  /** The membership offer for this booking, shown before the confirmation. */
  offer?: MembershipOffer | null;
  /** They just became a member through that offer. */
  memberWelcome?: boolean;
  /** A mutual like, and the card did not ask (not signed in): ask here. */
  /** "Meet your table" was answered for this booking: no step for it. */
  introAnswered?: boolean;
  askTellFriends?: boolean;
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
  initialFull = null,
  savedIntro = null,
  introReusable = false,
  header = null,
  footer = null,
  offer = null,
  memberWelcome = false,
  askTellFriends = false,
  introAnswered = false,
}: Props) {
  const dict = locale === "en" ? bookingOutcomeEn : bookingOutcomeNl;
  const [summary, setSummary] = useState(initialSummary);
  const [timedOut, setTimedOut] = useState(false);
  const [full, setFull] = useState(initialFull);
  const [offerOpen, setOfferOpen] = useState(Boolean(offer));
  // The steps between paying and the confirmation, each once.
  const [passed, setPassed] = useState<Step[]>([]);

  useEffect(() => {
    if (!sessionId || summary || full) return;

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
            full?: "refunded" | "member";
          };
          if (body.full) {
            setFull(body.full);
            return;
          }
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
  }, [sessionId, locale, summary, full]);

  const showPending = Boolean(sessionId && !summary);

  // 1. tafelvrienden (when asked), 2. Meet your table (when not answered yet), 3. the confirmation.
  const shared = isSharedTableType(summary?.experienceType);
  const flow: Step[] = [...(askTellFriends ? (["friends"] as const) : []), ...(shared && !introAnswered ? (["intro"] as const) : [])];
  const current = flow.find((s) => !passed.includes(s));
  if (current && sessionId && summary) {
    const step = { n: flow.indexOf(current) + 1, of: flow.length + 1 };
    const next = () => {
      setPassed((p) => [...p, current]);
      window.scrollTo({ top: 0 });
    };
    return (
      <>
        <BookingOutcomeTracker variant="success" locale={locale} summary={summary} />
        {current === "friends" ? (
          <TellFriendsStep locale={locale} sessionId={sessionId} sunday={sundayOf(summary.dateTime, locale)} step={step} onDone={next} />
        ) : (
          <IntroStep
            locale={locale}
            sessionId={sessionId}
            sunday={sundayOf(summary.dateTime, locale)}
            step={step}
            city={summary.city}
            bookingCode={summary.reservationCode}
            seats={summary.seats}
            initial={savedIntro}
            reusable={introReusable}
            onDone={next}
          />
        )}
      </>
    );
  }

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
            city: summary.city || null,
          }}
          onDone={() => {
            setOfferOpen(false);
            window.scrollTo({ top: 0 });
          }}
        />
      </>
    );
  }

  if (full) {
    const en = locale === "en";
    return (
      <>
        {header}
        <main className="mx-auto max-w-lg px-5 py-16 text-center text-wine">
          <h1 className="font-serif text-[2rem] leading-tight text-burgundy">{en ? "This Sunday just filled up" : "Deze zondag was net vol"}</h1>
          <p className="mt-4 text-[1rem] leading-relaxed text-wine/75">
            {full === "member"
              ? en
                ? "Welcome as a club member. While you joined, the last seat for this Sunday went to someone else. Your club membership is active: pick another Sunday."
                : "Welkom als club member. Terwijl je lid werd, ging de laatste plek voor deze zondag net naar iemand anders. Je club membership loopt: kies een andere zondag."
              : en
                ? "While you were paying, the last seat went to someone else. We sent your money straight back; it is in your account within a few days. You also got a mail about it."
                : "Terwijl je betaalde, ging de laatste plek net naar iemand anders. Je geld hebben we meteen teruggestort; binnen een paar dagen staat het weer op je rekening. Je kreeg er ook een mail over."}
          </p>
          <a
            href={jouwTafelKiesPath(locale)}
            className="mt-8 inline-flex rounded-full bg-burgundy px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-burgundy/90"
          >
            {en ? "Pick another Sunday" : "Kies een andere zondag"}
          </a>
        </main>
        {footer}
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
            {sessionId && summary ? <AccountAfterBooking locale={locale} sessionId={sessionId} /> : null}
            {/* Answered before this visit: the answers stay to look at and change. */}
            {sessionId && summary && shared && !flow.includes("intro") ? (
              <SundayTableIntroForm
                locale={locale}
                city={summary.city}
                auth={{ sessionId }}
                bookingCode={summary.reservationCode}
                seats={summary.seats}
                initial={savedIntro}
                reusable={introReusable}
              />
            ) : null}
          </>
        }
      />
      {footer}
    </>
  );
}
