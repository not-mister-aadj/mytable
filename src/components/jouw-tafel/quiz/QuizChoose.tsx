"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { CheckIcon, PinIcon } from "@/components/jouw-tafel/icons";
import { BottomSheet } from "@/components/jouw-tafel/quiz/BottomSheet";
import { formatTableSpotsLeftHint, tableSpotsLeft } from "@/lib/event-display";
import { QUIZ_CITIES, displayCity, guestsAroundAge, sameCity, tableFit, type QuizEvent } from "@/lib/jouw-tafel/logic";
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
import { secondaryButton } from "@/components/jouw-tafel/quiz/quiz-ui";
import { fromClientMembership, memberBookingDecision, type ClientMembership } from "@/lib/membership/logic";
import { earlyBlocked, earlyChip } from "@/lib/membership/early-label";
import { trackMembershipEvent } from "@/lib/posthog/analytics";
import { PostHogEvents } from "@/lib/posthog/events";

const AMSTERDAM = "Europe/Amsterdam";

/** "N mensen die bij jou passen" shows from this many guests around their age. */
const FIT_SHOWN_FROM = 6;

/** How many full Sundays may stand above the first one that can be booked. */
const FULL_BEFORE_FIRST = 2;

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

/** Real photos of our tables, one per card in turn (the wine bar is not
 * known yet, so never a venue photo). */
const TABLE_PHOTOS = [
  "/girls-only/wine-tasting-conversation.jpg",
  "/girls-only/wine-tasting-toast.jpg",
  "/girls-only/table-wine-laughing.jpg",
  "/girls-only/smiling-glasses.jpg",
  "/girls-only/table-group.jpg",
] as const;
const LADIES_PHOTOS = ["/girls-only/table-group.jpg", "/girls-only/laughing-bar.jpg", "/girls-only/table-wine-laughing.jpg"] as const;

const CARD_COPY = {
  nl: {
    wineBarIn: (city: string) => `Een wijnbar in ${city}`,
    reserveShort: "Reserveer",
    next: "Eerstvolgende",
    nextTables: "Eerstvolgende tafels",
    shortPeople: "4 tot 6 mensen",
    how: "Hoe werkt het?",
    adjust: "Aanpassen",
    priceLine: (price: string) => `${price} per plek`,
  },
  en: {
    wineBarIn: (city: string) => `A wine bar in ${city}`,
    reserveShort: "Reserve",
    next: "Next up",
    nextTables: "Next tables",
    shortPeople: "4 to 6 people",
    how: "How it works",
    adjust: "Change",
    priceLine: (price: string) => `${price} per seat`,
  },
} as const;

function priceText(cents: number, locale: Locale): string {
  const price = cents / 100;
  return Number.isInteger(price) ? `€${price}` : `€${price.toFixed(2).replace(".", locale === "en" ? "." : ",")}`;
}

