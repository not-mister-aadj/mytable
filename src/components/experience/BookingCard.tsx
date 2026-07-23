"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Dictionary, ExperienceItem } from "@/i18n/types";
import { privacyPath, termsPath, type Locale } from "@/i18n/config";
import {
  canReserve,
  formatSpotsBadge,
  formatViewsLabel,
  getEventIdForCheckout,
  getSpotsLeft,
  getViewsThisWeek,
  shouldShowSpotsLeftBadge,
} from "@/lib/experience-booking";
import { splitDateTime } from "@/lib/experience-detail";
import { resolveFemaleOnly } from "@/lib/event-extras";
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
  clampGroupSeats,
  computeTierPrice,
  getBookingTierConfig,
  getBookingTiers,
  getLowestTierPerPersonEuros,
  GROUP_MIN_SEATS,
  maxGroupSeats,
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
  /** Cap height on desktop sticky sidebar only; mobile grows with the page. */
  fitViewport?: boolean;
  /** e.g. "Altijd op zondag · Middag" */
  scheduleNote?: string;
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

function tierSeatsDisplay(
  tier: BookingTier,
  selected: boolean,
  groupSeats: number,
  labels: Dictionary["experiencePage"]["bookingTiers"],
): string {
  if (tier === "group") {
    const seats = selected
      ? tierSeatsLabel(groupSeats, labels)
      : labels.seatsFrom.replace("{count}", String(GROUP_MIN_SEATS));
    return `${seats} · ${labels.seatsOwnTable}`;
  }
  const seats = tierSeatsLabel(getBookingTierConfig(tier).seats, labels);
  return `${seats} · ${labels.seatsJoinOthers}`;
}

function displayTierPriceForCard(
  tierPrice: BookingTierPrice,
  selectedTier: BookingTier,
  groupSeats: number,
): BookingTierPrice {
  if (tierPrice.tier === "group" && selectedTier === "group") {
    return computeTierPrice("group", groupSeats);
  }
  return tierPrice;
}

