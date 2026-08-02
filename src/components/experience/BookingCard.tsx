"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Dictionary, ExperienceItem } from "@/i18n/types";
import { privacyPath, termsPath, clubmemberPath, type Locale } from "@/i18n/config";
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
} from "@/lib/booking-table-language";
import {
  clampTicketSeats,
  computeTierPrice,
  MIN_BOOKING_SEATS,
  maxTicketSeats,
  seatingForTier,
  tierForSeats,
} from "@/lib/booking-tiers";
import { useAuthSession } from "@/features/auth/AuthSessionContext";

interface BookingCardProps {
  experience: ExperienceItem;
  labels: Dictionary["experiencePage"];
  statusLabels: Dictionary["agenda"]["status"];
  reserveCta: string;
  locale: Locale;
  className?: string;
  /** Tighter layout - hides social proof and trust bullets. */
  compact?: boolean;
  /** Cap height on desktop sticky sidebar only; mobile grows with the page. */
  fitViewport?: boolean;
  /** e.g. "Altijd op zondag · Middag" */
  scheduleNote?: string;
  /** Active Clubmember — 10% off culinary tickets. */
  clubMemberDiscount?: boolean;
  /** Booked via post-Sunday Table group CTA. */
  fromSundayTable?: boolean;
  /** Optional ambassador code from URL. */
  affiliateCode?: string | null;
  /** Optional referral code from URL. */
  referralCode?: string | null;
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

function tierSeatsLabel(
  seats: number,
  labels: Dictionary["experiencePage"]["bookingTiers"],
): string {
  return seats === 1
    ? labels.seatOne
    : labels.seatOther.replace("{count}", String(seats));
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
  clubMemberDiscount = false,
  fromSundayTable = false,
  affiliateCode = null,
  referralCode = null,
}: BookingCardProps) {
  const { user } = useAuthSession();
  const { date, time } = splitDateTime(experience.dateTime);
  const isClosed = experience.status === "closed";
  const isSoldOut = !isClosed && !canReserve(experience);
  const bookingDisabled = isClosed || isSoldOut;
  const spotsLeft = getSpotsLeft(experience);
  const views = getViewsThisWeek(experience.id);
  const eventDbId = getEventIdForCheckout(experience);
  const showBookingForm = !bookingDisabled;

  const tierLabels = labels.bookingTiers;
  const ticketOptionsMax = maxTicketSeats(spotsLeft);
  const ticketOptionsMin = MIN_BOOKING_SEATS;
  const ticketOptionCount = Math.max(
    0,
    ticketOptionsMax - ticketOptionsMin + 1,
  );

  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [ticketCount, setTicketCount] = useState(() =>
    clampTicketSeats(MIN_BOOKING_SEATS, spotsLeft),
  );
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [joinPriorityList, setJoinPriorityList] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const isFemaleOnly = resolveFemaleOnly(
    experience.femaleOnly,
    experience.atmosphereTags,
  );

  useEffect(() => {
    if (!user) return;
    const meta = user.user_metadata as Record<string, unknown> | null;
    const metaName =
      (typeof meta?.full_name === "string" && meta.full_name.trim()) ||
      (typeof meta?.name === "string" && meta.name.trim()) ||
      "";
    setEmail((prev) => prev || user.email || "");
    setName((prev) => prev || metaName);
  }, [user]);

  const seats = clampTicketSeats(ticketCount, spotsLeft);
  const tier = tierForSeats(seats);
  const listPerPersonCents = Math.round(experience.price * 100);
  const selectedTierPrice = computeTierPrice(tier, seats, {
    clubMemberDiscount,
    perPersonCents: listPerPersonCents,
  });
  const listPerPersonEuros = Math.round(listPerPersonCents / 100);
  const seatingPreference = seatingForTier(tier);
  const priceLine = clubMemberDiscount
    ? `€${selectedTierPrice.totalEuros} · €${selectedTierPrice.perPersonEuros} p.p.`
    : `€${selectedTierPrice.totalEuros} · ${tierLabels.perPerson.replace(
        "{price}",
        String(selectedTierPrice.perPersonEuros),
      )}`;

  useEffect(() => {
    setFormStep(1);
    setError(null);
    setTicketCount(clampTicketSeats(MIN_BOOKING_SEATS, spotsLeft));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experience.id, eventDbId]);

  useEffect(() => {
    setTicketCount((current) => clampTicketSeats(current, spotsLeft));
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
    trackBookingStarted(experience, locale, "detail_page", seats, {
      ticket_quantity: seats,
      is_multi_ticket: seats > 1,
    });
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
          tableLanguagePreference: DEFAULT_TABLE_LANGUAGE_PREFERENCE,
          joinPriorityList,
          locale,
          dietaryNotes,
          fromSundayTable,
          affiliateCode: affiliateCode || undefined,
          referralCode: referralCode || undefined,
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
      {clubMemberDiscount ? (
        <p
          className={`text-xs font-medium ${
            compact ? "mt-1" : "mt-1.5"
          } ${isFemaleOnly ? "text-rose-deep/80" : "text-burgundy/80"}`}
        >
          {labels.bookingClubDiscountApplied}
          <span className="ml-1.5 text-wine/40 line-through">
            €{listPerPersonEuros} p.p.
          </span>
        </p>
      ) : (
        <p
          className={`text-xs leading-snug text-wine/60 ${
            compact ? "mt-1" : "mt-1.5"
          }`}
        >
          {labels.bookingClubDiscountPromo}{" "}
          <Link
            href={clubmemberPath(locale)}
            className={`font-medium underline decoration-current/30 underline-offset-2 transition hover:decoration-current ${
              isFemaleOnly ? "text-rose-deep" : "text-burgundy"
            }`}
          >
            {labels.bookingClubDiscountPromoLink}
          </Link>
        </p>
      )}

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
              <div>
                <label className={labelClass}>
                  {tierLabels.groupSeatsLabel}
                  <select
                    required
                    data-booking-step="1"
                    value={seats}
                    onChange={(e) => {
                      const next = clampTicketSeats(
                        Number(e.target.value),
                        spotsLeft,
                      );
                      setTicketCount(next);
                      const nextPrice = computeTierPrice(
                        tierForSeats(next),
                        next,
                        {
                          clubMemberDiscount,
                          perPersonCents: listPerPersonCents,
                        },
                      );
                      trackSeatsSelected(
                        experience,
                        locale,
                        next,
                        nextPrice.totalEuros,
                        {
                          ticket_quantity: next,
                          is_multi_ticket: next > 1,
                        },
                      );
                    }}
                    className={inputClass}
                  >
                    {Array.from({ length: ticketOptionCount }, (_, i) => {
                      const n = ticketOptionsMin + i;
                      return (
                        <option key={n} value={n}>
                          {tierSeatsLabel(n, tierLabels)}
                        </option>
                      );
                    })}
                  </select>
                </label>
                <p
                  className={`mt-1.5 leading-snug text-wine/55 ${
                    compact ? "text-[11px]" : "text-xs"
                  }`}
                >
                  {tierLabels.seatingTogetherHint}
                </p>
              </div>
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
                    {tierSeatsLabel(seats, tierLabels)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-wine/55">
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
