"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckIcon } from "@/components/jouw-tafel/icons";
import { openFrom } from "@/lib/membership/early-label";
import { secondaryButton } from "@/components/jouw-tafel/quiz/quiz-ui";
import {
  PayButton,
  PriceRow,
  ReserveFrame,
  ReserveSummary,
  SeatPicker,
  euros,
  startSingleCheckout,
  type ReserveGuest,
} from "@/components/jouw-tafel/table/JouwTafelReserve";
import type { Locale } from "@/i18n/config";
import { getMetaBrowserCookies, getMetaEventSourceUrl } from "@/lib/analytics/metaCookies";
import { getStoredUtm } from "@/lib/analytics/utm";
import { JOUW_TAFEL_CHECKOUT_SOURCE, JOUW_TAFEL_SEAT_PRICE_CENTS, type QuizEvent } from "@/lib/jouw-tafel/logic";
import { checkoutTableLanguage, defaultSeats, dietaryNotes } from "@/lib/jouw-tafel/quiz-logic";
import { getTableCopy } from "@/lib/jouw-tafel/table-copy";
import { maxSeats } from "@/lib/jouw-tafel/table-logic";
import type { ClientMembership } from "@/lib/membership/logic";
import { getMembershipKiesCopy, getMembershipReserveCopy } from "@/lib/membership/page-copy";
import { guestSeatCents, type MembershipPlanId } from "@/lib/membership/plans";
import { memberReserveTodayCents } from "@/lib/membership/reserve-logic";
import { ReservePaywall } from "@/components/jouw-tafel/table/ReservePaywall";
import { trackTableEvent } from "@/lib/posthog/analytics";
import { PostHogEvents } from "@/lib/posthog/events";

/** How this person books this table (decided on the server). */
export type ReserveAccess =
  | { kind: "non_member"; early: boolean }
  | { kind: "included" }
  | { kind: "blocked"; until: string }
  | { kind: "past_due" };

/** "Gast: €15 €9 (ledenprijs)". */
function GuestAmount({ guestCents, tag }: { guestCents: number; tag: string }) {
  return (
    <span>
      <s className="text-wine/45">{euros(JOUW_TAFEL_SEAT_PRICE_CENTS)}</s>{" "}
      <span className="font-semibold text-burgundy">{euros(guestCents)}</span>{" "}
      <span className="text-wine/55">({tag})</span>
    </span>
  );
}

/**
 * Reserveren with the membership: "Kies hoe je aanschuift" (Word lid,
 * preselected, or Losse plek) for non-members; members book their own seat
 * straight away (a guest seat still goes through payment); a blocked or
 * past-due member sees why they cannot book.
 */