/** "Zondag 8 november" / "Sunday 8 November". */
function longDate(iso: string, locale: Locale): string {
  const text = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", {
    timeZone: AMSTERDAM,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
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
  // Filled a table at a time: the seats left at the table being filled.
  const left = tableSpotsLeft(event.capacity, event.spotsSold);
  return left > 0 ? { text: formatTableSpotsLeftHint(left, locale), tone: "wine" } : { text: copy.spotsOpen, tone: "gold" };
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
    <div className="mt-3.5">
      {answers.gender === "female" ? (
        <>
          <div
            role="radiogroup"
            aria-label={copy.tableAria}
            className={`mx-auto grid max-w-[17rem] grid-cols-2 rounded-full p-[3px] transition-colors ${ladies ? "bg-rose/15" : "bg-wine/[0.06]"}`}
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
                  className={`min-h-8 rounded-full text-[0.82rem] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/50 ${
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
            <p className="mx-auto mt-3 max-w-sm text-center text-[0.8rem] leading-snug text-rose-deep/80">
              {copy.ladiesNotYet[0]}
              <strong className="font-bold text-rose-deep">{copy.ladiesNotYet[1]}</strong>
              {copy.ladiesNotYet[2]}
            </p>
          ) : null}
        </>
      ) : null}
      <div
        role="group"
        aria-label={copy.citiesAria}
        className={answers.gender === "female" ? "mt-2.5" : ""}
      >
        {/* One row: their own cities first, the rest a swipe away. */}
        <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-0.5 [scrollbar-width:none] sm:mx-0 sm:gap-1 sm:px-0 sm:[justify-content:safe_center] [&::-webkit-scrollbar]:hidden">
        {cities.map((city) => {
          const on = isChosen(city);
          return (
            <button
              key={city}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(city)}
              className={`inline-flex min-h-9 shrink-0 items-center rounded-full border px-3 text-[0.85rem] font-medium tracking-[0.01em] transition sm:px-[7px] sm:text-[0.8rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/50 ${
                on ? chipOn : "border-gold/40 bg-transparent text-wine/70 hover:border-gold/70"
              }`}
            >
              {displayCity(city, locale)}
            </button>
          );
        })}
        </div>
      </div>
    </div>
  );
}

export type ChooseHandlers = {
  onViewed: (props: { tables_shown: number; has_match: boolean }) => void;
  /** A table card tapped: goes to the table page (also for "Binnenkort"). */
  onOpen: (props: { event_slug: string; nearby: boolean; coming_soon: boolean }) => void;
  /** `off`: tapped again, off the list. */
  onNotify: (event: QuizEvent | null, off?: boolean) => void;
  onShare: () => void;
  /** "Wat is een Sunday Table?" opened. */
  onInfo: () => void;
};

/**
 * "Kies je zondag": the live list for this person (their city and age
 * group first, then nearby, then coming soon). A bookable Sunday is a full
 * card (photo, three reasons, the seat price, "Reserveer je plek") that opens
 * the date page, where she reserves. Never a venue, and no monthly price.
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
  matches = {},
  preferencesHref = null,
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
  /** Where a table card goes: the Sunday Social date page of that table. */
  tablePath: (event: QuizEvent) => string;
  /** Tables this person already has a seat at: event id to seats. */
  booked?: Record<string, number>;
  /** Per table: how many of their mutual likes have a seat there. */
  matches?: Record<string, number>;
  /** Their preferences in settings, for who has an account; null for a guest. */
  preferencesHref?: string | null;
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
  // A city whose Sunday is full has one: the line is for cities with none.
  const noSunday = kiesCities(cities, rows).noSunday.filter(
    (city) => !rows.some((r) => !r.nearby && sameCity(r.event.city, city)),
  );
  const [infoOpen, setInfoOpen] = useState(false);
  const infoTrigger = useRef<HTMLButtonElement>(null);
  const openRows = rows.filter((r) => r.kind === "open");
  // One list by date, nearest first, whatever the city (the city is on
  // every row): the question is "when can I", not "where".
  const byDate = (x: ChooseRow, y: ChooseRow) => Date.parse(x.event.startsAt) - Date.parse(y.event.startsAt);
  const ownOpen = openRows.filter((r) => !r.nearby).sort(byDate);
  const nearbyOpen = openRows.filter((r) => r.nearby).sort(byDate);
  // A full Sunday stays on its date between the others, in the usual row: it
  // shows how fast they go. At most FULL_BEFORE_FIRST of them above the first
  // Sunday that can be booked; older ones go under the list.
  const ownClosed = rows.filter((r) => r.kind === "closed" && !r.nearby).sort(byDate);
  const ownOpenCount = ownOpen.length;
  const firstOpenAt = ownOpen.length > 0 ? Date.parse(ownOpen[0]!.event.startsAt) : null;
  const closedBefore = firstOpenAt === null ? [] : ownClosed.filter((r) => Date.parse(r.event.startsAt) < firstOpenAt);
  const closedHeld = closedBefore.slice(0, Math.max(0, closedBefore.length - FULL_BEFORE_FIRST));
  const closedBelow = firstOpenAt === null ? ownClosed : closedHeld;
  const ownDated = [...ownOpen, ...ownClosed.filter((r) => !closedBelow.includes(r))].sort(byDate);
  const soonRows = rows.filter((r) => r.kind === "soon");

  const viewedRef = useRef(false);
  useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    handlers.onViewed({ tables_shown: rows.filter((r) => r.kind !== "closed").length, has_match: hasMatch });
  }, [handlers, rows, hasMatch]);

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
    // Straight to their details: this Sunday's ticket is chosen, with a
    // second seat for who said they bring someone.
    const path = tablePath(row.event);
    const bookable = row.kind === "open" && !row.event.comingSoon;
    const query = bookable ? `${path.includes("?") ? "&" : "?"}ticket=deze-zondag${answers.companion === "with" ? "&plekken=2" : ""}` : "";
    window.location.assign(`${path}${query}${bookable ? "#boeken" : ""}`);
  }

  /** The light on a bookable table (tableFit): green with "11 mensen die
   * bij jou passen" from six guests around their age, red when it may
   * suit them less, and nothing in between. Never how many booked, and
   * never who. */
  function fitRow(event: QuizEvent, compact = false) {
    if (age === null) return null;
    const around = guestsAroundAge(event.ageBuckets, age);
    const fit = tableFit({ around, seatsLeft: Math.max(0, event.capacity - event.spotsSold) });
    // Green only with a number worth showing: from FIT_SHOWN_FROM guests
    // around their age (the seats-left label already carries the scarcity).
    if (fit === "none" || (fit === "good" && around < FIT_SHOWN_FROM)) return null;
    const tone = fit === "good" ? "bg-emerald-500" : "bg-red-500";
    return (
      <span className={`flex items-center gap-2.5 border-t border-wine/[0.07] ${compact ? "px-3.5 py-2.5" : "px-4 py-3"}`}>
        <span aria-hidden className="relative flex h-3 w-3 shrink-0">
          {fit === "good" && !reduceMotion ? (
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-50 ${tone}`} />
          ) : null}
          <span className={`relative inline-flex h-3 w-3 rounded-full ring-2 ring-white ${tone}`} />
        </span>
        <span className={`leading-snug text-wine ${compact ? "text-[0.85rem]" : "text-[0.92rem] font-medium"}`}>
          {fit === "low" ? (
            k.fitLow
          ) : (
            <>
              <span className="font-bold tabular-nums">{around}</span> {k.fit}
            </>
          )}
        </span>
      </span>
    );
  }

  /** Someone they had a good time with has a seat here: the warmest reason
   * to pick this Sunday, so it gets its own band. */
  function knownBand(event: QuizEvent, compact = false) {
    const n = matches[event.id] ?? 0;
    if (n === 0) return null;
    return (
      <span
        className={`flex items-center gap-2.5 bg-gradient-to-r from-gold/25 via-gold/15 to-gold/5 text-left ${
          compact ? "rounded-b-2xl px-3 py-2.5" : "px-4 py-3"
        }`}
      >
        {/* A glass of wine: a seat next to someone they know. */}
        <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-burgundy text-cream shadow-[0_3px_10px_rgba(90,15,27,0.3)]">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 3h10l-.7 6a4.3 4.3 0 0 1-8.6 0Z" />
            <path d="M7.5 7.4h9" />
            <path d="M12 13.3V20.5M8.5 20.5h7" />
          </svg>
        </span>
        <span className="text-[0.88rem] font-semibold leading-snug text-wine">{k.known(n)}</span>
      </span>
    );
  }

  function notifyButton(event: QuizEvent | null, compact = false, label: string = k.notify, tight = false) {
    const key = event ? event.id : "city";
    const done = notified.has(key);
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handlers.onNotify(event, done);
        }}
        aria-pressed={done}
        className={`inline-flex ${tight ? "min-h-7 text-[0.82rem]" : "min-h-11"} shrink-0 items-center gap-1.5 rounded-full text-sm font-semibold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/50 ${
          compact
            ? "px-0 text-left text-burgundy underline decoration-burgundy/30 underline-offset-4"
            : "border border-wine/12 bg-white px-3.5 text-[0.82rem] text-wine shadow-[0_1px_4px_rgba(43,13,18,0.05)]"
        } ${done ? "no-underline text-wine/55" : ""}`}
      >
        {done ? <CheckIcon className="h-4 w-4" /> : null}
        {label}
      </button>
    );
  }

  const cardCopy = CARD_COPY[locale === "en" ? "en" : "nl"];
  // The very next bookable Sunday stands out ("Eerstvolgende").
  const featuredRow = [...openRows]
    .filter((r) => !r.event.comingSoon && !booked[r.event.id])
    .sort((a, b) => Date.parse(a.event.startsAt) - Date.parse(b.event.startsAt))[0];
  const featuredId = featuredRow?.event.id;

  /** A Sunday that can be booked now. The next one is a card with a photo of
   * a real table; the ones after it are compact rows. What every Sunday has
   * in common (table size, seating by age, price) is said once, above. */
  function bookableCard(row: ChooseRow, index: number, chip: { text: string; tone: ChipTone }) {
    const event = row.event;
    const featured = event.id === featuredId;
    const motionProps = {
      initial: reduceMotion ? false : { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.28, delay: reduceMotion ? 0 : 0.06 + index * 0.04, ease: [0.22, 1, 0.36, 1] as const },
    };
    const when = `${longDate(event.startsAt, locale)} · ${startTime(event.startsAt, locale)}`;
    if (!featured) {
      return (
        <motion.li key={event.id} {...motionProps}>
          <div className={`${rowCard} ${rowIdle}`}>
            <button
              type="button"
              aria-label={`${k.selectAria}: ${shortDate(event.startsAt, locale)}`}
              onClick={() => open(row)}
              className="flex w-full touch-manipulation items-center gap-3.5 rounded-2xl p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/50"
            >
              <DateBadge iso={event.startsAt} locale={locale} />
              <span className="min-w-0 flex-1">
                <span className="block text-[1rem] font-semibold leading-tight text-wine">{startTime(event.startsAt, locale)}</span>
                <span className="mt-0.5 flex items-center gap-1 text-[0.85rem] leading-tight text-wine/60">
                  <PinIcon className="h-3.5 w-3.5 shrink-0" />
                  {displayCity(event.city, locale)}
                </span>
                <span className={`mt-1.5 inline-block rounded-full px-2.5 py-1 text-[0.75rem] font-semibold leading-none ${CHIP_TONE[chip.tone]}`}>
                  {chip.text}
                </span>
              </span>
              <span className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-burgundy px-4 text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-cream">
                {cardCopy.reserveShort}
              </span>
            </button>
            {fitRow(event, true)}
            {knownBand(event, true)}
          </div>
        </motion.li>
      );
    }
    const photos = answers.gender === "female" && answers.tableType === "girls_only" ? LADIES_PHOTOS : TABLE_PHOTOS;
    const photo = photos[index % photos.length]!;
    return (
      <motion.li key={event.id} {...motionProps}>
        <div className={`${rowCard} ${rowIdle} overflow-hidden ring-1 ring-gold/60`}>
          <button
            type="button"
            aria-label={`${k.selectAria}: ${shortDate(event.startsAt, locale)}`}
            onClick={() => open(row)}
            className="block w-full touch-manipulation text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/50"
          >
            <span className="relative block aspect-[2/1] w-full">
              <Image src={photo} alt="" fill sizes="(max-width: 640px) 100vw, 420px" className="object-cover" />
              <span className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-gold px-2.5 py-1 text-[0.72rem] font-bold uppercase leading-none tracking-[0.08em] text-wine">
                  {matches[event.id] ? k.knownBadge(matches[event.id]!) : cardCopy.next}
                </span>
                <span className="rounded-full bg-white/95 px-2.5 py-1 text-[0.72rem] font-semibold leading-none text-burgundy shadow-sm">
                  {chip.text}
                </span>
              </span>
            </span>
            {knownBand(event)}
            <span className="flex items-end justify-between gap-3 px-4 pb-4 pt-3">
              <span className="min-w-0">
                <span className="block text-[1.05rem] font-semibold leading-tight text-wine">{when}</span>
                <span className="mt-1 flex items-center gap-1 text-[0.88rem] text-wine/65">
                  <PinIcon className="h-3.5 w-3.5 shrink-0" />
                  {cardCopy.wineBarIn(displayCity(event.city, locale))}
                </span>
              </span>
              <span className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-burgundy px-5 text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-cream">
                {cardCopy.reserveShort}
              </span>
            </span>
            {fitRow(event)}
          </button>
        </div>
      </motion.li>
    );
  }

  function tableCard(row: ChooseRow, index: number) {
    const event = row.event;
    const closed = row.kind === "closed";
    const soon = event.comingSoon && !closed;
    const muted = soon || closed;
    const asMember =
      memberBookingDecision(fromClientMembership(membership), new Date(event.startsAt), now).kind === "included";
    const seats = booked[event.id];
    // Bookable now and no seat yet: the full card.
    if (!muted && !seats && !earlyBlocked(event, membership, now)) {
      return bookableCard(row, index, spotsChip(event, locale, k, asMember));
    }
    const chip = seats
      ? { text: k.booked(seats), tone: "wine" as const }
      : closed
        ? { text: k.noLongerBookable, tone: "grey" as const }
        : earlyChip(event, locale, membership, now) ?? spotsChip(event, locale, k, asMember);
    return (
      <motion.li
        key={event.id}
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: reduceMotion ? 0 : 0.06 + index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={`${rowCard} ${closed && !seats ? rowGone : rowIdle}`}>
          <motion.button
            type="button"
            aria-label={`${k.selectAria}: ${shortDate(event.startsAt, locale)}`}
            onClick={() => open(row)}
            whileTap={reduceMotion ? undefined : { scale: 0.985 }}
            className="flex w-full touch-manipulation items-center gap-3.5 rounded-2xl p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/50"
          >
            <DateBadge iso={event.startsAt} locale={locale} muted={muted} />
            <span className="min-w-0 flex-1">
              <span className={`block text-[1rem] font-semibold leading-tight ${closed && !seats ? "text-wine/55" : muted ? "text-wine/80" : "text-wine"}`}>
                {k.tableName}
              </span>
              {/* A full Sunday keeps to two lines: its time no longer matters. */}
              {closed && !seats ? null : (
                <span className="mt-0.5 block text-[0.9rem] leading-tight text-wine/70">{startTime(event.startsAt, locale)}</span>
              )}
              <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span
                  className={`rounded-full px-2.5 py-1 leading-none ${
                    closed && !seats
                      ? "bg-burgundy text-[0.7rem] font-bold uppercase tracking-[0.1em] text-cream"
                      : `text-[0.75rem] font-semibold ${CHIP_TONE[chip.tone]}`
                  }`}
                >
                  {chip.text}
                </span>
                {/* Always the city: the list runs across cities. */}
                <span className="inline-flex items-center gap-1 text-[0.8rem] text-wine/55">
                  <PinIcon className="h-3.5 w-3.5" />
                  {displayCity(event.city, locale)}
                </span>
              </span>
            </span>
            <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 shrink-0 text-wine/30" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </motion.button>
          {soon ? (
            <div className="-mt-1 px-4 pb-3 pl-[5.3rem]">{notifyButton(event)}</div>
          ) : closed && !seats ? (
            <div className="-mt-4 px-4 pb-1 pl-[5.3rem]">{notifyButton(event, true, k.extraTable, true)}</div>
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
      <div className="pt-1">
        {/* The title is in the bar on top; here only for screen readers. */}
        <h1 tabIndex={-1} className="sr-only">
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
          <>
            {age !== null ? (
              <p className="mx-auto max-w-[21rem] text-center text-[1.05rem] font-medium leading-snug text-wine text-balance">
                {k.match({
                  around: answers.ageMatters === "yes" ? Math.round(age / 5) * 5 : null,
                  dutch: answers.language === "dutch",
                  alone: answers.companion === "alone",
                })}
                {preferencesHref ? (
                  <>
                    {" "}
                    <a
                      href={preferencesHref}
                      className="inline-flex items-center gap-1 whitespace-nowrap align-baseline text-[0.82rem] font-medium text-burgundy underline decoration-burgundy/30 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/50"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                      {cardCopy.adjust}
                    </a>
                  </>
                ) : null}
              </p>
            ) : null}
            {ownOpenCount === 0 && ours.length > 0 ? (
              <p className="mx-auto mt-2 max-w-[21rem] text-center text-[0.92rem] leading-snug text-wine/75 text-balance">
                {k.elsewhere(shownCity)}
              </p>
            ) : null}
          </>
        ) : (
          <p className="mx-auto mt-3 max-w-[21rem] text-center text-[1rem] leading-relaxed text-wine/75 text-balance">
            {k.noMatch(shownCity)}
          </p>
        )}
        <p className="mt-2 text-center text-[0.85rem] leading-relaxed text-wine/60">
          {featuredRow ? (
            <>
              {cardCopy.shortPeople}
              <span aria-hidden className="mx-1.5 text-gold">·</span>
              {cardCopy.priceLine(priceText(featuredRow.event.priceCents, locale))}
              <span aria-hidden className="mx-1.5 text-gold">·</span>
            </>
          ) : null}
          <button
            ref={infoTrigger}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={infoOpen}
            onClick={() => {
              setInfoOpen(true);
              handlers.onInfo();
            }}
            className="inline font-medium text-burgundy underline decoration-burgundy/30 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/50"
          >
            {featuredRow ? cardCopy.how : k.infoLink}
          </button>
        </p>
        {onAnswers ? <ChooseFilters answers={answers} copy={k.filters} locale={locale} onAnswers={onAnswers} /> : null}
      </div>

      {ownDated.length > 0 ? (
        <section className="mt-6">
          <ul className="space-y-3">{ownDated.map((row, i) => tableCard(row, i))}</ul>
        </section>
      ) : null}

      {nearbyOpen.length > 0 ? (
        <section className="mt-6">
          {sectionTitle(ownOpenCount === 0 && ours.length > 0 ? cardCopy.nextTables : ourCities ? k.ourCities : k.nearby)}
          <ul className="mt-3.5 space-y-3">{nearbyOpen.map((row, i) => tableCard(row, ownDated.length + i))}</ul>
        </section>
      ) : null}

      {/* Full Sundays that did not fit above the first bookable one. */}
      {closedBelow.length > 0 ? (
        <section className="mt-6">
          {sectionTitle(k.noLongerBookable)}
          <ul className="mt-3.5 space-y-2">{closedBelow.map((row, i) => tableCard(row, ownDated.length + nearbyOpen.length + i))}</ul>
        </section>
      ) : null}

      {soonRows.length > 0 ? (
        <section className="mt-6">
          {sectionTitle(k.comingSoon)}
          <ul className="mt-3.5 space-y-3">{soonRows.map((row, i) => tableCard(row, ownDated.length + nearbyOpen.length + closedBelow.length + i))}</ul>
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
/** A full Sunday: the same row, set back. */
const rowGone = "border-wine/[0.06] bg-wine/[0.035]";
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
