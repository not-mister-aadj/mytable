"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { CheckIcon, PinIcon } from "@/components/jouw-tafel/icons";
import { getMetaBrowserCookies, getMetaEventSourceUrl } from "@/lib/analytics/metaCookies";
import { getStoredUtm } from "@/lib/analytics/utm";
import { formatSpotsLeftHint } from "@/lib/event-display";
import { shouldShowSpotsCount } from "@/lib/experience-booking";
import { formatEuros } from "@/lib/jouw-tafel/copy";
import { displayCity, spotsLeft, type QuizEvent } from "@/lib/jouw-tafel/logic";
import type { QuizCopy } from "@/lib/jouw-tafel/quiz-copy";
import {
  ageFromBirthDate,
  checkoutTableLanguage,
  chooseTables,
  defaultSeats,
  dietaryNotes,
  type ChooseRow,
  type QuizAnswers,
} from "@/lib/jouw-tafel/quiz-logic";
import { StickyBar, primaryButton, questionTitle, secondaryButton } from "@/components/jouw-tafel/quiz/quiz-ui";

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

function spotsText(event: QuizEvent, locale: Locale, copy: QuizCopy["kies"]): string {
  if (event.comingSoon) return copy.soonBadge;
  const left = spotsLeft(event);
  return shouldShowSpotsCount(left, event.spotsSold) ? formatSpotsLeftHint(left, locale) : copy.spotsOpen;
}

