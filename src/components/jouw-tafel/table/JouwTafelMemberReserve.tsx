"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckIcon } from "@/components/jouw-tafel/icons";
import { openFrom } from "@/lib/membership/early-label";
import { secondaryButton } from "@/components/jouw-tafel/quiz/quiz-ui";
import {
  Guarantees,
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
import { maxSeats, singleTotalCents } from "@/lib/jouw-tafel/table-logic";
import type { ClientMembership } from "@/lib/membership/logic";
import { getMembershipKiesCopy, getMembershipPageCopy, getMembershipReserveCopy } from "@/lib/membership/page-copy";
import {
  DEFAULT_MEMBERSHIP_PLAN,
  MEMBERSHIP_PLANS,
  MEMBERSHIP_PLAN_IDS,
  guestSeatCents,
  lowestMonthlyCents,
  type MembershipPlanId,
} from "@/lib/membership/plans";
import { memberReserveTodayCents } from "@/lib/membership/reserve-logic";
import { trackTableEvent } from "@/lib/posthog/analytics";
import { PostHogEvents } from "@/lib/posthog/events";

/** How this person books this table (decided on the server). */
export type ReserveAccess =
  | { kind: "non_member"; early: boolean }
  | { kind: "included" }
  | { kind: "blocked"; until: string }
  | { kind: "past_due" };

const card = "rounded-2xl border transition-[border-color,background-color,box-shadow] duration-200";
const cardIdle = "border-wine/[0.1] bg-white";
const cardOn = "border-burgundy bg-[#fcf4f2] shadow-[inset_0_0_0_1px_var(--burgundy)]";

function Radio({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={`mt-0.5 flex h-[1.3rem] w-[1.3rem] shrink-0 items-center justify-center rounded-full border-[1.5px] ${
        on ? "border-burgundy bg-burgundy" : "border-wine/20 bg-white"
      }`}
    >
      <span className={`h-2 w-2 rounded-full bg-cream transition-transform ${on ? "scale-100" : "scale-0"}`} />
    </span>
  );
}

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
}: {
  locale: Locale;
  event: QuizEvent;
  guest: ReserveGuest;
  tableHref: string;
  settingsHref: string;
  access: ReserveAccess;
  membership: ClientMembership | null;
}) {
  const t = getTableCopy(locale).reserve;
  const r = getMembershipReserveCopy(locale);
  const mk = getMembershipKiesCopy(locale);
  const planLine = getMembershipPageCopy(locale).plans.plan;
  const [seats, setSeats] = useState<1 | 2>(() => (maxSeats(event) < 2 ? 1 : defaultSeats(guest.answers)));
  const [option, setOption] = useState<"member" | "single">("member");
  const [plan, setPlan] = useState<MembershipPlanId>(DEFAULT_MEMBERSHIP_PLAN);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState<string | null>(null);
  const early = access.kind === "non_member" && access.early;
  // During the members' 48 hours only "Word lid" is possible for others.
  const chosen: "member" | "single" = early ? "member" : option;

  useEffect(() => {
    trackTableEvent(PostHogEvents.reserveStepViewed, {
      event_slug: event.slug,
      locale,
      member: access.kind !== "non_member",
      access: access.kind,
      early,
    });
  }, [event.slug, locale, access.kind, early]);

  function pick(next: "member" | "single", nextPlan: MembershipPlanId = plan) {
    setOption(next);
    setPlan(nextPlan);
    setError(null);
    trackTableEvent(PostHogEvents.reserveOptionSelected, {
      event_slug: event.slug,
      option: next,
      plan: next === "member" ? nextPlan : null,
    });
  }

  async function becomeMember() {
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

  async function go() {
    if (busy) return;
    const opt = access.kind === "included" ? "included" : chosen;
    trackTableEvent(PostHogEvents.reserveCheckoutClicked, {
      event_slug: event.slug,
      option: opt,
      plan: opt === "member" ? plan : null,
      seats,
      locale,
    });
    setBusy(true);
    setError(null);
    const failed =
      access.kind === "included"
        ? await memberBooking()
        : chosen === "member"
          ? await becomeMember()
          : await startSingleCheckout({ locale, event, seats, guest });
    if (failed) setError(failed);
    // Stay busy while the browser leaves for Stripe.
    if (failed || access.kind === "included") setBusy(false);
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

  const todayCents =
    chosen === "member" ? memberReserveTodayCents({ kind: "join", plan, seats }) : singleTotalCents(seats);

  return (
    <ReserveFrame
      locale={locale}
      tableHref={tableHref}
      bar={<PayButton busy={busy} label={r.pay} busyLabel={r.busy} onClick={() => void go()} error={error} />}
    >
      <ReserveSummary locale={locale} event={event} />
      <SeatPicker locale={locale} event={event} seats={seats} onChange={setSeats} />

      <section className="mt-7">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">{r.chooseTitle}</h2>
        <div role="radiogroup" aria-label={r.chooseTitle} className="mt-3 space-y-2.5">
          <div className={`${card} ${chosen === "member" ? cardOn : cardIdle}`}>
            <button
              type="button"
              role="radio"
              aria-checked={chosen === "member"}
              onClick={() => pick("member")}
              className="flex w-full items-start gap-3 rounded-2xl px-4 pb-3 pt-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/40"
            >
              <Radio on={chosen === "member"} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-[1.05rem] font-semibold leading-tight text-wine">{r.member.title}</span>
                  <span className="shrink-0 text-[0.85rem] font-semibold text-burgundy">
                    {r.member.from(euros(lowestMonthlyCents()))}
                  </span>
                </span>
                <span className="mt-1.5 block space-y-1">
                  {r.member.lines.map((line) => (
                    <span key={line} className="flex items-start gap-1.5 text-[0.88rem] leading-snug text-wine/75">
                      <CheckIcon className="mt-[0.15rem] h-3.5 w-3.5 shrink-0 text-gold" />
                      {line}
                    </span>
                  ))}
                </span>
              </span>
            </button>
            {chosen === "member" ? (
              <div className="px-4 pb-4">
                <div role="radiogroup" aria-label={r.planLabel} className="space-y-1.5 pl-[2.05rem]">
                  {MEMBERSHIP_PLAN_IDS.map((id) => {
                    const o = r.planOption(id);
                    const on = plan === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => pick("member", id)}
                        className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border px-3 text-[0.92rem] transition-[border-color,background-color] duration-200 ${
                          on ? "border-burgundy bg-white font-semibold text-burgundy" : "border-wine/[0.1] bg-white/70 text-wine/75"
                        }`}
                      >
                        <span>{o.name}</span>
                        <span className="tabular-nums">{o.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            role="radio"
            aria-checked={chosen === "single"}
            disabled={early}
            onClick={() => pick("single")}
            className={`${card} ${chosen === "single" ? cardOn : cardIdle} flex w-full items-start gap-3 px-4 py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/40 disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <Radio on={chosen === "single"} />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-[1.05rem] font-semibold leading-tight text-wine">{r.single.title}</span>
                <span className="shrink-0 text-[0.85rem] font-semibold text-burgundy">{euros(JOUW_TAFEL_SEAT_PRICE_CENTS)}</span>
              </span>
              <span className="mt-1 block text-[0.88rem] leading-snug text-wine/65">
                {early && event.membersOnlyUntil ? mk.earlyLabel(openFrom(event.membersOnlyUntil, locale)) : r.single.line}
              </span>
            </span>
          </button>
        </div>
      </section>

      <section className="mt-7 space-y-2 border-t border-wine/10 pt-5">
        {chosen === "member" ? (
          <>
            <PriceRow label={r.membershipRow(plan)} amount={euros(MEMBERSHIP_PLANS[plan].initialCents)} />
            {seats === 2 ? (
              <PriceRow label={r.guest} amount={<GuestAmount guestCents={guestSeatCents(plan)} tag={r.memberPrice} />} />
            ) : null}
          </>
        ) : (
          <PriceRow label={t.seatOption(seats)} amount={t.perSeat(euros(JOUW_TAFEL_SEAT_PRICE_CENTS))} />
        )}
        <PriceRow label={r.today} amount={euros(todayCents)} strong />
        {chosen === "member" ? <p className="pt-1 text-[0.82rem] leading-snug text-wine/60">{planLine(plan).line}.</p> : null}
      </section>
      {/* The promises are about single seats (moving, refunds); a member's
          own seat follows the membership terms instead. */}
      {chosen === "single" ? <Guarantees locale={locale} /> : null}
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