function GroupSeatsStepper({
  value,
  min,
  max,
  onChange,
  label,
  compact,
  isFemaleOnly,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  label: string;
  compact: boolean;
  isFemaleOnly: boolean;
}) {
  const btnClass = `flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
    isFemaleOnly
      ? "border-rose/30 bg-white text-rose-deep hover:border-rose hover:bg-rose/5"
      : "border-border-subtle bg-white text-wine hover:border-burgundy/35 hover:bg-burgundy/5"
  }`;

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 ${
        compact ? "py-2.5" : "py-3"
      } ${
        isFemaleOnly
          ? "border-rose/25 bg-white/80"
          : "border-border-subtle bg-white/80"
      }`}
    >
      <span className={`font-medium text-wine ${compact ? "text-xs" : "text-sm"}`}>
        {label}
      </span>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          aria-label="Minder plekken"
          className={btnClass}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          −
        </button>
        <span
          className={`min-w-[2ch] text-center font-semibold tabular-nums text-wine ${
            compact ? "text-sm" : "text-base"
          }`}
          aria-live="polite"
        >
          {value}
        </span>
        <button
          type="button"
          aria-label="Meer plekken"
          className={btnClass}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          +
        </button>
      </div>
    </div>
  );
}

function TierCard({
  tierPrice,
  labels,
  selected,
  disabled,
  compact,
  isFemaleOnly,
  groupSeats,
  selectedTier,
  onSelect,
}: {
  tierPrice: BookingTierPrice;
  labels: Dictionary["experiencePage"]["bookingTiers"];
  selected: boolean;
  disabled: boolean;
  compact: boolean;
  isFemaleOnly: boolean;
  groupSeats: number;
  selectedTier: BookingTier;
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

  const displayPrice = displayTierPriceForCard(
    tierPrice,
    selectedTier,
    groupSeats,
  );

  return (
    <label
      className={`group relative flex cursor-pointer items-center gap-3 rounded-2xl border px-4 transition-all ${
        compact ? "py-2.5" : "py-3.5"
      } ${selected ? accentRing : idleRing} ${
        disabled ? "cursor-not-allowed opacity-45" : ""
      }`}
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
          className={`flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold text-wine ${
            compact ? "text-sm" : "text-[15px]"
          }`}
        >
          {tierTitle(tierPrice.tier, labels)}
          {badge ? (
            <span
              className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.className}`}
            >
              {badge.showStar ? <span aria-hidden>★</span> : null}
              {badge.label}
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block text-xs text-wine/50">
          {tierSeatsDisplay(tierPrice.tier, selected, groupSeats, labels)}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span
          className={`block font-serif font-medium ${compact ? "text-lg" : "text-xl"} ${
            isFemaleOnly ? "text-rose-deep" : "text-burgundy"
          }`}
        >
          €{displayPrice.totalEuros}
        </span>
        <span className="mt-0.5 block text-xs text-wine/50">
          {labels.perPerson.replace("{price}", String(displayPrice.perPersonEuros))}
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
  scheduleNote,
}: BookingCardProps) {
  const { date, time } = splitDateTime(experience.dateTime);
  const isClosed = experience.status === "closed";
  const isSoldOut = !isClosed && !canReserve(experience);
  const bookingDisabled = isClosed || isSoldOut;
  const spotsLeft = getSpotsLeft(experience);
  const views = getViewsThisWeek(experience.id);
  const eventDbId = getEventIdForCheckout(experience);
  const showBookingForm = !bookingDisabled;

  const tiers = getBookingTiers();
  const tierLabels = labels.bookingTiers;

  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [tier, setTier] = useState<BookingTier>(() =>
    pickDefaultTier(tiers, spotsLeft),
  );
  const [groupSeats, setGroupSeats] = useState(GROUP_MIN_SEATS);
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

  const selectedTierPrice = computeTierPrice(
    tier,
    tier === "group" ? groupSeats : undefined,
  );
  const seats = tier === "group" ? groupSeats : getBookingTierConfig(tier).seats;
  const groupSeatsMax = maxGroupSeats(spotsLeft);
  const seatingPreference = seatingForTier(tier);
  const priceLine =
    formStep === 2
      ? tierLabels.perPerson.replace(
          "{price}",
          String(selectedTierPrice.perPersonEuros),
        )
      : tierLabels.perPersonFrom.replace(
          "{price}",
          String(getLowestTierPerPersonEuros()),
        );

  useEffect(() => {
    setFormStep(1);
    setError(null);
    setTier(pickDefaultTier(tiers, spotsLeft));
    setGroupSeats(clampGroupSeats(GROUP_MIN_SEATS, spotsLeft));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experience.id, eventDbId]);

  useEffect(() => {
    setGroupSeats((current) => clampGroupSeats(current, spotsLeft));
  }, [spotsLeft]);

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
    if (!eventDbId) {
      setError(
        locale === "nl"
          ? "Online boeken is voor dit event nog niet beschikbaar."
          : "Online booking is not available for this event yet.",
      );
      return;
    }
    if (formStep !== 2) return;
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
          ? "lg:max-h-[calc(100dvh-9.5rem-env(safe-area-inset-bottom,0px))] lg:overflow-y-auto lg:overscroll-contain lg:pb-[max(1rem,env(safe-area-inset-bottom))] lg:[-webkit-overflow-scrolling:touch]"
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
            {scheduleNote ? (
              <p className="mt-0.5 text-[10px] font-medium text-gold sm:text-[11px]">
                {scheduleNote}
              </p>
            ) : null}
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
            <dd className="text-right font-medium text-wine">
              <span className="block">{date}</span>
              {scheduleNote ? (
                <span className="mt-0.5 block text-xs font-medium text-gold">
                  {scheduleNote}
                </span>
              ) : null}
            </dd>
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

      {showBookingForm ? (
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
                      groupSeats={groupSeats}
                      selectedTier={tier}
                      onSelect={() => {
                        if (disabled) return;
                        setTier(tierPrice.tier);
                        if (tierPrice.tier === "group") {
                          setGroupSeats((current) =>
                            clampGroupSeats(current, spotsLeft),
                          );
                        }
                        trackSeatsSelected(
                          experience,
                          locale,
                          tierPrice.tier === "group"
                            ? groupSeats
                            : tierPrice.seats,
                          displayTierPriceForCard(
                            tierPrice,
                            tierPrice.tier,
                            groupSeats,
                          ).totalEuros,
                        );
                      }}
                    />
                  );
                })}
              </fieldset>
              {tier === "group" ? (
                <GroupSeatsStepper
                  value={groupSeats}
                  min={GROUP_MIN_SEATS}
                  max={groupSeatsMax}
                  label={tierLabels.groupSeatsLabel}
                  compact={compact}
                  isFemaleOnly={isFemaleOnly}
                  onChange={(next) => {
                    setGroupSeats(next);
                    trackSeatsSelected(
                      experience,
                      locale,
                      next,
                      computeTierPrice("group", next).totalEuros,
                    );
                  }}
                />
              ) : null}
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
            <div className={compact ? "space-y-3" : "space-y-3.5"}>
              <div
                className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 ${
                  isFemaleOnly
                    ? "border-rose/25 bg-white/70"
                    : "border-border-subtle bg-white/70"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-wine">
                    {tierTitle(tier, tierLabels)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-wine/55">
                    {tierSeatsLabel(seats, tierLabels)} ·{" "}
                    {tierLabels.perPerson.replace(
                      "{price}",
                      String(selectedTierPrice.perPersonEuros),
                    )}
                  </p>
                </div>
                <span
                  className={`shrink-0 font-serif text-lg font-medium ${
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
                  className={`-mt-1 mb-1 leading-snug text-wine/55 ${compact ? "text-[11px]" : "text-xs"}`}
                >
                  {labels.bookingTableLanguageHint}
                </p>
                <div className={compact ? "grid gap-2" : "grid gap-2 sm:grid-cols-2"}>
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
                        compact={true}
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
                </div>
              </fieldset>
              <label className={labelClass}>
                {labels.bookingDietary}
                <textarea
                  value={dietaryNotes}
                  onChange={(e) => setDietaryNotes(e.target.value)}
                  rows={2}
                  placeholder={labels.bookingDietaryPlaceholder}
                  className={`${choiceInputClass(compact, isFemaleOnly)} resize-none`}
                />
              </label>
              <label
                className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-3.5 py-2.5 transition-colors ${
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
                  className="text-xs leading-snug text-wine/75"
                >
                  {labels.bookingPriorityList}
                </span>
              </label>
              {error ? <p className="text-sm text-red-800">{error}</p> : null}
              <details className="rounded-xl border border-border-subtle bg-white/70 px-3.5 py-2.5">
                <summary className="cursor-pointer text-xs font-medium text-wine/75">
                  Foto’s en video’s tijdens het event
                </summary>
                <p className="mt-2 text-xs leading-relaxed text-wine/55">
                  {labels.bookingMediaConsent} {labels.bookingMediaConsentReadMore}{" "}
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
              </details>
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

      {formStep === 1 ? (
        <ul
          className={`space-y-2 border-t pt-4 mt-3 ${
            isFemaleOnly ? "border-rose/20" : "border-border-subtle"
          } ${compact ? "" : "sm:mt-6 sm:pt-6"}`}
        >
          {labels.bookingTrustBullets.map((line) => (
            <li
              key={line}
              className={`flex items-start gap-2 text-wine/70 ${
                compact ? "text-[11px] leading-snug" : "text-sm"
              }`}
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