export type ChooseHandlers = {
  onViewed: (props: { tables_shown: number; has_match: boolean }) => void;
  onReserve: (props: { event_slug: string; seats: number; nearby: boolean }) => void;
  onNotify: (event: QuizEvent | null) => void;
  onShare: () => void;
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
  const city = answers.city ?? "";
  const shownCity = displayCity(city, locale);
  const age = answers.birthDate ? ageFromBirthDate(answers.birthDate, now) : null;
  const { rows, hasMatch } = useMemo(
    () =>
      age === null
        ? { rows: [] as ChooseRow[], hasMatch: false }
        : chooseTables(events, { city, age, ageMatters: answers.ageMatters }, now),
    [events, city, age, answers.ageMatters, now],
  );
  const openRows = rows.filter((r) => r.kind === "open");
  const ownOpen = openRows.filter((r) => !r.nearby);
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
        className={`inline-flex min-h-11 items-center gap-1.5 rounded-full text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/50 ${
          compact ? "px-0 text-burgundy underline decoration-burgundy/30 underline-offset-4" : "border border-wine/15 bg-white px-4 text-wine"
        } ${done ? "no-underline text-wine/60" : ""}`}
      >
        {done ? <CheckIcon className="h-4 w-4" /> : null}
        {k.notify}
      </button>
    );
  }

  function openRow(row: ChooseRow) {
    const event = row.event;
    const isSelected = selectedId === event.id;
    return (
      <li key={event.id}>
        <div
          className={`rounded-2xl border transition ${
            isSelected ? "border-burgundy bg-white shadow-[0_10px_26px_rgba(90,15,27,0.14)]" : "border-wine/12 bg-white"
          }`}
        >
          <button
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`${k.selectAria}: ${shortDate(event.startsAt, locale)}`}
            onClick={() => {
              setSelectedId(event.id);
              setDutchOk(false);
              setError(null);
            }}
            className="flex min-h-16 w-full touch-manipulation items-center gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/50 rounded-2xl"
          >
            <span className="min-w-0 flex-1">
              <span className="block font-serif text-[1.3rem] font-medium leading-tight text-wine">
                {shortDate(event.startsAt, locale)}
                <span className="font-sans text-[0.95rem] font-medium text-wine/60">
                  {" · "}
                  {startTime(event.startsAt, locale)}
                  {" · "}
                  <span className="font-semibold text-wine/80">{event.bracket}</span>
                </span>
              </span>
              <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                {row.nearby ? (
                  <span className="inline-flex items-center gap-1 text-wine/60">
                    <PinIcon className="h-3.5 w-3.5" />
                    {displayCity(event.city, locale)}
                  </span>
                ) : null}
                <span className="font-semibold text-burgundy">{spotsText(event, locale, k)}</span>
                <span className="text-wine/55">{k.perSeat(formatEuros(event.priceCents))}</span>
              </span>
            </span>
            <span
              aria-hidden
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
                isSelected ? "border-burgundy bg-burgundy text-cream" : "border-wine/25 text-transparent"
              }`}
            >
              <CheckIcon className="h-4 w-4" />
            </span>
          </button>
          {unsure ? <div className="-mt-2 px-5 pb-3">{notifyButton(event, true)}</div> : null}
        </div>
      </li>
    );
  }

  function soonRow(row: ChooseRow) {
    const event = row.event;
    return (
      <li key={event.id} className="flex items-center gap-4 rounded-2xl border border-wine/10 bg-white/70 px-5 py-4">
        <span className="min-w-0 flex-1">
          <span className="block font-serif text-[1.2rem] font-medium leading-tight text-wine">
            {shortDate(event.startsAt, locale)}
            <span className="font-sans text-[0.9rem] font-medium text-wine/60">
              {" · "}
              {event.bracket}
            </span>
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-wine/60">
            {row.nearby ? (
              <span className="inline-flex items-center gap-1">
                <PinIcon className="h-3.5 w-3.5" />
                {displayCity(event.city, locale)}
              </span>
            ) : null}
            <span className="rounded-full border border-gold/50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-wine/70">
              {k.soonBadge}
            </span>
          </span>
        </span>
        {notifyButton(event)}
      </li>
    );
  }

  const sectionTitle = "text-[11px] font-semibold uppercase tracking-[0.22em] text-gold";

  return (
    <div className={selected ? "pb-72" : "pb-16"}>
      <h1 tabIndex={-1} className={questionTitle}>
        {k.title}
      </h1>
      {hasMatch ? (
        <p className="mt-3 text-[1rem] leading-relaxed text-wine/70">{k.sub(shownCity)}</p>
      ) : (
        <p className="mt-3 text-[1.05rem] leading-relaxed text-wine/80">{k.noMatch(shownCity)}</p>
      )}

      {ownOpen.length > 0 ? (
        <section className="mt-7">
          <h2 className={sectionTitle}>{k.inCity(shownCity)}</h2>
          <ul role="radiogroup" className="mt-3 space-y-3">
            {ownOpen.map(openRow)}
          </ul>
        </section>
      ) : null}

      {nearbyOpen.length > 0 ? (
        <section className="mt-7">
          <h2 className={sectionTitle}>{k.nearby}</h2>
          <ul role="radiogroup" className="mt-3 space-y-3">
            {nearbyOpen.map(openRow)}
          </ul>
        </section>
      ) : null}

      {soonRows.length > 0 ? (
        <section className="mt-7">
          <h2 className={sectionTitle}>{k.comingSoon}</h2>
          <ul className="mt-3 space-y-3">{soonRows.map(soonRow)}</ul>
        </section>
      ) : null}

      {hasMatch ? (
        <p className="mt-6 flex items-start gap-2 text-sm leading-relaxed text-wine/60">
          <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          {k.where}
        </p>
      ) : (
        <div className="mt-7 space-y-3">
          <button type="button" className={secondaryButton} onClick={handlers.onShare}>
            {k.share}
          </button>
        </div>
      )}

      {unsure ? <p className="mt-6 text-[0.95rem] leading-relaxed text-wine/70">{k.unsure}</p> : null}

      {selected ? (
        <StickyBar>
          <div className="rounded-[1.5rem] border border-wine/10 bg-white p-4 shadow-[0_-8px_40px_rgba(43,13,18,0.10)]">
            {dutchOnly && !dutchOk ? (
              <div>
                <p className="text-[0.95rem] font-medium text-wine">{k.dutchTableNote}</p>
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
                          className={`min-h-11 rounded-full px-4 text-sm font-semibold transition disabled:opacity-35 ${
                            active ? "bg-burgundy text-cream shadow" : "text-wine/70"
                          }`}
                        >
                          {k.seatOption(n)}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-right text-[0.95rem] font-semibold text-wine">
                    {k.total(formatEuros(selected.event.priceCents * effectiveSeats))}
                  </p>
                </div>
                {maxSeats < 2 ? <p className="mt-2 text-xs text-wine/60">{k.onlyOneLeft}</p> : null}
                <p className="mt-3 text-[0.8rem] leading-snug text-wine/65">{k.guarantee}</p>
                <button
                  type="button"
                  className={`${primaryButton} mt-3`}
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
          </div>
        </StickyBar>
      ) : null}
    </div>
  );
}
