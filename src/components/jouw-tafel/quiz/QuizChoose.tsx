"use client";

import * as Sentry from "@sentry/nextjs";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { CheckIcon, InfoIcon, PinIcon } from "@/components/jouw-tafel/icons";
import { BottomSheet } from "@/components/jouw-tafel/quiz/BottomSheet";
import { getMetaBrowserCookies, getMetaEventSourceUrl } from "@/lib/analytics/metaCookies";
import { getStoredUtm } from "@/lib/analytics/utm";
import { formatSpotsLeftHint } from "@/lib/event-display";
import { shouldShowSpotsCount } from "@/lib/experience-booking";
import { formatEuros } from "@/lib/jouw-tafel/copy";
import { displayCity, sameCity, spotsLeft, type QuizEvent } from "@/lib/jouw-tafel/logic";
import type { QuizCopy } from "@/lib/jouw-tafel/quiz-copy";
import {
  ageFromBirthDate,
  answerCities,
  checkoutTableLanguage,
  chooseTablesForAnswers,
  splitCities,
  defaultSeats,
  dietaryNotes,
  infoPrice,
  kiesCities,
  type ChooseRow,
  type QuizAnswers,
} from "@/lib/jouw-tafel/quiz-logic";
import { primaryButton, questionSub, questionTitle, secondaryButton } from "@/components/jouw-tafel/quiz/quiz-ui";
import Link from "next/link";
import {
  fromClientMembership,
  isMembersOnly,
  memberBookingDecision,
  type ClientMembership,
  type MemberBookingDecision,
} from "@/lib/membership/logic";
import {
  DEFAULT_MEMBERSHIP_PLAN,
  MEMBERSHIP_PLAN_IDS,
  formatPlanEuros,
  guestSeatCents,
  lowestMonthlyCents,
  type MembershipPlanId,
} from "@/lib/membership/plans";
import { getMembershipKiesCopy, getMembershipPageCopy } from "@/lib/membership/page-copy";
import { trackMembershipEvent } from "@/lib/posthog/analytics";
import { PostHogEvents } from "@/lib/posthog/events";

const AMSTERDAM = "Europe/Amsterdam";

/** "Zo 25 okt" / "Sun 25 Oct". */
function shortDate(iso: string, locale: Locale): string {
  const tag = locale === "en" ? "en-GB" : "nl-NL";
  const parts = new Intl.DateTimeFormat(tag, {
    timeZone: AMSTERDAM,
    weekday: "short",
    day: "numeric",
    month: "short",
  })
    .formatToParts(new Date(iso))
    .filter((p) => p.type === "weekday" || p.type === "day" || p.type === "month")
    .map((p) => p.value.replace(/\.$/, ""));
  const text = parts.join(" ");
  return text.charAt(0).toLocaleUpperCase(tag) + text.slice(1);
}

