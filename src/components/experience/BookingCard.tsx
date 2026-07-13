"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Dictionary, ExperienceItem } from "@/i18n/types";
import { privacyPath, termsPath, type Locale } from "@/i18n/config";
import {
  canReserve,
  formatPerPerson,
  formatSpotsBadge,
  formatViewsLabel,
  getEventIdForCheckout,
  getSpotsLeft,
  getViewsThisWeek,
  shouldShowSpotsLeftBadge,
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
  DEFAULT_TABLE_LANGUAGE_PREFERENCE,
  type TableLanguagePreference,
} from "@/lib/booking-table-language";
import {
  computeTierPrice,
  getBookingTierConfig,
  getBookingTiers,
  seatingForTier,
  type BookingTier,
  type BookingTierPrice,
} from "@/lib/booking-tiers";

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

function choiceLegendClass(compact: boolean): string {
  return `mb-2.5 block font-semibold text-wine ${
    compact ? "text-xs" : "text-sm"
  }`;
}

function choiceInputClass(compact: boolean, isFemaleOnly: boolean): string {
  return `mt-1.5 w-full rounded-xl border bg-white px-3.5 shadow-sm transition-colors placeholder:text-wine/35 focus:outline-none focus:ring-2 ${
    compact ? "py-2 text-sm" : "py-2.5"
  } ${
    isFemaleOnly
      ? "border-rose/25 focus:border-rose focus:ring-rose/15"
      : "border-border-subtle focus:border-burgundy/40 focus:ring-burgundy/10"
  }`;
}

