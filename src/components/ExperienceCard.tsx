"use client";

import { FastLink } from "@/components/ui/FastLink";
import type { Locale } from "@/i18n/config";
import type { Dictionary, ExperienceItem } from "@/i18n/types";
import { PositionedImage } from "@/components/ui/PositionedImage";
import type { AnalyticsSourceSection } from "@/lib/posthog/events";
import { trackEventCardClicked } from "@/lib/posthog/analytics";
import {
  displayAtmosphereTags,
  resolveFemaleOnly,
} from "@/lib/event-extras";
import { getSpotsLeft, formatFromPerPerson } from "@/lib/experience-booking";
import { formatAlmostFullImageHint, formatCardDateTimeLine, formatSpotsLeftHint } from "@/lib/event-display";

const statusBadgeStyles: Record<
  ExperienceItem["status"],
  string
> = {
  available:
    "bg-cream/95 text-burgundy ring-1 ring-burgundy/15 backdrop-blur-md",
  almostFull: "bg-gold text-wine shadow-sm backdrop-blur-md",
  soldOut: "bg-burgundy text-cream backdrop-blur-md",
  closed: "bg-wine/80 text-cream backdrop-blur-md",
  new: "bg-cream/90 text-burgundy ring-2 ring-gold backdrop-blur-md",
};

/** Editorial cover ratio — shorter than hero, still image-led */
const CARD_IMAGE_ASPECT = "2 / 1";

interface ExperienceCardProps {
  experience: ExperienceItem;
  statusLabels: Dictionary["experiences"]["status"];
  femaleOnlyBadge: string;
  reserveCta: string;
  viewTableCta: string;
  perPersonFromLabel: string;
  href: string;
  locale?: Locale;
  socialPromise?: string;
  sourceSection?: AnalyticsSourceSection;
  /** Hides the social-promise line on small screens (shorter cards on mobile). */
  compact?: boolean;
}

