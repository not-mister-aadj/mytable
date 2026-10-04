"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { CheckIcon, InfoIcon, PinIcon } from "@/components/jouw-tafel/icons";
import { BottomSheet } from "@/components/jouw-tafel/quiz/BottomSheet";
import { formatSpotsLeftHint } from "@/lib/event-display";
import { shouldShowSpotsCount } from "@/lib/experience-booking";
import { QUIZ_CITIES, displayCity, sameCity, spotsLeft, type QuizEvent } from "@/lib/jouw-tafel/logic";
import type { QuizCopy } from "@/lib/jouw-tafel/quiz-copy";
import {
  ageFromBirthDate,
  answerCities,
  citiesAnswer,
  chooseTablesForAnswers,
  splitCities,
  kiesCities,
  type ChooseRow,
  type QuizAnswers,
} from "@/lib/jouw-tafel/quiz-logic";
import { questionSub, questionTitle, secondaryButton } from "@/components/jouw-tafel/quiz/quiz-ui";
import { fromClientMembership, memberBookingDecision, type ClientMembership } from "@/lib/membership/logic";
import { earlyBlocked, earlyChip } from "@/lib/membership/early-label";
import { trackMembershipEvent } from "@/lib/posthog/analytics";
import { PostHogEvents } from "@/lib/posthog/events";

const AMSTERDAM = "Europe/Amsterdam";