function BookingChoiceOption({
  selected,
  compact,
  isFemaleOnly,
  children,
  ...inputProps
}: {
  selected: boolean;
  compact: boolean;
  isFemaleOnly: boolean;
  children: React.ReactNode;
} & React.ComponentPropsWithoutRef<"input">) {
  return (
    <label
      className={`group flex cursor-pointer items-start gap-3 rounded-2xl border px-4 transition-all ${
        compact ? "py-2.5 text-xs" : "py-3.5 text-sm"
      } ${
        selected
          ? isFemaleOnly
            ? "border-rose bg-white shadow-[0_2px_14px_rgba(157,77,111,0.14)] ring-1 ring-rose/35"
            : "border-burgundy/45 bg-white shadow-sm ring-1 ring-burgundy/20"
          : isFemaleOnly
            ? "border-rose/20 bg-white/75 hover:border-rose/35 hover:bg-white"
            : "border-border-subtle bg-white/85 hover:border-burgundy/25 hover:bg-white"
      }`}
    >
      <input type="radio" className="sr-only" {...inputProps} />
      <span
        className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          selected
            ? isFemaleOnly
              ? "border-rose bg-rose"
              : "border-burgundy bg-burgundy"
            : isFemaleOnly
              ? "border-rose/30 bg-white group-hover:border-rose/45"
              : "border-wine/20 bg-white group-hover:border-burgundy/35"
        }`}
        aria-hidden
      >
        {selected ? (
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
        ) : null}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </label>
  );
}

function tierFitsSpots(tier: BookingTierPrice, spotsLeft: number | null): boolean {
  return spotsLeft === null || spotsLeft >= tier.seats;
}

/** Default to solo (smallest), falling back to the first tier that still fits. */
function pickDefaultTier(
  tiers: BookingTierPrice[],
  spotsLeft: number | null,
): BookingTier {
  const fitting = tiers.filter((t) => tierFitsSpots(t, spotsLeft));
  const pool = fitting.length > 0 ? fitting : tiers;
  return (pool[0] ?? tiers[0]).tier;
}

function tierTitle(
  tier: BookingTier,
  labels: Dictionary["experiencePage"]["bookingTiers"],
): string {
  if (tier === "solo") return labels.soloTitle;
  if (tier === "duo") return labels.duoTitle;
  return labels.groupTitle;
}

function tierCta(
  tier: BookingTier,
  labels: Dictionary["experiencePage"]["bookingTiers"],
): string {
  if (tier === "solo") return labels.soloCta;
  if (tier === "duo") return labels.duoCta;
  return labels.groupCta;
}

function tierSeatsLabel(
  seats: number,
  labels: Dictionary["experiencePage"]["bookingTiers"],
): string {
  return seats === 1
    ? labels.seatOne
    : labels.seatOther.replace("{count}", String(seats));
}

function TierCard({
  tierPrice,
  labels,
  selected,
  disabled,
  compact,
  isFemaleOnly,
  onSelect,
}: {
  tierPrice: BookingTierPrice;
  labels: Dictionary["experiencePage"]["bookingTiers"];
  selected: boolean;
  disabled: boolean;
  compact: boolean;
  isFemaleOnly: boolean;
  onSelect: () => void;
}) {
  const accentRing = isFemaleOnly
    ? "border-rose bg-white ring-1 ring-rose/35 shadow-[0_4px_18px_rgba(157,77,111,0.16)]"
    : "border-burgundy/45 bg-white ring-1 ring-burgundy/20 shadow-[0_4px_18px_rgba(43,13,18,0.1)]";
  const idleRing = isFemaleOnly
    ? "border-rose/20 bg-white/70 hover:border-rose/40 hover:bg-white"
    : "border-border-subtle bg-white/80 hover:border-burgundy/30 hover:bg-white";
  const dotOn = isFemaleOnly ? "border-rose bg-rose" : "border-burgundy bg-burgundy";
  const dotOff = isFemaleOnly
    ? "border-rose/30 bg-white group-hover:border-rose/45"
    : "border-wine/20 bg-white group-hover:border-burgundy/35";

  const badge = tierPrice.isBestValue
    ? {
        label: labels.bestValue,
        showStar: true,
        className: isFemaleOnly ? "bg-rose text-cream" : "bg-gold text-wine",
      }
    : tierPrice.isMostChosen
      ? {
          label: labels.mostChosen,
          showStar: false,
          className: isFemaleOnly
            ? "bg-rose-soft text-rose-deep ring-1 ring-rose/30"
            : "bg-beige text-wine ring-1 ring-border-subtle",
        }
      : null;

  return (
    <label
      className={`group relative flex cursor-pointer items-center gap-3 rounded-2xl border px-4 transition-all ${
        compact ? "py-2.5" : "py-3.5"
      } ${selected ? accentRing : idleRing} ${
        disabled ? "cursor-not-allowed opacity-45" : ""
      } ${badge ? "mt-1.5" : ""}`}
    >
      <input
        type="radio"
        name="pricingTier"
        className="sr-only"
        value={tierPrice.tier}
        checked={selected}
        disabled={disabled}
        onChange={onSelect}
      />
      {badge ? (
        <span
          className={`absolute -top-2.5 right-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.className}`}
        >
          {badge.showStar ? <span aria-hidden>★</span> : null}
          {badge.label}
        </span>
      ) : null}
      <span
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          selected ? dotOn : dotOff
        }`}
        aria-hidden
      >
        {selected ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block font-semibold text-wine ${compact ? "text-sm" : "text-[15px]"}`}
        >
          {tierTitle(tierPrice.tier, labels)}
        </span>
        <span className="mt-0.5 block text-xs text-wine/50">
          {tierSeatsLabel(tierPrice.seats, labels)}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span
          className={`block font-serif font-medium ${compact ? "text-lg" : "text-xl"} ${
            isFemaleOnly ? "text-rose-deep" : "text-burgundy"
          }`}
        >
          €{tierPrice.totalEuros}
        </span>
        <span className="mt-0.5 block text-xs text-wine/50">
          {labels.perPerson.replace("{price}", String(tierPrice.perPersonEuros))}
        </span>
      </span>
    </label>
  );
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

  const basePriceCents = Math.round(experience.price * 100);
  const tiers = getBookingTiers(basePriceCents);
  const tierLabels = labels.bookingTiers;

  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [tier, setTier] = useState<BookingTier>(() =>
    pickDefaultTier(tiers, spotsLeft),
  );
  const [tableLanguagePreference, setTableLanguagePreference] =
    useState<TableLanguagePreference>(DEFAULT_TABLE_LANGUAGE_PREFERENCE);
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [joinPriorityList, setJoinPriorityList] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const isFemaleOnly = resolveFemaleOnly(
    experience.femaleOnly,
    experience.atmosphereTags,
  );

  const selectedTierPrice = computeTierPrice(basePriceCents, tier);
  const seats = getBookingTierConfig(tier).seats;
  const seatingPreference = seatingForTier(tier);

  useEffect(() => {
    setFormStep(1);
    setError(null);
    setTier(pickDefaultTier(tiers, spotsLeft));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          pricingTier: tier,
          seatingPreference,
          tableLanguagePreference,
          joinPriorityList,
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
        trackMetaInitiateCheckout(
          experience,
          seats,
          data.bookingId,
          selectedTierPrice.totalEuros,
        );
      }
      window.location.href = data.url;
    } catch {
      setError("Netwerkfout. Probeer opnieuw.");
      setLoading(false);
    }
  }

  const inputClass = `mt-1.5 w-full rounded-xl border bg-white px-3.5 shadow-sm transition-colors focus:outline-none focus:ring-2 ${
    compact ? "py-2 text-sm" : "py-2.5"
  } ${
    isFemaleOnly
      ? "border-rose/25 focus:border-rose focus:ring-rose/15"
      : "border-border-subtle focus:border-burgundy/40 focus:ring-burgundy/10"
  }`;
  const labelClass = `block font-medium text-wine ${
    compact ? "text-xs" : "text-sm"
  }`;
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

      {isClosed || isSoldOut ? (
        <span
          className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-cream sm:px-3.5 sm:py-1.5 sm:text-xs ${
            compact ? "mt-2.5" : "mt-4"
          } ${isFemaleOnly ? "bg-rose/90" : "bg-burgundy/90"}`}
        >
          {statusLabels.soldOut}
        </span>
      ) : shouldShowSpotsLeftBadge(spotsLeft) ? (
        <span
          className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-cream sm:px-3.5 sm:py-1.5 sm:text-xs ${
            compact ? "mt-2.5" : "mt-4"
          } ${isFemaleOnly ? "bg-rose" : "bg-burgundy"}`}
        >
          {formatSpotsBadge(labels.spotsLeftBadge, spotsLeft)}
        </span>
      ) : spotsLeft !== null && spotsLeft > 0 ? null : (
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
              <fieldset className={compact ? "space-y-2" : "space-y-2.5"}>
                <legend className={choiceLegendClass(compact)}>
                  {tierLabels.legend}
                </legend>
                {tiers.map((tierPrice) => {
                  const disabled = !tierFitsSpots(tierPrice, spotsLeft);
                  return (
                    <TierCard
                      key={tierPrice.tier}
                      tierPrice={tierPrice}
                      labels={tierLabels}
                      selected={tier === tierPrice.tier}
                      disabled={disabled}
                      compact={compact}
                      isFemaleOnly={isFemaleOnly}
                      onSelect={() => {
                        if (disabled) return;
                        setTier(tierPrice.tier);
                        trackSeatsSelected(
                          experience,
                          locale,
                          tierPrice.seats,
                          tierPrice.totalEuros,
                        );
                      }}
                    />
                  );
                })}
              </fieldset>
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
            <div className={compact ? "space-y-4" : "space-y-5"}>
              <div
                className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
                  isFemaleOnly
                    ? "border-rose/25 bg-white/70"
                    : "border-border-subtle bg-white/70"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-wine">
                    {tierTitle(tier, tierLabels)}
                  </p>
                  <p className="mt-0.5 text-xs text-wine/55">
                    {tierSeatsLabel(seats, tierLabels)} ·{" "}
                    {tierLabels.perPerson.replace(
                      "{price}",
                      String(selectedTierPrice.perPersonEuros),
                    )}
                  </p>
                </div>
                <span
                  className={`shrink-0 font-serif text-xl font-medium ${
                    isFemaleOnly ? "text-rose-deep" : "text-burgundy"
                  }`}
                >
                  €{selectedTierPrice.totalEuros}
                </span>
              </div>
              <fieldset className={compact ? "space-y-2" : "space-y-2.5"}>
                <legend className={choiceLegendClass(compact)}>
                  {labels.bookingTableLanguageLabel}
                </legend>
                <p
                  className={`-mt-1 mb-1 leading-relaxed text-wine/55 ${
                    compact ? "text-[11px]" : "text-xs"
                  }`}
                >
                  {labels.bookingTableLanguageHint}
                </p>
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
                      <BookingChoiceOption
                        key={option.value}
                        selected={selected}
                        compact={compact}
                        isFemaleOnly={isFemaleOnly}
                        name="tableLanguagePreference"
                        value={option.value}
                        checked={selected}
                        onChange={() =>
                          setTableLanguagePreference(option.value)
                        }
                        required
                      >
                        <span className="font-medium text-wine">
                          {option.title}
                        </span>
                      </BookingChoiceOption>
                    );
                  })}
              </fieldset>
              <label className={labelClass}>
                {labels.bookingDietary}
                <textarea
                  value={dietaryNotes}
                  onChange={(e) => setDietaryNotes(e.target.value)}
                  rows={compact ? 2 : 3}
                  placeholder={labels.bookingDietaryPlaceholder}
                  className={`${choiceInputClass(compact, isFemaleOnly)} resize-none`}
                />
              </label>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 transition-colors ${
                  compact ? "py-2.5" : "py-3"
                } ${
                  joinPriorityList
                    ? isFemaleOnly
                      ? "border-rose/40 bg-white"
                      : "border-burgundy/30 bg-white"
                    : isFemaleOnly
                      ? "border-rose/20 bg-white/70"
                      : "border-border-subtle bg-white/70"
                }`}
              >
                <input
                  type="checkbox"
                  checked={joinPriorityList}
                  onChange={(e) => setJoinPriorityList(e.target.checked)}
                  className={`mt-0.5 h-[18px] w-[18px] shrink-0 rounded ${
                    isFemaleOnly ? "accent-rose" : "accent-burgundy"
                  }`}
                />
                <span
                  className={`leading-relaxed text-wine/75 ${
                    compact ? "text-[11px]" : "text-xs"
                  }`}
                >
                  {labels.bookingPriorityList}
                </span>
              </label>
              {error ? <p className="text-sm text-red-800">{error}</p> : null}
              <p
                className={`leading-relaxed text-wine/55 ${
                  compact ? "text-[11px]" : "text-xs"
                }`}
              >
                {labels.bookingMediaConsent}{" "}
                {labels.bookingMediaConsentReadMore}{" "}
                <Link
                  href={termsPath(locale)}
                  className="text-wine/70 underline-offset-2 hover:text-wine hover:underline"
                >
                  {labels.bookingMediaConsentTerms}
                </Link>{" "}
                {labels.bookingMediaConsentAnd}{" "}
                <Link
                  href={privacyPath(locale)}
                  className="text-wine/70 underline-offset-2 hover:text-wine hover:underline"
                >
                  {labels.bookingMediaConsentPrivacy}
                </Link>
                .
              </p>
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
                {loading ? "Doorsturen…" : tierCta(tier, tierLabels)}
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
            </div>
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