export function ExperienceCard({
  experience,
  statusLabels,
  femaleOnlyBadge,
  reserveCta: _reserveCta,
  viewTableCta,
  perPersonFromLabel,
  href,
  locale = "nl",
  sourceSection = "agenda_grid",
  socialPromise,
  compact = false,
}: ExperienceCardProps) {
  const isClosed = experience.status === "closed";
  const isSoldOut = experience.status === "soldOut";
  const isUnavailable = isSoldOut || isClosed;
  const isAlmostFull = experience.status === "almostFull";
  const isAvailable = experience.status === "available";
  const isFemaleOnly = resolveFemaleOnly(
    experience.femaleOnly,
    experience.atmosphereTags,
  );
  const visibleTags = displayAtmosphereTags(
    experience.atmosphereTags,
    experience.femaleOnly,
  );
  const cardSettings = experience.cardImageSettings;
  const cardSrc =
    cardSettings?.url ?? experience.cardImage ?? experience.image;
  const hasCardImage = Boolean(cardSrc);
  const title = experience.cardTitle ?? experience.experienceName;
  const dateTimeLine = formatCardDateTimeLine(experience.dateTime, locale);
  const spotsLeft = getSpotsLeft(experience);
  const showUrgencyHint =
    !isUnavailable &&
    spotsLeft !== null &&
    spotsLeft > 0 &&
    (isAlmostFull || (isAvailable && spotsLeft <= 15));
  const urgencyHintText = isAlmostFull
    ? formatAlmostFullImageHint(spotsLeft!, locale)
    : formatSpotsLeftHint(spotsLeft!, locale);

  function handleClick() {
    trackEventCardClicked(experience, locale, sourceSection);
  }

  return (
    <FastLink
      href={href}
      onClick={handleClick}
      className={`group flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-beige shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(43,13,18,0.1)] ${
        isFemaleOnly
          ? "border-rose/40 bg-rose-soft ring-1 ring-rose/25 hover:shadow-[0_16px_36px_rgba(157,77,111,0.14)]"
          : "border-border-subtle"
      }`}
    >
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: CARD_IMAGE_ASPECT }}
      >
        {hasCardImage ? (
          <PositionedImage
            src={cardSrc}
            alt={`${experience.city}, ${title}`}
            settings={
              cardSettings
                ? { ...cardSettings, aspectRatio: "16:10" }
                : undefined
            }
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={`object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] ${
              isSoldOut ? "opacity-75 saturate-[0.85]" : ""
            } ${isFemaleOnly ? "saturate-[1.05]" : ""}`}
          />
        ) : (
          <div className="flex h-full min-h-[120px] items-center justify-center bg-wine/5 text-xs text-wine/40">
            Afbeelding volgt
          </div>
        )}
        <div
          className={`absolute inset-0 bg-gradient-to-t transition-opacity duration-300 ${
            isFemaleOnly
              ? "from-rose-deep/30 via-rose/5 to-transparent group-hover:from-rose-deep/20"
              : "from-wine/20 via-transparent to-transparent group-hover:from-wine/12"
          }`}
        />

        {isFemaleOnly ? (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-rose px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-cream shadow-sm backdrop-blur-md sm:text-xs">
            {femaleOnlyBadge}
          </span>
        ) : null}

        {isUnavailable ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-wine/35">
            <span
              className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide sm:text-sm ${statusBadgeStyles.soldOut}`}
            >
              {statusLabels.soldOut}
            </span>
          </div>
        ) : (
          <span
            className={`absolute right-3 top-3 z-10 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide sm:text-xs ${statusBadgeStyles[experience.status]}`}
          >
            {statusLabels[experience.status]}
          </span>
        )}

        {showUrgencyHint ? (
          <p className="absolute bottom-3 left-3 z-10 max-w-[88%] text-xs font-medium leading-snug text-white drop-shadow-[0_1px_3px_rgba(43,13,18,0.65)] sm:text-sm">
            {urgencyHintText}
          </p>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5 sm:px-4 sm:pb-4 sm:pt-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 font-serif text-[1.65rem] font-medium leading-none tracking-tight text-wine sm:text-3xl">
            {experience.city}
          </h3>
          <p
            className={`shrink-0 pt-1 text-right text-[10px] font-semibold uppercase leading-tight tracking-[0.14em] sm:max-w-[38%] sm:text-[11px] ${
              isFemaleOnly ? "text-rose-deep" : "text-gold"
            }`}
          >
            {experience.category}
          </p>
        </div>

        <p className="mt-1.5 font-serif text-[0.95rem] font-medium leading-snug text-wine/70 sm:text-base">
          {title}
        </p>

        <p className="mt-1 text-sm leading-snug text-wine/55">{dateTimeLine}</p>

        {socialPromise ? (
          <p
            className={`mt-2 text-sm font-medium leading-snug ${
              compact ? "hidden sm:block" : ""
            } ${
              isFemaleOnly ? "text-rose-deep" : "text-burgundy"
            }`}
          >
            {socialPromise}
          </p>
        ) : null}

        {!socialPromise && experience.cardText ? (
          <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-wine/65">
            {experience.cardText}
          </p>
        ) : null}

        {visibleTags.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-1">
            {visibleTags.slice(0, 3).map((tag) => (
              <li
                key={tag}
                className={`rounded-full px-2 py-px text-[11px] font-medium ${
                  isFemaleOnly
                    ? "bg-rose/15 text-rose-deep"
                    : "bg-wine/8 text-wine/70"
                }`}
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-3 flex items-end justify-between gap-3">
          <p className="font-serif text-2xl font-medium leading-none text-burgundy sm:text-[1.65rem]">
            {formatFromPerPerson(experience.price, perPersonFromLabel)}
          </p>
          <span
            className={`shrink-0 text-sm font-medium transition-colors ${
              isUnavailable ? "text-wine/40" : "text-burgundy group-hover:text-wine"
            }`}
          >
            {isUnavailable
              ? statusLabels.soldOut
              : `${viewTableCta} →`}
          </span>
        </div>
      </div>
    </FastLink>
  );
}