/** "14:00" / "2:00 PM". */
function startTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "nl-NL", {
    timeZone: AMSTERDAM,
    hour: locale === "en" ? "numeric" : "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** "Do 8 okt 14:00" / "Thu 8 Oct 2:00 PM": when a table opens for everyone. */
function openFrom(iso: string, locale: Locale): string {
  const date = shortDate(iso, locale);
  // Mid-sentence in Dutch: "jij vanaf ma 5 okt 17:05".
  return `${locale === "nl" ? date.charAt(0).toLocaleLowerCase("nl-NL") + date.slice(1) : date} ${startTime(iso, locale)}`;
}

/** "ZO" / "25" / "okt" for the date badge. */
function dateParts(iso: string, locale: Locale): { weekday: string; day: string; month: string } {
  const tag = locale === "en" ? "en-GB" : "nl-NL";
  const parts = new Intl.DateTimeFormat(tag, { timeZone: AMSTERDAM, weekday: "short", day: "numeric", month: "short" })
    .formatToParts(new Date(iso))
    .reduce<Record<string, string>>((acc, p) => ({ ...acc, [p.type]: p.value.replace(/\.$/, "") }), {});
  return { weekday: parts.weekday ?? "", day: parts.day ?? "", month: parts.month ?? "" };
}

type ChipTone = "wine" | "gold" | "grey";

const CHIP_TONE: Record<ChipTone, string> = {
  wine: "bg-burgundy/[0.09] text-burgundy",
  gold: "bg-gold/[0.16] text-[#7d5c2c]",
  grey: "bg-wine/[0.06] text-wine/55",
};

/** "Nog maar 3 plekken" (wine), "Plekken vrij" (gold), "Binnenkort" (grey). */
function spotsChip(event: QuizEvent, locale: Locale, copy: QuizCopy["kies"]): { text: string; tone: ChipTone } {
  if (event.comingSoon) return { text: copy.soonBadge, tone: "grey" };
  const left = spotsLeft(event);
  return shouldShowSpotsCount(left, event.spotsSold)
    ? { text: formatSpotsLeftHint(left, locale), tone: "wine" }
    : { text: copy.spotsOpen, tone: "gold" };
}

export type ChooseHandlers = {
  onViewed: (props: { tables_shown: number; has_match: boolean }) => void;
  onReserve: (props: { event_slug: string; seats: number; nearby: boolean }) => void;
  onNotify: (event: QuizEvent | null) => void;
  onShare: () => void;
  /** "Wat is een Sunday Table?" opened. */
  onInfo: () => void;
};

/**
 * "Kies je zondag": the live list for this person (their city and age
 * group first, then nearby, then coming soon), seats 1 or 2, and
 * "Reserveer" straight into Stripe Checkout. Never a venue.
 */
export function QuizChoose({
  locale,
  copy,
  answers,
  events,
  now,
  email,
  notified,
  handlers,
  membership = null,
  settingsHref,
}: {
  locale: Locale;
  copy: QuizCopy;
  answers: QuizAnswers;
  events: QuizEvent[];
  now: number;
  email: string;
  /** Event ids (and "city" for the city as a whole) they asked to hear about. */
  notified: Set<string>;
  handlers: ChooseHandlers;
  /** Their running membership, null when not a member. */
  membership?: ClientMembership | null;
  settingsHref: string;
}) {
  const k = copy.kies;
  const mk = getMembershipKiesCopy(locale);
  const planCopy = getMembershipPageCopy(locale).plans;
  const snapshot = useMemo(() => fromClientMembership(membership), [membership]);
  /** How this person books a given table (member, blocked, or not). */
  const decisionFor = (event: QuizEvent): MemberBookingDecision =>
    memberBookingDecision(snapshot, new Date(event.startsAt), now);
  /** Members-only right now, and this person cannot book it yet. */
  const earlyBlocked = (event: QuizEvent): boolean =>
    isMembersOnly(event.membersOnlyUntil ?? null, now) && decisionFor(event).kind !== "included";
  const reduceMotion = useReducedMotion();
  const cities = answerCities(answers);
  // Towns outside our cities are a waitlist; headings and the no-match line
  // follow our cities (the first one picked).
  const { ours, others } = splitCities(cities);
  const onlyOthers = ours.length === 0 && others.length > 0;
  const shownCity = displayCity(ours[0] ?? cities[0] ?? "", locale);
  const age = answers.birthDate ? ageFromBirthDate(answers.birthDate, now) : null;
  const { rows, hasMatch, ourCities } = useMemo(
    () =>
      age === null
        ? { rows: [] as ChooseRow[], hasMatch: false, ourCities: false }
        : chooseTablesForAnswers(events, { cities: answerCities(answers), age, ageMatters: answers.ageMatters }, now),
    [events, answers, age, now],
  );
  // Name only chosen cities that have tables here; ours without one get a
  // line under the list.
  const { named, noSunday } = kiesCities(cities, rows);
  const shownCities = copy.joinCities((named.length ? named : ours).map((c) => displayCity(c, locale)));
  const price = infoPrice(rows);
  const [infoOpen, setInfoOpen] = useState(false);
  const infoTrigger = useRef<HTMLButtonElement>(null);
  const openRows = rows.filter((r) => r.kind === "open");
  const ownOpen = openRows.filter((r) => !r.nearby);
  // One "In {stad}" section per chosen city with open tables, in their order.
  const citySections = cities
    .map((city) => ({ city, rows: ownOpen.filter((r) => sameCity(r.event.city, city)) }))
    .filter((s) => s.rows.length > 0);
  const nearbyOpen = openRows.filter((r) => r.nearby);
  const soonRows = rows.filter((r) => r.kind === "soon");
  const unsure = answers.ready === "unsure";

  const [selectedId, setSelectedId] = useState<string | null>(openRows[0]?.event.id ?? null);
  const selected = openRows.find((r) => r.event.id === selectedId) ?? null;
  const [seats, setSeats] = useState<1 | 2>(defaultSeats(answers));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [choice, setChoice] = useState<"single" | "member">("single");
  const [plan, setPlan] = useState<MembershipPlanId>(DEFAULT_MEMBERSHIP_PLAN);
  const [booked, setBooked] = useState<string | null>(null);

  const maxSeats = selected ? Math.min(2, spotsLeft(selected.event)) : 2;
  const effectiveSeats: 1 | 2 = maxSeats < 2 ? 1 : seats;

  const viewedRef = useRef(false);
  useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    handlers.onViewed({ tables_shown: rows.length, has_match: hasMatch });
  }, [handlers, rows.length, hasMatch]);

  // early_access_blocked_view: once per table shown as "Leden boeken nu".
  const earlySeen = useRef(new Set<string>());
  useEffect(() => {
    for (const row of openRows) {
      if (!earlyBlocked(row.event) || earlySeen.current.has(row.event.id)) continue;
      earlySeen.current.add(row.event.id);
      trackMembershipEvent(PostHogEvents.earlyAccessBlockedView, { event_slug: row.event.slug, member: Boolean(membership) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRows.length, membership]);

  const selectedDecision: MemberBookingDecision = selected ? decisionFor(selected.event) : { kind: "non_member" };
  const selectedEarly = selected ? earlyBlocked(selected.event) : false;
  const isMemberSeat = selectedDecision.kind === "included";
  // During the members' 48 hours only "Word lid" is possible for others.
  const effectiveChoice: "single" | "member" = selectedEarly ? "member" : choice;

  async function becomeMember() {
    if (!selected || loading) return;
    const event = selected.event;
    trackMembershipEvent(PostHogEvents.membershipCheckoutStarted, { plan, source: "kies", seats: effectiveSeats });
    setLoading(true);
    setError(null);
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
            seats: effectiveSeats,
            name: answers.name ?? "",
            dietaryNotes: dietaryNotes(answers) || undefined,
            tableLanguagePreference: checkoutTableLanguage(answers.language),
          },
          meta: { ...getMetaBrowserCookies(), eventSourceUrl: getMetaEventSourceUrl() },
        }),
      });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !data?.url) {
        setError(data?.error ?? k.checkoutError);
        setLoading(false);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError(k.checkoutError);
      setLoading(false);
    }
  }

  async function reserve() {
    if (!selected || loading) return;
    if (!isMemberSeat && effectiveChoice === "member") return becomeMember();
    const event = selected.event;
    handlers.onReserve({ event_slug: event.slug, seats: effectiveSeats, nearby: selected.nearby });
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          email,
          name: answers.name ?? "",
          seats: effectiveSeats,
          locale,
          // Everyone can book any table; the language preference goes along
          // and tables are matched by hand afterwards.
          tableLanguagePreference: checkoutTableLanguage(answers.language),
          dietaryNotes: dietaryNotes(answers) || undefined,
          utm: getStoredUtm(),
          meta: { ...getMetaBrowserCookies(), eventSourceUrl: getMetaEventSourceUrl() },
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { url?: string; error?: string; booked?: boolean; code?: string }
        | null;
      if (res.ok && data?.booked) {
        // A member's own seat: booked straight away, no payment.
        setBooked(data.code ?? "");
        setLoading(false);
        return;
      }
      if (!res.ok || !data?.url) {
        setError(data?.error ?? k.checkoutError);
        Sentry.withScope((scope) => {
          scope.setTag("flow", "jouw_tafel_quiz_checkout");
          scope.setExtras({ status: res.status, error: data?.error });
          Sentry.captureMessage("Quiz checkout failed", "warning");
        });
        setLoading(false);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError(k.checkoutError);
      setLoading(false);
    }
  }

  function notifyButton(event: QuizEvent | null, compact = false) {
    const key = event ? event.id : "city";
    const done = notified.has(key);
    return (
      <button
        type="button"
        onClick={() => !done && handlers.onNotify(event)}
        aria-pressed={done}
        className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full text-sm font-semibold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/50 ${
          compact
            ? "px-0 text-burgundy underline decoration-burgundy/30 underline-offset-4"
            : "border border-wine/12 bg-white px-3.5 text-[0.82rem] text-wine shadow-[0_1px_4px_rgba(43,13,18,0.05)]"
        } ${done ? "no-underline text-wine/55" : ""}`}
      >
        {done ? <CheckIcon className="h-4 w-4" /> : null}
        {k.notify}
      </button>
    );
  }

  function openRow(row: ChooseRow, index: number) {
    const event = row.event;
    const isSelected = selectedId === event.id;
    const early = earlyBlocked(event);
    const chip = early
      ? { text: mk.earlyLabel(openFrom(event.membersOnlyUntil!, locale)), tone: "gold" as ChipTone }
      : spotsChip(event, locale, k);
    const included = decisionFor(event).kind === "included";
    return (
      <motion.li
        key={event.id}
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: reduceMotion ? 0 : 0.06 + index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={`${rowCard} ${isSelected ? rowSelected : rowIdle}`}>
          <motion.button
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`${k.selectAria}: ${shortDate(event.startsAt, locale)}`}
            onClick={() => {
              setSelectedId(event.id);
              setError(null);
              setBooked(null);
            }}
            whileTap={reduceMotion ? undefined : { scale: 0.985 }}
            className="flex w-full touch-manipulation items-center gap-3.5 rounded-2xl p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/50"
          >
            <DateBadge iso={event.startsAt} locale={locale} selected={isSelected} />
            <span className="min-w-0 flex-1">
              <span className="block text-[1rem] font-semibold leading-tight text-wine">{k.tableName}</span>
              <span className="mt-0.5 block text-[0.9rem] leading-tight text-wine/70">{startTime(event.startsAt, locale)}</span>
              <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className={`rounded-full px-2.5 py-1 text-[0.75rem] font-semibold leading-none ${CHIP_TONE[chip.tone]}`}>
                  {chip.text}
                </span>
                {row.nearby ? (
                  <span className="inline-flex items-center gap-1 text-[0.8rem] text-wine/55">
                    <PinIcon className="h-3.5 w-3.5" />
                    {displayCity(event.city, locale)}
                  </span>
                ) : null}
              </span>
            </span>
            <span className="shrink-0 whitespace-nowrap text-right text-[0.8rem] font-medium leading-tight text-wine/55">
              {included ? mk.includedShort : k.perSeat(formatEuros(event.priceCents))}
            </span>
          </motion.button>
          {unsure ? <div className="-mt-1 px-4 pb-2 pl-[5.3rem]">{notifyButton(event, true)}</div> : null}
        </div>
      </motion.li>
    );
  }

  function soonRow(row: ChooseRow) {
    const event = row.event;
    return (
      <li key={event.id} className={`${rowCard} ${rowIdle} flex items-start gap-3.5 p-3`}>
        <DateBadge iso={event.startsAt} locale={locale} selected={false} muted />
        <span className="min-w-0 flex-1">
          <span className="block text-[1rem] font-semibold leading-tight text-wine/80">{k.tableName}</span>
          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full px-2.5 py-1 text-[0.75rem] font-semibold leading-none ${CHIP_TONE.grey}`}>
              {k.soonBadge}
            </span>
            {/* "Binnenkort" mixes cities, so the city always shows here. */}
            <span className="inline-flex items-center gap-1 text-[0.8rem] text-wine/55">
              <PinIcon className="h-3.5 w-3.5" />
              {displayCity(event.city, locale)}
            </span>
          </span>
          <span className="mt-2 block">{notifyButton(event)}</span>
        </span>
      </li>
    );
  }

  function sectionTitle(text: string) {
    return (
      <h2 className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
        <span className="shrink-0">{text}</span>
        <span aria-hidden className="h-px flex-1 bg-gold/30" />
      </h2>
    );
  }

  return (
    <div className={selected ? (isMemberSeat ? "pb-80" : "pb-[30rem]") : "pb-16"}>
      <div className="pt-6">
        <h1 tabIndex={-1} className={questionTitle}>
          {k.title}
        </h1>
        {onlyOthers ? (
          <p className="mt-6 flex items-start gap-3 rounded-2xl border border-wine/[0.08] bg-white px-4 py-3.5 text-[0.95rem] leading-snug text-wine/80 shadow-[0_1px_2px_rgba(43,13,18,0.04),0_6px_18px_rgba(43,13,18,0.04)]">
            <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
              <PinIcon className="h-4 w-4" />
            </span>
            {copy.stopStad.otherLine(copy.joinCities(others.map((c) => displayCity(c, locale))))}
          </p>
        ) : hasMatch ? (
          <p className={questionSub}>{k.sub(shownCities)}</p>
        ) : (
          <p className="mx-auto mt-3 max-w-[21rem] text-center text-[1rem] leading-relaxed text-wine/75 text-balance">
            {k.noMatch(shownCity)}
          </p>
        )}
        <div className="mt-3 flex justify-center">
          <button
            ref={infoTrigger}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={infoOpen}
            onClick={() => {
              setInfoOpen(true);
              handlers.onInfo();
            }}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-[0.92rem] font-semibold text-burgundy underline decoration-burgundy/30 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/50"
          >
            <InfoIcon className="h-4 w-4" />
            {k.infoLink}
          </button>
        </div>
      </div>

      {citySections.map((section) => {
        const offset = ownOpen.indexOf(section.rows[0]!);
        return (
          <section key={section.city} className="mt-8">
            {sectionTitle(k.inCity(displayCity(section.city, locale)))}
            <ul role="radiogroup" className="mt-3.5 space-y-3">
              {section.rows.map((row, i) => openRow(row, offset + i))}
            </ul>
          </section>
        );
      })}

      {nearbyOpen.length > 0 ? (
        <section className="mt-8">
          {sectionTitle(ourCities ? k.ourCities : k.nearby)}
          <ul role="radiogroup" className="mt-3.5 space-y-3">
            {nearbyOpen.map((row, i) => openRow(row, ownOpen.length + i))}
          </ul>
        </section>
      ) : null}

      {soonRows.length > 0 ? (
        <section className="mt-8">
          {sectionTitle(k.comingSoon)}
          <ul className="mt-3.5 space-y-3">{soonRows.map(soonRow)}</ul>
        </section>
      ) : null}

      {hasMatch && noSunday.length > 0 ? (
        <p className="mt-6 text-center text-[0.92rem] leading-relaxed text-wine/70 text-balance">
          {k.noSunday(copy.joinCities(noSunday.map((c) => displayCity(c, locale))), noSunday.length)}
        </p>
      ) : null}

      {hasMatch ? null : (
        <div className="mt-8 space-y-3">
          <button type="button" className={secondaryButton} onClick={handlers.onShare}>
            {k.share}
          </button>
        </div>
      )}

      {infoOpen ? (
        <InfoSheet
          title={k.infoLink}
          closeLabel={k.infoClose}
          lines={[
            ...k.infoLines,
            ...(price ? [k.infoPrice(`€${formatEuros(price.cents)}`, price.from)] : []),
            k.infoLast,
          ]}
          onClose={() => setInfoOpen(false)}
        />
      ) : null}

      {selected ? (
        <div className="fixed inset-x-0 bottom-0 z-20">
          <motion.div
            initial={reduceMotion ? false : { y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-h-[82svh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-[1.75rem] border border-b-0 border-wine/[0.08] bg-white/90 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-12px_40px_rgba(43,13,18,0.12)] backdrop-blur-xl"
          >
            <div aria-hidden className="mx-auto mb-3.5 h-1 w-10 rounded-full bg-wine/15" />
            {booked !== null ? (
              <div role="status" className="py-2 text-center">
                <span aria-hidden className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-burgundy text-cream">
                  <CheckIcon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-[1rem] font-semibold leading-snug text-wine">{mk.booked}</p>
                {booked ? <p className="mt-1 text-sm tracking-[0.06em] text-wine/55">{booked}</p> : null}
                <Link href={settingsHref} className={`${secondaryButton} mt-4`}>
                  {mk.bookedLink}
                </Link>
              </div>
            ) : selectedDecision.kind === "blocked" || selectedDecision.kind === "past_due" ? (
              <div className="py-1 text-center">
                <p className="text-[0.98rem] leading-snug text-wine/80">
                  {selectedDecision.kind === "blocked"
                    ? mk.blocked(openFrom(selectedDecision.until.toISOString(), locale))
                    : mk.pastDue}
                </p>
                <Link href={settingsHref} className={`${secondaryButton} mt-4`}>
                  {mk.settingsLink}
                </Link>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div role="radiogroup" aria-label={k.seats} className="flex rounded-full bg-cream p-1">
                    {([1, 2] as const).map((n) => {
                      const active = effectiveSeats === n;
                      const disabled = n > maxSeats;
                      return (
                        <button
                          key={n}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          disabled={disabled}
                          onClick={() => {
                            setSeats(n);
                            setError(null);
                          }}
                          className={`min-h-10 rounded-full px-4 text-sm font-semibold transition-[background-color,color,box-shadow] duration-200 disabled:opacity-35 ${
                            active ? "bg-white text-burgundy shadow-[0_2px_8px_rgba(43,13,18,0.12)]" : "text-wine/60"
                          }`}
                        >
                          {k.seatOption(n)}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-right text-[1.05rem] font-bold tracking-tight text-wine">
                    {isMemberSeat && snapshot
                      ? effectiveSeats === 1
                        ? mk.includedShort
                        : k.total(formatPlanEuros(guestSeatCents(snapshot.plan), locale))
                      : effectiveChoice === "single"
                        ? k.total(formatEuros(selected.event.priceCents * effectiveSeats))
                        : null}
                  </p>
                </div>
                {maxSeats < 2 ? <p className="mt-2 text-xs text-wine/60">{k.onlyOneLeft}</p> : null}

                {isMemberSeat && snapshot ? (
                  <MemberLines
                    included={mk.included}
                    guest={
                      effectiveSeats === 2
                        ? {
                            label: mk.guest,
                            was: `€${formatEuros(selected.event.priceCents)}`,
                            now: `€${formatPlanEuros(guestSeatCents(snapshot.plan), locale)}`,
                            tag: mk.memberPrice,
                          }
                        : null
                    }
                  />
                ) : (
                  <div role="radiogroup" aria-label={mk.planPickerLabel} className="mt-3 space-y-2">
                    <ChoiceCard
                      selected={effectiveChoice === "single"}
                      disabled={selectedEarly}
                      title={mk.singleTitle}
                      sub={selectedEarly ? mk.earlyLabel(openFrom(selected.event.membersOnlyUntil!, locale)) : null}
                      right={`€${formatEuros(selected.event.priceCents)}`}
                      onSelect={() => {
                        setChoice("single");
                        setError(null);
                      }}
                    />
                    <ChoiceCard
                      selected={effectiveChoice === "member"}
                      title={mk.memberTitle}
                      sub={null}
                      right={mk.memberFrom(`€${formatPlanEuros(lowestMonthlyCents(), locale)}`)}
                      onSelect={() => {
                        setChoice("member");
                        setError(null);
                        trackMembershipEvent(PostHogEvents.membershipPlanSelected, { plan, source: "kies" });
                      }}
                    />
                    {effectiveChoice === "member" ? (
                      <div className="rounded-2xl bg-cream/80 px-3 py-2.5">
                        <div role="radiogroup" aria-label={mk.planPickerLabel} className="grid grid-cols-3 gap-1 rounded-full bg-white p-1">
                          {MEMBERSHIP_PLAN_IDS.map((id) => (
                            <button
                              key={id}
                              type="button"
                              role="radio"
                              aria-checked={plan === id}
                              onClick={() => {
                                setPlan(id);
                                setError(null);
                                trackMembershipEvent(PostHogEvents.membershipPlanSelected, { plan: id, source: "kies" });
                              }}
                              className={`min-h-9 rounded-full px-2 text-[0.8rem] font-semibold transition-[background-color,color] duration-200 ${
                                plan === id ? "bg-burgundy text-cream" : "text-wine/65"
                              }`}
                            >
                              {mk.planShort(id)}
                            </button>
                          ))}
                        </div>
                        <p className="mt-2.5 px-1 text-[0.82rem] leading-snug text-wine/70">{planCopy.plan(plan).line}.</p>
                        <MemberLines
                          included={mk.memberSummary}
                          guest={
                            effectiveSeats === 2
                              ? {
                                  label: mk.guest,
                                  was: `€${formatEuros(selected.event.priceCents)}`,
                                  now: `€${formatPlanEuros(guestSeatCents(plan), locale)}`,
                                  tag: mk.memberPrice,
                                }
                              : null
                          }
                        />
                      </div>
                    ) : null}
                  </div>
                )}

                <button
                  type="button"
                  className={`${primaryButton} mt-3.5`}
                  onClick={() => void reserve()}
                  disabled={loading}
                >
                  {loading
                    ? effectiveChoice === "member" && !isMemberSeat
                      ? mk.becomeMemberBusy
                      : k.reserving
                    : isMemberSeat
                      ? effectiveSeats === 1
                        ? mk.bookIncluded
                        : k.reserve
                      : effectiveChoice === "member"
                        ? mk.becomeMember
                        : k.reserve}
                </button>
                {error ? (
                  <p role="alert" className="mt-2 text-center text-sm font-semibold text-red-600">
                    {error}
                  </p>
                ) : null}
                {selectedEarly ? <div className="mt-2 flex justify-center">{notifyButton(selected.event, true)}</div> : null}
                {!isMemberSeat && effectiveChoice === "single" ? (
                  <ul className="mx-auto mt-3 w-fit space-y-1 text-[0.8rem] leading-snug text-wine/60">
                    {k.guarantees.map((line) => (
                      <li key={line} className="flex items-center gap-1.5">
                        <CheckIcon className="h-3.5 w-3.5 shrink-0 text-gold" />
                        {line}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            )}
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}

const rowCard = "rounded-2xl border transition-[border-color,background-color,box-shadow] duration-200";
const rowIdle = "border-wine/[0.08] bg-white shadow-[0_1px_2px_rgba(43,13,18,0.04),0_6px_18px_rgba(43,13,18,0.04)]";
const rowSelected = "border-burgundy bg-[#fcf4f2] shadow-[inset_0_0_0_1px_var(--burgundy),0_8px_22px_rgba(90,15,27,0.10)]";

/** Weekday, big day number, month: "ZO / 25 / okt". */
function DateBadge({ iso, locale, selected, muted = false }: { iso: string; locale: Locale; selected: boolean; muted?: boolean }) {
  const { weekday, day, month } = dateParts(iso, locale);
  return (
    <span
      aria-hidden
      className={`relative flex h-[4.1rem] w-[3.6rem] shrink-0 flex-col items-center justify-center rounded-xl transition-colors duration-200 ${
        muted ? "bg-wine/[0.04] text-wine/50" : selected ? "bg-burgundy text-cream" : "bg-[#f5ebe6] text-burgundy"
      }`}
    >
      <span className="text-[0.62rem] font-bold uppercase leading-none tracking-[0.14em] opacity-80">{weekday}</span>
      <span className="mt-1 text-[1.45rem] font-bold leading-none tabular-nums tracking-tight">{day}</span>
      <span className="mt-0.5 text-[0.68rem] font-medium leading-none opacity-80">{month}</span>
    </span>
  );
}

/** "Wat is een Sunday Table?" in the shared bottom sheet. */
function InfoSheet({
  title,
  closeLabel,
  lines,
  onClose,
}: {
  title: string;
  closeLabel: string;
  lines: string[];
  onClose: () => void;
}) {
  return (
    <BottomSheet labelledBy="jt-quiz-info-title" title={title} closeLabel={closeLabel} onClose={onClose}>
      <ul className="mt-4 space-y-3">
        {lines.map((line) => (
          <li key={line} className="flex gap-3 text-[1rem] leading-relaxed text-wine/80">
            <span aria-hidden className="mt-[0.6rem] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
            {line}
          </li>
        ))}
      </ul>
    </BottomSheet>
  );
}

/** "Losse plek €15" / "Word lid vanaf €8,25 per maand" in the sheet. */
function ChoiceCard({
  selected,
  disabled = false,
  title,
  sub,
  right,
  onSelect,
}: {
  selected: boolean;
  disabled?: boolean;
  title: string;
  sub: string | null;
  right: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${title}, ${right}`}
      disabled={disabled}
      onClick={onSelect}
      className={`flex min-h-[3.1rem] w-full items-center gap-3 rounded-2xl border px-4 py-2 text-left transition-[border-color,background-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/40 disabled:cursor-not-allowed disabled:opacity-60 ${
        selected ? rowSelected : "border-wine/[0.1] bg-white"
      }`}
    >
      <span
        aria-hidden
        className={`flex h-[1.3rem] w-[1.3rem] shrink-0 items-center justify-center rounded-full border-[1.5px] ${
          selected ? "border-burgundy bg-burgundy" : "border-wine/20 bg-white"
        }`}
      >
        <span className={`h-2 w-2 rounded-full bg-cream transition-transform ${selected ? "scale-100" : "scale-0"}`} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.98rem] font-semibold leading-tight text-wine">{title}</span>
        {sub ? <span className="mt-0.5 block text-[0.78rem] leading-snug text-wine/55">{sub}</span> : null}
      </span>
      <span className="shrink-0 text-right text-[0.88rem] font-semibold text-burgundy">{right}</span>
    </button>
  );
}

/** "Inbegrepen in je lidmaatschap" and "Gast: €15 €9 (ledenprijs)". */
function MemberLines({
  included,
  guest,
}: {
  included: string;
  guest: { label: string; was: string; now: string; tag: string } | null;
}) {
  return (
    <ul className="mt-2.5 space-y-1 px-1 text-[0.85rem] leading-snug text-wine/75">
      <li className="flex items-start gap-1.5">
        <CheckIcon className="mt-[0.15rem] h-3.5 w-3.5 shrink-0 text-gold" />
        <span>{included}</span>
      </li>
      {guest ? (
        <li className="flex items-start gap-1.5">
          <CheckIcon className="mt-[0.15rem] h-3.5 w-3.5 shrink-0 text-gold" />
          <span>
            {guest.label}: <s className="text-wine/45">{guest.was}</s>{" "}
            <span className="font-semibold text-burgundy">{guest.now}</span> ({guest.tag})
          </span>
        </li>
      ) : null}
    </ul>
  );
}
