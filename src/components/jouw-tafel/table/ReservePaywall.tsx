"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRef, useState, type KeyboardEvent } from "react";
import { primaryButton } from "@/components/jouw-tafel/quiz/quiz-ui";
import { tableDate, tableTime } from "@/components/jouw-tafel/table/JouwTafelTable";
import { Guarantees, PriceRow, SeatPicker, euros } from "@/components/jouw-tafel/table/JouwTafelReserve";
import type { Locale } from "@/i18n/config";
import { JOUW_TAFEL_SEAT_PRICE_CENTS, displayCity, type QuizEvent } from "@/lib/jouw-tafel/logic";
import { getTableCopy } from "@/lib/jouw-tafel/table-copy";
import { maxSeats, singleTotalCents } from "@/lib/jouw-tafel/table-logic";
import { openFrom } from "@/lib/membership/early-label";
import { getMembershipKiesCopy, getMembershipReserveCopy } from "@/lib/membership/page-copy";
import {
  DEFAULT_MEMBERSHIP_PLAN,
  MEMBERSHIP_PLANS,
  MEMBERSHIP_PLAN_IDS,
  guestSeatCents,
  planSavingsCents,
  type MembershipPlanId,
} from "@/lib/membership/plans";
import { trackTableEvent } from "@/lib/posthog/analytics";
import { PostHogEvents } from "@/lib/posthog/events";

const EASE = [0.22, 1, 0.36, 1] as const;

