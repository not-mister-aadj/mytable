"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Dictionary, ExperienceItem } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import {
  canReserve,
  formatPerPerson,
  formatSpotsBadge,
  formatViewsLabel,
  getEventIdForCheckout,
  getSpotsLeft,
  getViewsThisWeek,
} from "@/lib/experience-booking";
import { splitDateTime } from "@/lib/experience-detail";
import { resolveFemaleOnly } from "@/lib/event-extras";
import { isDbEventsEnabled } from "@/lib/env";
import {
  trackBookingStarted,
  trackSeatsSelected,
} from "@/lib/posthog/analytics";
import { trackMetaInitiateCheckout } from "@/lib/analytics/metaTracking";
import { getMetaBrowserCookies, getMetaEventSourceUrl } from "@/lib/analytics/metaCookies";
import { getStoredUtm } from "@/lib/analytics/utm";
import {
  defaultSeatingForSeats,
  type SeatingPreference,
} from "@/lib/booking-seating";
import {
  DEFAULT_TABLE_LANGUAGE_PREFERENCE,
  type TableLanguagePreference,
} from "@/lib/booking-table-language";

interface BookingCardProps {
  experience: ExperienceItem;
  labels: Dictionary["experiencePage"];
  statusLabels: Dictionary["agenda"]["status"];
  reserveCta: string;
  locale: Locale;
  className?: string;
  /** Tighter layout — hides social proof and trust bullets. */
  compact?: boolean;
  /** Cap height to viewport and scroll inside the card (header + sticky bar safe area). */
  fitViewport?: boolean;
}

function radioOptionClass(
  selected: boolean,
  compact: boolean,
  isFemaleOnly: boolean,
): string {
  return `flex cursor-pointer gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
    compact ? "text-xs" : "text-sm"
  } ${
    selected
      ? isFemaleOnly
        ? "border-rose bg-rose/10"
        : "border-burgundy/40 bg-cream"
      : "border-border-subtle bg-cream/60 hover:border-burgundy/20"
  }`;
}