export function JouwTafelMemberReserve({
  locale,
  event,
  guest,
  tableHref,
  settingsHref,
  access,
  membership,
  proofCount = null,
}: {
  locale: Locale;
  event: QuizEvent;
  guest: ReserveGuest;
  tableHref: string;
  settingsHref: string;
  access: ReserveAccess;
  membership: ClientMembership | null;
  /** Distinct sign-ups for the proof line (SIGNUP_COUNT_MIN and up), else null. */
  proofCount?: number | null;
}) {
  const t = getTableCopy(locale).reserve;
  const r = getMembershipReserveCopy(locale);
  const mk = getMembershipKiesCopy(locale);
  const [seats, setSeats] = useState<1 | 2>(() => (maxSeats(event) < 2 ? 1 : defaultSeats(guest.answers)));
  const [paywallBusy, setPaywallBusy] = useState<"join" | "single" | null>(null);
  const [paywallError, setPaywallError] = useState<{ on: "join" | "single"; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState<string | null>(null);
  // During the members' 48 hours only joining is possible for others.
  const early = access.kind === "non_member" && access.early;

  useEffect(() => {
    trackTableEvent(PostHogEvents.reserveStepViewed, {
      event_slug: event.slug,
      locale,
      member: access.kind !== "non_member",
      access: access.kind,
      early,
    });
  }, [event.slug, locale, access.kind, early]);

  async function becomeMember(plan: MembershipPlanId, seats: 1 | 2) {
    try {
      const res = await fetch("/api/membership/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          locale,
          source: "kies",
          table: {
            eventId: event.id,
            seats,
            name: guest.answers.name ?? "",
            dietaryNotes: dietaryNotes(guest.answers) || undefined,
            tableLanguagePreference: checkoutTableLanguage(guest.answers.language),
          },
          meta: { ...getMetaBrowserCookies(), eventSourceUrl: getMetaEventSourceUrl() },
        }),
      });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !data?.url) {
        Sentry.withScope((scope) => {
          scope.setTag("flow", "jouw_tafel_reserve_membership");
          scope.setExtras({ status: res.status, error: data?.error });
          Sentry.captureMessage("Reserve membership checkout failed", "warning");
        });
        return data?.error ?? t.error;
      }
      window.location.assign(data.url);
      return null;
    } catch {
      return t.error;
    }
  }

  /** A member's booking: own seat booked straight away, a guest seat paid. */
  async function memberBooking() {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          source: JOUW_TAFEL_CHECKOUT_SOURCE,
          email: guest.email,
          name: guest.answers.name ?? "",
          seats,
          locale,
          tableLanguagePreference: checkoutTableLanguage(guest.answers.language),
          dietaryNotes: dietaryNotes(guest.answers) || undefined,
          utm: getStoredUtm(),
          meta: { ...getMetaBrowserCookies(), eventSourceUrl: getMetaEventSourceUrl() },
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { url?: string; error?: string; booked?: boolean; code?: string }
        | null;
      if (res.ok && data?.booked) {
        setBooked(data.code ?? "");
        return null;
      }
      if (!res.ok || !data?.url) {
        Sentry.withScope((scope) => {
          scope.setTag("flow", "jouw_tafel_reserve_member_seat");
          scope.setExtras({ status: res.status, error: data?.error });
          Sentry.captureMessage("Reserve member booking failed", "warning");
        });
        return data?.error ?? t.error;
      }
      window.location.assign(data.url);
      return null;
    } catch {
      return t.error;
    }
  }

  /** Members: own seat straight away, or to payment for a guest. */
  async function go() {
    if (busy) return;
    trackTableEvent(PostHogEvents.reserveCheckoutClicked, { event_slug: event.slug, option: "included", plan: null, seats, locale });
    setBusy(true);
    setError(null);
    const failed = await memberBooking();
    if (failed) setError(failed);
    setBusy(false);
  }

  // ------------------------------------------------------------- states

  if (access.kind === "blocked" || access.kind === "past_due") {
    return (
      <ReserveFrame
        locale={locale}
        tableHref={tableHref}
        bar={
          <Link href={settingsHref} className={secondaryButton}>
            {mk.settingsLink}
          </Link>
        }
      >
        <ReserveSummary locale={locale} event={event} />
        <p role="status" className="mt-7 text-[1rem] leading-relaxed text-wine/80">
          {access.kind === "blocked" ? mk.blocked(openFrom(access.until, locale)) : mk.pastDue}
        </p>
      </ReserveFrame>
    );
  }

  if (booked !== null) {
    return (
      <ReserveFrame
        locale={locale}
        tableHref={tableHref}
        bar={
          <Link href={settingsHref} className={secondaryButton}>
            {mk.bookedLink}
          </Link>
        }
      >
        <ReserveSummary locale={locale} event={event} />
        <div role="status" className="mt-8 text-center">
          <span aria-hidden className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-burgundy text-cream">
            <CheckIcon className="h-5 w-5" />
          </span>
          <p className="mt-4 text-[1.05rem] font-semibold leading-snug text-wine">{mk.booked}</p>
          {booked ? <p className="mt-1 text-sm tracking-[0.06em] text-wine/55">{booked}</p> : null}
        </div>
      </ReserveFrame>
    );
  }

  // ------------------------------------------------------------- members

  if (access.kind === "included" && membership) {
    const guestCents = guestSeatCents(membership.plan);
    return (
      <ReserveFrame
        locale={locale}
        tableHref={tableHref}
        bar={
          <PayButton
            busy={busy}
            label={seats === 1 ? r.bookIncluded : r.pay}
            busyLabel={r.busy}
            onClick={() => void go()}
            error={error}
          />
        }
      >
        <ReserveSummary locale={locale} event={event} />
        <SeatPicker locale={locale} event={event} seats={seats} onChange={setSeats} />
        <section className="mt-7 space-y-2 border-t border-wine/10 pt-5">
          <PriceRow label={r.yourSeat} amount={r.included} />
          {seats === 2 ? (
            <PriceRow label={r.guest} amount={<GuestAmount guestCents={guestCents} tag={r.memberPrice} />} />
          ) : null}
          <PriceRow label={r.today} amount={euros(memberReserveTodayCents({ kind: "included", plan: membership.plan, seats }))} strong />
        </section>
      </ReserveFrame>
    );
  }

  // ------------------------------------------------------------- non-members

  async function join(nextPlan: MembershipPlanId, nextSeats: 1 | 2) {
    if (paywallBusy) return;
    trackTableEvent(PostHogEvents.reserveCheckoutClicked, {
      event_slug: event.slug,
      option: "member",
      plan: nextPlan,
      seats: nextSeats,
      locale,
    });
    setPaywallBusy("join");
    setPaywallError(null);
    const failed = await becomeMember(nextPlan, nextSeats);
    if (failed) {
      setPaywallError({ on: "join", message: failed });
      setPaywallBusy(null);
    }
  }

  async function single(nextSeats: 1 | 2) {
    if (paywallBusy) return;
    trackTableEvent(PostHogEvents.reserveCheckoutClicked, {
      event_slug: event.slug,
      option: "single",
      plan: null,
      seats: nextSeats,
      locale,
    });
    setPaywallBusy("single");
    setPaywallError(null);
    const failed = await startSingleCheckout({ locale, event, seats: nextSeats, guest });
    if (failed) {
      setPaywallError({ on: "single", message: failed });
      setPaywallBusy(null);
    }
  }

  return (
    <ReserveFrame locale={locale} tableHref={tableHref}>
      <ReservePaywall
        locale={locale}
        event={event}
        early={early}
        proofCount={proofCount}
        busy={paywallBusy}
        error={paywallError}
        onJoin={(p, n) => void join(p, n)}
        onSingle={(n) => void single(n)}
      />
    </ReserveFrame>
  );
}

/** The table page's bottom bar for a blocked or past-due member. */
export function MemberStateCta({
  locale,
  access,
  settingsHref,
}: {
  locale: Locale;
  access: Extract<ReserveAccess, { kind: "blocked" } | { kind: "past_due" }>;
  settingsHref: string;
}) {
  const mk = getMembershipKiesCopy(locale);
  return (
    <div className="text-center">
      <p role="status" className="mb-2.5 text-[0.9rem] leading-snug text-wine/75">
        {access.kind === "blocked" ? mk.blocked(openFrom(access.until, locale)) : mk.pastDue}
      </p>
      <Link href={settingsHref} className={secondaryButton}>
        {mk.settingsLink}
      </Link>
    </div>
  );
}