function ArrowRight({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function RadioDot({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
        on ? "border-burgundy bg-burgundy" : "border-wine/20 bg-white"
      }`}
    >
      <span className={`h-2.5 w-2.5 rounded-full bg-cream transition-transform duration-200 ${on ? "scale-100" : "scale-0"}`} />
    </span>
  );
}

/**
 * The membership plan picker on Reserveren (non-members): what you get,
 * three plans (4 months preselected), an optional guest, one clear button,
 * and below "of" the single seat, which opens inline.
 */
export function ReservePaywall({
  locale,
  event,
  early,
  proofCount,
  busy,
  error,
  onJoin,
  onSingle,
}: {
  locale: Locale;
  event: QuizEvent;
  /** The members' 48 hours: only joining is possible. */
  early: boolean;
  /** Distinct sign-ups, only when SIGNUP_COUNT_MIN or more. */
  proofCount: number | null;
  busy: "join" | "single" | null;
  error: { on: "join" | "single"; message: string } | null;
  onJoin: (plan: MembershipPlanId, seats: 1 | 2) => void;
  onSingle: (seats: 1 | 2) => void;
}) {
  const r = getMembershipReserveCopy(locale);
  const t = getTableCopy(locale);
  const mk = getMembershipKiesCopy(locale);
  const reduceMotion = useReducedMotion();
  const [plan, setPlan] = useState<MembershipPlanId>(DEFAULT_MEMBERSHIP_PLAN);
  const [guestOn, setGuestOn] = useState(false);
  const [singleOpen, setSingleOpen] = useState(false);
  const [singleSeats, setSingleSeats] = useState<1 | 2>(1);
  const planRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const guestPossible = maxSeats(event) >= 2;
  const seats: 1 | 2 = guestOn && guestPossible ? 2 : 1;
  const city = displayCity(event.city, locale);
  const date = tableDate(event.startsAt, locale);
  const time = tableTime(event.startsAt, locale);

  function choosePlan(id: MembershipPlanId) {
    if (id === plan) return;
    setPlan(id);
    trackTableEvent(PostHogEvents.reserveOptionSelected, { event_slug: event.slug, option: "member", plan: id });
  }

  // Arrow keys move through the plans, like native radio buttons.
  function onPlanKey(e: KeyboardEvent<HTMLDivElement>) {
    const keys = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const step = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1;
    const i = MEMBERSHIP_PLAN_IDS.indexOf(plan);
    const next = MEMBERSHIP_PLAN_IDS[(i + step + MEMBERSHIP_PLAN_IDS.length) % MEMBERSHIP_PLAN_IDS.length]!;
    choosePlan(next);
    planRefs.current[MEMBERSHIP_PLAN_IDS.indexOf(next)]?.focus();
  }

  function toggleGuest() {
    if (!guestPossible) return;
    const next = !guestOn;
    setGuestOn(next);
    trackTableEvent(PostHogEvents.reserveGuestToggled, { event_slug: event.slug, on: next, plan });
  }

  function toggleSingle() {
    if (early) return;
    const next = !singleOpen;
    setSingleOpen(next);
    if (next) trackTableEvent(PostHogEvents.reserveOptionSelected, { event_slug: event.slug, option: "single", plan: null });
  }

  return (
    <div>
      {/* The table */}
      <div className="flex items-center gap-3 rounded-2xl border border-wine/[0.08] bg-white/80 px-4 py-2.5">
        <span aria-hidden className="h-8 w-1 rounded-full bg-burgundy/80" />
        <div className="min-w-0">
          <p className="font-serif text-[1.05rem] font-medium leading-tight text-wine">{t.title}</p>
          <p className="mt-0.5 truncate text-[0.88rem] text-wine/65">{t.dateLine(date, time, city)}</p>
        </div>
      </div>

      {proofCount !== null ? (
        <p className="mt-3 text-center text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-gold">{r.proof(proofCount)}</p>
      ) : null}

      {/* Plans */}
      <h2 className="mt-6 font-serif text-[1.45rem] font-medium leading-tight tracking-tight text-wine">{r.chooseTitle}</h2>
      <div role="radiogroup" aria-label={r.chooseTitle} onKeyDown={onPlanKey} className="mt-3 space-y-2">
        {MEMBERSHIP_PLAN_IDS.map((id, i) => {
          const p = MEMBERSHIP_PLANS[id];
          const on = plan === id;
          const savings = planSavingsCents(id, JOUW_TAFEL_SEAT_PRICE_CENTS);
          return (
            <motion.button
              key={id}
              ref={(el) => {
                planRefs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              onClick={() => choosePlan(id)}
              whileTap={reduceMotion ? undefined : { scale: 0.985 }}
              className={`relative flex w-full items-center gap-4 rounded-2xl border-2 px-4 py-2.5 text-left transition-[border-color,background-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-burgundy/20 ${
                on
                  ? "border-burgundy bg-[#fcf3f1] shadow-[0_10px_28px_rgba(90,15,27,0.12)]"
                  : "border-wine/[0.09] bg-white shadow-[0_1px_2px_rgba(43,13,18,0.04)] hover:border-wine/20"
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className={`text-[0.75rem] font-bold uppercase tracking-[0.16em] ${on ? "text-burgundy" : "text-wine/60"}`}>
                    {r.planLabel(id)}
                  </span>
                  {savings > 0 ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[0.72rem] font-semibold text-emerald-700 ring-1 ring-emerald-600/15">
                      {r.save(euros(savings))}
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
                  <span className="font-serif text-[1.5rem] font-medium leading-none tracking-tight text-wine [font-variant-numeric:lining-nums_tabular-nums]">{euros(p.monthlyCents)}</span>
                  <span className="text-[0.85rem] text-wine/60">{r.perMonth}</span>
                  {/* Total on the same line, to keep the rows short. */}
                  {p.initialMonths > 1 ? (
                    <span className="text-[0.8rem] text-wine/45">· {r.total(euros(p.initialCents))}</span>
                  ) : null}
                </span>
              </span>
              <RadioDot on={on} />
            </motion.button>
          );
        })}
      </div>

      <p className="mt-2 text-[0.72rem] leading-snug text-wine/45">{r.saveNote(euros(JOUW_TAFEL_SEAT_PRICE_CENTS))}</p>

      {/* Guest */}
      <button
        type="button"
        role="switch"
        aria-checked={seats === 2}
        disabled={!guestPossible}
        onClick={toggleGuest}
        className="mt-3 flex min-h-12 w-full items-center gap-3 rounded-2xl bg-white/70 px-4 py-2 text-left ring-1 ring-wine/[0.08] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/40 disabled:cursor-not-allowed"
      >
        <span className="min-w-0 flex-1">
          <span className={`block text-[0.95rem] font-semibold ${guestPossible ? "text-wine" : "text-wine/45"}`}>{r.guestQuestion}</span>
          {guestPossible ? (
            <span className="mt-0.5 block text-[0.82rem] font-semibold tabular-nums text-burgundy">{r.guestPrice(euros(guestSeatCents(plan)))}</span>
          ) : (
            <span className="mt-0.5 block text-[0.8rem] text-wine/50">{r.guestOneLeft}</span>
          )}
        </span>
        <span
          aria-hidden
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
            seats === 2 ? "bg-burgundy" : "bg-wine/15"
          } ${guestPossible ? "" : "opacity-50"}`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-[0_1px_3px_rgba(43,13,18,0.25)] transition-transform duration-200 ${
              seats === 2 ? "translate-x-[1.375rem]" : "translate-x-0.5"
            }`}
          />
        </span>
      </button>

      {/* Join */}
      <motion.button
        type="button"
        onClick={() => onJoin(plan, seats)}
        disabled={busy !== null}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
        className={`${primaryButton} mt-4 gap-2`}
      >
        {busy === "join" ? r.busy : r.cta(plan)}
        {busy === "join" ? null : <ArrowRight />}
      </motion.button>
      {error?.on === "join" ? (
        <p role="alert" className="mt-2 text-center text-sm font-semibold text-red-600">
          {error.message}
        </p>
      ) : null}
      <p className="mx-auto mt-2 max-w-[22rem] text-center text-[0.75rem] leading-snug text-wine/55">{r.ctaNote}</p>

      {/* Or */}
      <div className="my-5 flex items-center gap-4" aria-hidden>
        <span className="h-px flex-1 bg-wine/10" />
        <span className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-wine/40">{r.or}</span>
        <span className="h-px flex-1 bg-wine/10" />
      </div>

      {/* Single seat */}
      <div className={`overflow-hidden rounded-2xl border-2 transition-colors duration-200 ${singleOpen ? "border-wine/25 bg-white" : "border-wine/[0.12] bg-transparent"}`}>
        <button
          type="button"
          aria-expanded={singleOpen}
          aria-controls="losse-plek"
          disabled={early}
          onClick={toggleSingle}
          className="flex w-full items-center gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-burgundy/20 disabled:cursor-not-allowed"
        >
          <span className="min-w-0 flex-1">
            <span className={`block text-[1rem] font-semibold ${early ? "text-wine/50" : "text-wine"}`}>
              {r.singleTitle(euros(JOUW_TAFEL_SEAT_PRICE_CENTS))}
            </span>
            <span className="mt-0.5 block text-[0.85rem] text-wine/55">
              {early && event.membersOnlyUntil ? mk.earlyLabel(openFrom(event.membersOnlyUntil, locale)) : r.singleLine(date, time)}
            </span>
          </span>
          {early ? null : (
            <motion.svg
              viewBox="0 0 24 24"
              aria-hidden
              animate={{ rotate: singleOpen ? 180 : 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.25, ease: EASE }}
              className="h-5 w-5 shrink-0 text-wine/40"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </motion.svg>
          )}
        </button>
        <AnimatePresence initial={false}>
          {singleOpen ? (
            <motion.div
              id="losse-plek"
              key="single"
              initial={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
              animate={reduceMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <div className="border-t border-wine/[0.08] px-5 pb-5">
                <div className="-mt-2">
                  <SeatPicker locale={locale} event={event} seats={singleSeats} onChange={setSingleSeats} />
                </div>
                <div className="mt-5 space-y-2">
                  <PriceRow label={t.reserve.seatOption(singleSeats)} amount={t.reserve.perSeat(euros(JOUW_TAFEL_SEAT_PRICE_CENTS))} />
                  <PriceRow label={t.reserve.total} amount={euros(singleTotalCents(singleSeats))} strong />
                </div>
                <Guarantees locale={locale} />
                <button
                  type="button"
                  onClick={() => onSingle(singleSeats)}
                  disabled={busy !== null}
                  className="mt-5 flex min-h-[3.25rem] w-full items-center justify-center rounded-full border-2 border-burgundy bg-white px-6 text-[0.95rem] font-semibold text-burgundy transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-burgundy/20 disabled:opacity-60"
                >
                  {busy === "single" ? r.busy : r.pay}
                </button>
                {error?.on === "single" ? (
                  <p role="alert" className="mt-2 text-center text-sm font-semibold text-red-600">
                    {error.message}
                  </p>
                ) : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <p className="mt-5 text-center text-[0.75rem] leading-relaxed text-wine/50">{r.footnote}</p>
    </div>
  );
}