export function BookingCard({
  experience,
  labels,
  statusLabels,
  reserveCta,
  locale,
  className = "",
  compact = false,
  fitViewport = false,
}: BookingCardProps) {
  const { date, time } = splitDateTime(experience.dateTime);
  const isClosed = experience.status === "closed";
  const isSoldOut = !isClosed && !canReserve(experience);
  const bookingDisabled = isClosed || isSoldOut;
  const spotsLeft = getSpotsLeft(experience);
  const views = getViewsThisWeek(experience.id);
  const priceLine = formatPerPerson(experience.price, labels.perPerson);
  const eventDbId = getEventIdForCheckout(experience);
  const dbCheckoutEnabled = isDbEventsEnabled() && Boolean(eventDbId);

  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [seats, setSeats] = useState(1);
  const [seatingPreference, setSeatingPreference] = useState<SeatingPreference>(
    defaultSeatingForSeats(1),
  );
  const [tableLanguagePreference, setTableLanguagePreference] =
    useState<TableLanguagePreference>(DEFAULT_TABLE_LANGUAGE_PREFERENCE);
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const isFemaleOnly = resolveFemaleOnly(
    experience.femaleOnly,
    experience.atmosphereTags,
  );

  useEffect(() => {
    setFormStep(1);
    setError(null);
  }, [experience.id, eventDbId]);

  function validateStep1(): boolean {
    const form = formRef.current;
    if (!form) return false;
    for (const el of form.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
      '[data-booking-step="1"]',
    )) {
      if (!el.checkValidity()) {
        el.reportValidity();
        return false;
      }
    }
    return true;
  }

  function goToStep2() {
    if (!validateStep1()) return;
    setError(null);
    setFormStep(2);
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!eventDbId || formStep !== 2) return;
    setLoading(true);
    setError(null);
    trackBookingStarted(experience, locale, "detail_page", seats);
    try {
      const metaCookies = getMetaBrowserCookies();
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: eventDbId,
          email,
          name,
          seats,
          seatingPreference,
          tableLanguagePreference:
            seatingPreference === "join_others"
              ? tableLanguagePreference
              : DEFAULT_TABLE_LANGUAGE_PREFERENCE,
          locale,
          dietaryNotes,
          utm: getStoredUtm(),
          meta: {
            ...metaCookies,
            eventSourceUrl: getMetaEventSourceUrl(),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Er ging iets mis.");
        setLoading(false);
        return;
      }
      if (data.bookingId) {
        trackMetaInitiateCheckout(experience, seats, data.bookingId);
      }
      window.location.href = data.url;
    } catch {
      setError("Netwerkfout. Probeer opnieuw.");
      setLoading(false);
    }
  }

  const inputClass = `mt-1 w-full rounded-xl border border-border-subtle bg-cream px-3 ${
    compact ? "py-1.5 text-sm" : "py-2"
  }`;
  const labelClass = `block text-wine ${compact ? "text-xs" : "text-sm"}`;
  const showCardText = formStep === 1 && Boolean(experience.cardText);
  const showEventMeta = formStep === 2 || !experience.cardText;

  return (
    <motion.aside
      layout
      className={`rounded-2xl border shadow-[0_20px_50px_rgba(43,13,18,0.1)] sm:rounded-3xl ${
        compact ? "p-4" : "p-6 sm:p-7"
      } ${
        fitViewport
          ? "max-h-[calc(100dvh-9.5rem-env(safe-area-inset-bottom,0px))] overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))] [-webkit-overflow-scrolling:touch]"
          : ""
      } ${
        isFemaleOnly
          ? "border-rose/40 bg-rose-soft ring-1 ring-rose/25 shadow-[0_20px_50px_rgba(157,77,111,0.14)]"
          : "border-border-subtle bg-beige"
      } ${className}`}
    >
      <p
        className={`font-serif font-medium ${
          compact ? "text-2xl" : "text-3xl"
        } ${isFemaleOnly ? "text-rose-deep" : "text-burgundy"}`}
      >
        {priceLine}
      </p>

      {isClosed ? (
        <span
          className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-cream sm:px-3.5 sm:py-1.5 sm:text-xs ${
            compact ? "mt-2.5" : "mt-4"
          } bg-wine/80`}
        >
          {statusLabels.closed}
        </span>
      ) : spotsLeft !== null && spotsLeft > 0 ? (
        <span
          className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-cream sm:px-3.5 sm:py-1.5 sm:text-xs ${
            compact ? "mt-2.5" : "mt-4"
          } ${isFemaleOnly ? "bg-rose" : "bg-burgundy"}`}
        >
          {formatSpotsBadge(labels.spotsLeftBadge, spotsLeft)}
        </span>
      ) : (
        <span
          className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-cream sm:px-3.5 sm:py-1.5 sm:text-xs ${
            compact ? "mt-2.5" : "mt-4"
          } ${isFemaleOnly ? "bg-rose/90" : "bg-burgundy/90"}`}
        >
          {statusLabels.soldOut}
        </span>
      )}

      {isFemaleOnly ? (
        <p
          className={`font-medium leading-snug text-rose-deep ${
            compact ? "mt-1.5 text-xs" : "mt-2 text-sm"
          }`}
        >
          {labels.bookingFemaleOnlyNote}
        </p>
      ) : null}

      {showCardText ? (
        <p
          className={`line-clamp-2 text-sm text-wine/55 ${compact ? "mt-1" : "mt-2"}`}
        >
          {experience.cardText}
        </p>
      ) : null}

      {showEventMeta ? (
        compact ? (
        <div
          className={`flex flex-wrap gap-x-4 gap-y-2 border-t text-[11px] leading-snug sm:text-xs ${
            isFemaleOnly ? "border-rose/20" : "border-border-subtle"
          } ${formStep === 1 ? "mt-3 pt-3" : "mt-2 pt-2"}`}
        >
          <div>
            <p className="text-wine/50">{labels.bookingDate}</p>
            <p className="mt-0.5 font-medium text-wine">{date}</p>
          </div>
          {time ? (
            <div>
              <p className="text-wine/50">{labels.bookingTime}</p>
              <p className="mt-0.5 font-medium text-wine">{time}</p>
            </div>
          ) : null}
          <div>
            <p className="text-wine/50">{labels.bookingCity}</p>
            <p className="mt-0.5 font-medium text-wine">{experience.city}</p>
          </div>
        </div>
        ) : (
        <dl
          className={`space-y-3 border-t text-sm ${
            isFemaleOnly ? "border-rose/20" : "border-border-subtle"
          } ${formStep === 1 ? "mt-6 pt-6" : "mt-4 pt-4"}`}
        >
          <div className="flex justify-between gap-4">
            <dt className="text-wine/55">{labels.bookingDate}</dt>
            <dd className="text-right font-medium text-wine">{date}</dd>
          </div>
          {time ? (
            <div className="flex justify-between gap-4">
              <dt className="text-wine/55">{labels.bookingTime}</dt>
              <dd className="text-right font-medium text-wine">{time}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4">
            <dt className="text-wine/55">{labels.bookingCity}</dt>
            <dd className="text-right font-medium text-wine">{experience.city}</dd>
          </div>
        </dl>
        )
      ) : null}

      {views !== null && !compact && formStep === 1 ? (
        <div className="mt-5 flex items-center gap-2">
          <div className="flex -space-x-2" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-bold text-cream ${
                  isFemaleOnly
                    ? "border-rose-soft bg-gradient-to-br from-rose to-rose-deep"
                    : "border-beige bg-gradient-to-br from-burgundy/80 to-wine"
                }`}
              >
                {["S", "M", "E", "T"][i]}
              </span>
            ))}
          </div>
          <p className="text-xs text-wine/50">
            {formatViewsLabel(labels.bookingViewsLabel, views)}
          </p>
        </div>
      ) : null}

      {dbCheckoutEnabled && !bookingDisabled ? (
        <form
          ref={formRef}
          onSubmit={handleCheckout}
          className={compact ? "mt-3 space-y-2" : "mt-6 space-y-3"}
        >
          <div
            className="flex items-center gap-2"
            aria-label={`${formStep} / 2`}
          >
            <span
              className={`h-1.5 flex-1 rounded-full ${
                formStep >= 1
                  ? isFemaleOnly
                    ? "bg-rose"
                    : "bg-burgundy"
                  : "bg-wine/15"
              }`}
            />
            <span
              className={`h-1.5 flex-1 rounded-full ${
                formStep >= 2
                  ? isFemaleOnly
                    ? "bg-rose"
                    : "bg-burgundy"
                  : "bg-wine/15"
              }`}
            />
          </div>

          {formStep === 1 ? (
            <>
              <label className={labelClass}>
                {labels.bookingEmail}
                <input
                  type="email"
                  required
                  data-booking-step="1"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                {labels.bookingName}
                <input
                  type="text"
                  required
                  autoComplete="name"
                  data-booking-step="1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                {labels.bookingSpots}
                <select
                  data-booking-step="1"
                  value={seats}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setSeats(next);
                    setSeatingPreference(defaultSeatingForSeats(next));
                    trackSeatsSelected(experience, locale, next);
                  }}
                  className={inputClass}
                >
                  {Array.from(
                    { length: Math.min(spotsLeft ?? 4, 4) },
                    (_, i) => i + 1,
                  ).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={goToStep2}
                className={`w-full rounded-full px-6 font-medium text-cream ${
                  compact ? "py-2.5 text-sm" : "py-3 text-sm"
                } ${
                  isFemaleOnly
                    ? "bg-rose hover:bg-rose-deep"
                    : "bg-burgundy hover:bg-wine"
                }`}
              >
                {labels.bookingStepNext}
              </button>
            </>
          ) : (
            <>
              <fieldset className={compact ? "space-y-1.5" : "space-y-2"}>
                <legend className={labelClass.replace("block ", "")}>
                  {labels.bookingSeatingLabel}
                </legend>
                {(
                  [
                    {
                      value: "own_table" as const,
                      title: labels.bookingSeatingOwn,
                      hint: labels.bookingSeatingOwnHint,
                    },
                    {
                      value: "join_others" as const,
                      title: labels.bookingSeatingJoin,
                      hint: labels.bookingSeatingJoinHint,
                    },
                  ] as const
                ).map((option) => {
                  const selected = seatingPreference === option.value;
                  return (
                    <label
                      key={option.value}
                      className={radioOptionClass(
                        selected,
                        compact,
                        isFemaleOnly,
                      )}
                    >
                      <input
                        type="radio"
                        name="seatingPreference"
                        value={option.value}
                        checked={selected}
                        onChange={() => setSeatingPreference(option.value)}
                        className="mt-0.5 shrink-0 accent-burgundy"
                        required
                      />
                      <span className="min-w-0">
                        <span className="block font-medium text-wine">
                          {option.title}
                        </span>
                        {!compact ? (
                          <span className="mt-0.5 block text-xs leading-snug text-wine/55">
                            {option.hint}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  );
                })}
              </fieldset>
              {seatingPreference === "join_others" ? (
                <fieldset className={compact ? "space-y-1.5" : "space-y-2"}>
                  <legend className={labelClass.replace("block ", "")}>
                    {labels.bookingTableLanguageLabel}
                  </legend>
                  {(
                    [
                      {
                        value: "both_fine" as const,
                        title: labels.bookingTableLanguageBoth,
                      },
                      {
                        value: "prefer_dutch" as const,
                        title: labels.bookingTableLanguagePreferDutch,
                      },
                    ] as const
                  ).map((option) => {
                    const selected = tableLanguagePreference === option.value;
                    return (
                      <label
                        key={option.value}
                        className={radioOptionClass(
                          selected,
                          compact,
                          isFemaleOnly,
                        )}
                      >
                        <input
                          type="radio"
                          name="tableLanguagePreference"
                          value={option.value}
                          checked={selected}
                          onChange={() =>
                            setTableLanguagePreference(option.value)
                          }
                          className="mt-0.5 shrink-0 accent-burgundy"
                          required
                        />
                        <span className="min-w-0 font-medium text-wine">
                          {option.title}
                        </span>
                      </label>
                    );
                  })}
                </fieldset>
              ) : null}
              <label className={labelClass}>
                {labels.bookingDietary}
                <textarea
                  value={dietaryNotes}
                  onChange={(e) => setDietaryNotes(e.target.value)}
                  rows={compact ? 1 : 2}
                  className={`mt-1 w-full rounded-xl border border-border-subtle bg-cream px-3 ${
                    compact
                      ? "min-h-[2.25rem] resize-none py-1.5 text-sm"
                      : "py-2"
                  }`}
                />
              </label>
              {error ? <p className="text-sm text-red-800">{error}</p> : null}
              <button
                type="submit"
                disabled={loading}
                className={`w-full rounded-full px-6 font-medium text-cream disabled:opacity-50 ${
                  compact ? "py-2.5 text-sm" : "py-3 text-sm"
                } ${
                  isFemaleOnly
                    ? "bg-rose hover:bg-rose-deep"
                    : "bg-burgundy hover:bg-wine"
                }`}
              >
                {loading ? "Doorsturen…" : reserveCta}
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setFormStep(1);
                }}
                disabled={loading}
                className={`w-full text-center text-sm text-wine/55 underline hover:text-wine disabled:opacity-50 ${
                  compact ? "py-0.5" : "py-1"
                }`}
              >
                {labels.bookingStepBack}
              </button>
            </>
          )}
        </form>
      ) : (
        <a
          href="#newsletter"
          className={`flex w-full items-center justify-center rounded-full px-6 font-medium text-cream ${
            compact ? "mt-3 py-2.5 text-sm" : "mt-6 py-3 text-sm"
          } ${
            isFemaleOnly ? "bg-rose hover:bg-rose-deep" : "bg-burgundy"
          } ${bookingDisabled ? "pointer-events-none opacity-50" : ""}`}
        >
          {isClosed ? labels.closedCta : reserveCta}
        </a>
      )}

      {!compact && formStep === 1 ? (
        <ul
          className={`mt-6 space-y-2.5 border-t pt-6 ${
            isFemaleOnly ? "border-rose/20" : "border-border-subtle"
          }`}
        >
          {labels.bookingTrustBullets.map((line) => (
            <li
              key={line}
              className="flex items-start gap-2 text-sm text-wine/70"
            >
              <span
                className={`mt-0.5 ${isFemaleOnly ? "text-rose-deep" : "text-gold"}`}
                aria-hidden
              >
                ✓
              </span>
              {line}
            </li>
          ))}
        </ul>
      ) : null}
    </motion.aside>
  );
}