/** "14:00" / "2:00 PM". */
function startTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "nl-NL", {
    timeZone: AMSTERDAM,
    hour: locale === "en" ? "numeric" : "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** "ZO" / "25" / "okt" for the date badge. */
function dateParts(iso: string, locale: Locale): { weekday: string; day: string; month: string } {
  const tag = locale === "en" ? "en-GB" : "nl-NL";
  const parts = new Intl.DateTimeFormat(tag, { timeZone: AMSTERDAM, weekday: "short", day: "numeric", month: "short" })
    .formatToParts(new Date(iso))
    .reduce<Record<string, string>>((acc, p) => ({ ...acc, [p.type]: p.value.replace(/\.$/, "") }), {});
  return { weekday: parts.weekday ?? "", day: parts.day ?? "", month: parts.month ?? "" };
}

/** "Zo 25 okt" for the aria label. */
function shortDate(iso: string, locale: Locale): string {
  const { weekday, day, month } = dateParts(iso, locale);
  const text = `${weekday} ${day} ${month}`;
  return text.charAt(0).toLocaleUpperCase() + text.slice(1);
}

type ChipTone = "wine" | "gold" | "grey";

const CHIP_TONE: Record<ChipTone, string> = {
  wine: "bg-burgundy/[0.09] text-burgundy",
  gold: "bg-gold/[0.16] text-[#7d5c2c]",
  grey: "bg-wine/[0.06] text-wine/55",
};

/** "Nog maar 3 plekken" (wine), "Plekken vrij" (gold), "Binnenkort" (grey). */
export function spotsChip(
  event: QuizEvent,
  locale: Locale,
  copy: QuizCopy["kies"],
  asMember = false,
): { text: string; tone: ChipTone } {
  if (event.comingSoon) {
    // Not bookable yet: the day this person can book (members 2 days
    // before everyone else).
    const from = asMember ? event.opensAt : event.membersOnlyUntil ?? event.opensAt;
    if (from) {
      const { weekday, day, month } = dateParts(from, locale);
      return { text: copy.opensFrom(`${locale === "en" ? weekday : weekday.toLocaleLowerCase("nl-NL")} ${day} ${month}`), tone: "grey" };
    }
    return { text: copy.soonBadge, tone: "grey" };
  }
  const left = spotsLeft(event);
  return shouldShowSpotsCount(left, event.spotsSold)
    ? { text: formatSpotsLeftHint(left, locale), tone: "wine" }
    : { text: copy.spotsOpen, tone: "gold" };
}

export { CHIP_TONE };

/** On top of "Kies je zondag": which cities to see, and for women whether
 * they would like a mixed table or ladies only (a wish for the seating, the
 * tables stay the same). Every change is saved like a quiz answer. */
function ChooseFilters({
  answers,
  copy,
  locale,
  onAnswers,
}: {
  answers: QuizAnswers;
  copy: QuizCopy["kies"]["filters"];
  locale: Locale;
  onAnswers: (patch: Partial<QuizAnswers>) => void;
}) {
  const chosen = answerCities(answers);
  const isChosen = (city: string) => chosen.some((c) => sameCity(c, city));
  // Their own cities first (also a place outside our list), then ours.
  const cities = [...chosen, ...QUIZ_CITIES.filter((c) => !isChosen(c))];
  const ladies = answers.tableType === "girls_only";
  function toggle(city: string) {
    const next = isChosen(city) ? chosen.filter((c) => !sameCity(c, city)) : [...chosen, city];
    if (next.length > 0) onAnswers(citiesAnswer(next));
  }
  const chipOn = ladies ? "border-rose-deep bg-rose-deep text-cream" : "border-burgundy bg-burgundy text-cream";
  return (
    <div className="mt-5">
      {answers.gender === "female" ? (
        <>
          <div
            role="radiogroup"
            aria-label={copy.tableAria}
            className={`grid grid-cols-2 rounded-full p-1 transition-colors ${ladies ? "bg-rose/15" : "bg-wine/[0.06]"}`}
          >
            {(["mixed", "girls_only"] as const).map((kind) => {
              const on = kind === "girls_only" ? ladies : !ladies;
              return (
                <button
                  key={kind}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => onAnswers(kind === "girls_only" ? { tableType: "girls_only" } : { tableType: "mixed", mixedFallback: undefined })}
                  className={`min-h-10 rounded-full text-[0.9rem] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/50 ${
                    on
                      ? `bg-white shadow-[0_2px_8px_rgba(43,13,18,0.10)] ${ladies ? "text-rose-deep" : "text-wine"}`
                      : "text-wine/60"
                  }`}
                >
                  {kind === "girls_only" ? copy.ladies : copy.mixed}
                </button>
              );
            })}
          </div>
          {ladies ? (
            <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 text-[0.85rem] text-wine/75">
              <input
                type="checkbox"
                checked={Boolean(answers.mixedFallback)}
                onChange={(e) => onAnswers({ mixedFallback: e.target.checked })}
                className="h-[18px] w-[18px] rounded accent-[#7a3d4a]"
              />
              {copy.mixedFallback}
            </label>
          ) : null}
        </>
      ) : null}
      <div
        role="group"
        aria-label={copy.citiesAria}
        className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cities.map((city) => {
          const on = isChosen(city);
          return (
            <button
              key={city}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(city)}
              className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[0.9rem] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/50 ${
                on ? chipOn : "border-wine/15 bg-white text-wine/75"
              }`}
            >
              {on ? <CheckIcon className="h-3.5 w-3.5" /> : null}
              {displayCity(city, locale)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export type ChooseHandlers = {
  onViewed: (props: { tables_shown: number; has_match: boolean }) => void;
  /** A table card tapped: goes to the table page (also for "Binnenkort"). */
  onOpen: (props: { event_slug: string; nearby: boolean; coming_soon: boolean }) => void;
  onNotify: (event: QuizEvent | null) => void;
  onShare: () => void;
  /** "Wat is een Sunday Table?" opened. */
  onInfo: () => void;
};

/**
 * "Kies je zondag": the live list for this person (their city and age
 * group first, then nearby, then coming soon). No prices here: a card opens
 * the table page, where she reserves. Never a venue.
 */
export function QuizChoose({
  locale,
  copy,
  answers,
  events,
  now,
  notified,
  handlers,
  tablePath,
  membership = null,
  booked = {},
  onAnswers,
}: {
  locale: Locale;
  copy: QuizCopy;
  answers: QuizAnswers;
  events: QuizEvent[];
  now: number;
  /** Event ids (and "city" for the city as a whole) they asked to hear about. */
  notified: Set<string>;
  handlers: ChooseHandlers;
  /** The table page for an event slug. */
  tablePath: (slug: string) => string;
  /** Tables this person already has a seat at: event id to seats. */
  booked?: Record<string, number>;
  /** Saves a change from the filters on top (cities, kind of table). */
  onAnswers?: (patch: Partial<QuizAnswers>) => void;
  /** Their running membership, null when not a member. */
  membership?: ClientMembership | null;
}) {
  const k = copy.kies;
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

  const viewedRef = useRef(false);
  useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    handlers.onViewed({ tables_shown: rows.length, has_match: hasMatch });
  }, [handlers, rows.length, hasMatch]);

  // early_access_blocked_view: once per table shown as not bookable yet for a non-member.
  const earlySeen = useRef(new Set<string>());
  useEffect(() => {
    for (const row of openRows) {
      if (!earlyBlocked(row.event, membership, now) || earlySeen.current.has(row.event.id)) continue;
      earlySeen.current.add(row.event.id);
      trackMembershipEvent(PostHogEvents.earlyAccessBlockedView, { event_slug: row.event.slug, member: Boolean(membership) });
    }
  }, [openRows, membership, now]);

  function open(row: ChooseRow) {
    handlers.onOpen({ event_slug: row.event.slug, nearby: row.nearby, coming_soon: row.event.comingSoon });
    window.location.assign(tablePath(row.event.slug));
  }

  function notifyButton(event: QuizEvent | null, compact = false) {
    const key = event ? event.id : "city";
    const done = notified.has(key);
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!done) handlers.onNotify(event);
        }}
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

  function tableCard(row: ChooseRow, index: number) {
    const event = row.event;
    const soon = event.comingSoon;
    const asMember =
      memberBookingDecision(fromClientMembership(membership), new Date(event.startsAt), now).kind === "included";
    const seats = booked[event.id];
    const chip = seats
      ? { text: k.booked(seats), tone: "wine" as const }
      : earlyChip(event, locale, membership, now) ?? spotsChip(event, locale, k, asMember);
    return (
      <motion.li
        key={event.id}
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: reduceMotion ? 0 : 0.06 + index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={`${rowCard} ${rowIdle}`}>
          <motion.button
            type="button"
            aria-label={`${k.selectAria}: ${shortDate(event.startsAt, locale)}`}
            onClick={() => open(row)}
            whileTap={reduceMotion ? undefined : { scale: 0.985 }}
            className="flex w-full touch-manipulation items-center gap-3.5 rounded-2xl p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/50"
          >
            <DateBadge iso={event.startsAt} locale={locale} muted={soon} />
            <span className="min-w-0 flex-1">
              <span className={`block text-[1rem] font-semibold leading-tight ${soon ? "text-wine/80" : "text-wine"}`}>
                {k.tableName}
              </span>
              <span className="mt-0.5 block text-[0.9rem] leading-tight text-wine/70">{startTime(event.startsAt, locale)}</span>
              <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className={`rounded-full px-2.5 py-1 text-[0.75rem] font-semibold leading-none ${CHIP_TONE[chip.tone]}`}>
                  {chip.text}
                </span>
                {row.nearby || soon ? (
                  <span className="inline-flex items-center gap-1 text-[0.8rem] text-wine/55">
                    <PinIcon className="h-3.5 w-3.5" />
                    {displayCity(event.city, locale)}
                  </span>
                ) : null}
              </span>
            </span>
            <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 shrink-0 text-wine/30" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </motion.button>
          {soon ? (
            <div className="-mt-1 px-4 pb-3 pl-[5.3rem]">{notifyButton(event)}</div>
          ) : null}
        </div>
      </motion.li>
    );
  }

  const ladies = answers.gender === "female" && answers.tableType === "girls_only";
  function sectionTitle(text: string) {
    return (
      <h2
        className={`flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] ${ladies ? "text-rose" : "text-gold"}`}
      >
        <span className="shrink-0">{text}</span>
        <span aria-hidden className={`h-px flex-1 ${ladies ? "bg-rose/30" : "bg-gold/30"}`} />
      </h2>
    );
  }

  return (
    <div className="pb-16">
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
        {onAnswers ? <ChooseFilters answers={answers} copy={k.filters} locale={locale} onAnswers={onAnswers} /> : null}
      </div>

      {citySections.map((section) => {
        const offset = ownOpen.indexOf(section.rows[0]!);
        return (
          <section key={section.city} className="mt-8">
            {sectionTitle(k.inCity(displayCity(section.city, locale)))}
            <ul className="mt-3.5 space-y-3">{section.rows.map((row, i) => tableCard(row, offset + i))}</ul>
          </section>
        );
      })}

      {nearbyOpen.length > 0 ? (
        <section className="mt-8">
          {sectionTitle(ourCities ? k.ourCities : k.nearby)}
          <ul className="mt-3.5 space-y-3">{nearbyOpen.map((row, i) => tableCard(row, ownOpen.length + i))}</ul>
        </section>
      ) : null}

      {soonRows.length > 0 ? (
        <section className="mt-8">
          {sectionTitle(k.comingSoon)}
          <ul className="mt-3.5 space-y-3">{soonRows.map((row, i) => tableCard(row, openRows.length + i))}</ul>
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
          lines={[...k.infoLines, k.infoLast]}
          onClose={() => setInfoOpen(false)}
        />
      ) : null}
    </div>
  );
}

const rowCard = "rounded-2xl border transition-[border-color,background-color,box-shadow] duration-200";
const rowIdle = "border-wine/[0.08] bg-white shadow-[0_1px_2px_rgba(43,13,18,0.04),0_6px_18px_rgba(43,13,18,0.04)]";

/** Weekday, big day number, month: "ZO / 25 / okt". */
function DateBadge({ iso, locale, muted = false }: { iso: string; locale: Locale; muted?: boolean }) {
  const { weekday, day, month } = dateParts(iso, locale);
  return (
    <span
      aria-hidden
      className={`relative flex h-[4.1rem] w-[3.6rem] shrink-0 flex-col items-center justify-center rounded-xl ${
        muted ? "bg-wine/[0.04] text-wine/50" : "bg-[#f5ebe6] text-burgundy"
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
