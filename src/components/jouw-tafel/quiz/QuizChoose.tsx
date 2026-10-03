"use client";

import * as Sentry from "@sentry/nextjs";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { CheckIcon, CloseIcon, InfoIcon, PinIcon, ShieldIcon } from "@/components/jouw-tafel/icons";
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
  const [dutchOk, setDutchOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxSeats = selected ? Math.min(2, spotsLeft(selected.event)) : 2;
  const effectiveSeats: 1 | 2 = maxSeats < 2 ? 1 : seats;
  const dutchOnly = Boolean(selected) && answers.language === "english" && !selected!.event.englishOpen;

  const viewedRef = useRef(false);
  useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    handlers.onViewed({ tables_shown: rows.length, has_match: hasMatch });
  }, [handlers, rows.length, hasMatch]);

  async function reserve() {
    if (!selected || loading) return;
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
          // Said English but accepted a Dutch table: either is fine then.
          tableLanguagePreference: dutchOnly ? "both_fine" : checkoutTableLanguage(answers.language),
          dietaryNotes: dietaryNotes(answers) || undefined,
          utm: getStoredUtm(),
          meta: { ...getMetaBrowserCookies(), eventSourceUrl: getMetaEventSourceUrl() },
        }),
      });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
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
    const chip = spotsChip(event, locale, k);
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
              setDutchOk(false);
              setError(null);
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
              {k.perSeat(formatEuros(event.priceCents))}
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
            {row.nearby ? (
              <span className="inline-flex items-center gap-1 text-[0.8rem] text-wine/55">
                <PinIcon className="h-3.5 w-3.5" />
                {displayCity(event.city, locale)}
              </span>
            ) : null}
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
    <div className={selected ? "pb-80" : "pb-16"}>
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
        {answers.tableType === "girls_only" ? (
          <p className="mx-auto mt-4 max-w-[21rem] rounded-2xl bg-gold/[0.12] px-4 py-3 text-center text-[0.92rem] leading-snug text-wine/80 text-balance">
            {k.girlsOnly}
          </p>
        ) : null}
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

      {unsure ? <p className="mt-6 text-center text-[0.95rem] leading-relaxed text-wine/70">{k.unsure}</p> : null}

      {infoOpen ? (
        <InfoSheet
          title={k.infoLink}
          closeLabel={k.infoClose}
          lines={[
            ...k.infoLines,
            ...(price ? [k.infoPrice(`€${formatEuros(price.cents)}`, price.from)] : []),
            k.infoLast,
          ]}
          onClose={() => {
            setInfoOpen(false);
            infoTrigger.current?.focus();
          }}
        />
      ) : null}

      {selected ? (
        <div className="fixed inset-x-0 bottom-0 z-20">
          <motion.div
            initial={reduceMotion ? false : { y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-full max-w-md rounded-t-[1.75rem] border border-b-0 border-wine/[0.08] bg-white/90 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-12px_40px_rgba(43,13,18,0.12)] backdrop-blur-xl"
          >
            <div aria-hidden className="mx-auto mb-3.5 h-1 w-10 rounded-full bg-wine/15" />
            {dutchOnly && !dutchOk ? (
              <div>
                <p className="text-center text-[0.95rem] font-medium text-wine">{k.dutchTableNote}</p>
                <button type="button" className={`${primaryButton} mt-3`} onClick={() => setDutchOk(true)}>
                  {k.dutchFine}
                </button>
                <div className="mt-2 flex justify-center">{notifyButton(selected.event, true)}</div>
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
                          onClick={() => setSeats(n)}
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
                    {k.total(formatEuros(selected.event.priceCents * effectiveSeats))}
                  </p>
                </div>
                {maxSeats < 2 ? <p className="mt-2 text-xs text-wine/60">{k.onlyOneLeft}</p> : null}
                <p className="mt-3 flex items-start gap-2 text-[0.8rem] leading-snug text-wine/60">
                  <ShieldIcon className="mt-px h-4 w-4 shrink-0 text-gold" />
                  {k.guarantee}
                </p>
                <button
                  type="button"
                  className={`${primaryButton} mt-3.5`}
                  onClick={() => void reserve()}
                  disabled={loading}
                >
                  {loading ? k.reserving : k.reserve}
                </button>
                {error ? (
                  <p role="alert" className="mt-2 text-center text-sm font-semibold text-red-600">
                    {error}
                  </p>
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

/**
 * "Wat is een Sunday Table?": a bottom sheet in the style of the reserve
 * panel. A modal dialog: focus moves in and stays in (Tab wraps), Escape or
 * the close button or the backdrop closes it, the page behind does not
 * scroll.
 */
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
  const reduceMotion = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButton.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panel.current) return;
      const focusable = [...panel.current.querySelectorAll<HTMLElement>("button, a[href], [tabindex]:not([tabindex='-1'])")];
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!panel.current.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40">
      <motion.div
        aria-hidden
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-wine/30"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0">
        <motion.div
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-labelledby="jt-quiz-info-title"
          initial={reduceMotion ? false : { y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-h-[85svh] w-full max-w-md overflow-y-auto rounded-t-[1.75rem] border border-b-0 border-wine/[0.08] bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-12px_40px_rgba(43,13,18,0.12)]"
        >
          <div aria-hidden className="mx-auto mb-3 h-1 w-10 rounded-full bg-wine/15" />
          <div className="flex items-start justify-between gap-3">
            <h2 id="jt-quiz-info-title" className="pt-1 font-serif text-[1.55rem] font-medium leading-tight text-wine">
              {title}
            </h2>
            <button
              ref={closeButton}
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream text-wine transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/50"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
          <ul className="mt-4 space-y-3">
            {lines.map((line) => (
              <li key={line} className="flex gap-3 text-[1rem] leading-relaxed text-wine/80">
                <span aria-hidden className="mt-[0.6rem] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                {line}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
