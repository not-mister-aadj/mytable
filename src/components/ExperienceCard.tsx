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
import { getSpotsLeft } from "@/lib/experience-booking";
import {
  formatAlmostFullImageHint,
  formatCardDateTimeLine,
  formatSpotsLeftHint,
} from "@/lib/event-display";

interface ExperienceCardProps {
  experience: ExperienceItem;
  statusLabels: Dictionary["experiences"]["status"];
  femaleOnlyBadge: string;
  reserveCta: string;
  viewTableCta: string;
  joinIndividuallyCta?: string;
  perPersonFromLabel: string;
  href: string;
  locale?: Locale;
  socialPromise?: string;
  sourceSection?: AnalyticsSourceSection;
  /** Hides the social-promise line on small screens (shorter cards on mobile). */
  compact?: boolean;
}

function cardCategoryLine(experience: ExperienceItem, tags: string[]): string {
  if (experience.experienceName.length <= 24) {
    return experience.experienceName;
  }
  if (tags.length > 0) return tags[0]!;
  if (experience.experienceType) return experience.experienceType;
  return experience.category;
}

export function ExperienceCard({
  experience,
  statusLabels,
  femaleOnlyBadge,
  reserveCta: _reserveCta,
  viewTableCta: _viewTableCta,
  joinIndividuallyCta: _joinIndividuallyCta,
  perPersonFromLabel: _perPersonFromLabel,
  href,
  locale = "nl",
  sourceSection = "agenda_grid",
  socialPromise: _socialPromise,
  compact: _compact = false,
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
  const headline = experience.city;
  const categoryLine = cardCategoryLine(experience, visibleTags);
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
      className="group relative block aspect-[16/10] overflow-hidden rounded-[1.5rem] border border-wine/10 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(43,13,18,0.1)] sm:aspect-[4/3] sm:rounded-[1.75rem]"
    >
      {hasCardImage ? (
        <PositionedImage
          src={cardSrc}
          alt={`${experience.city}, ${experience.experienceName}`}
          settings={
            cardSettings
              ? { ...cardSettings, aspectRatio: "16:10" }
              : undefined
          }
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className={`object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] ${
            isUnavailable ? "opacity-75 saturate-[0.65]" : ""
          }`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-wine/10 text-xs text-wine/40">
          Afbeelding volgt
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-wine/85 via-wine/30 to-wine/5" />

      {isUnavailable ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <span className="rounded-full bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-wine shadow-sm sm:text-sm">
            {statusLabels.soldOut}
          </span>
        </div>
      ) : null}

      {isFemaleOnly && !isUnavailable ? (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-[#f3d4de] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-wine sm:text-[11px]">
          {femaleOnlyBadge}
        </span>
      ) : null}

      {showUrgencyHint ? (
        <span
          className={`absolute z-10 rounded-full bg-gold/95 px-2 py-0.5 text-[9px] font-semibold text-wine shadow-sm sm:text-[10px] ${
            isFemaleOnly ? "left-3 top-11" : "left-3 top-3"
          }`}
        >
          {urgencyHintText}
        </span>
      ) : null}

      {!isUnavailable && !showUrgencyHint && !isFemaleOnly && experience.status === "new" ? (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-cream/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-burgundy shadow-sm sm:text-[11px]">
          {statusLabels.new}
        </span>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-cream/60 sm:text-[11px]">
            {categoryLine}
          </p>
          <h3 className="mt-1 font-serif text-2xl font-medium leading-tight tracking-tight text-cream sm:text-[1.75rem]">
            {headline}
          </h3>
          <p className="mt-1 text-sm leading-snug text-cream/85 sm:text-[0.95rem]">
            {dateTimeLine}
          </p>
        </div>

        <span
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg leading-none transition group-hover:scale-105 sm:h-12 sm:w-12 ${
            isUnavailable
              ? "bg-wine/50 text-cream/60"
              : "bg-burgundy text-cream group-hover:bg-wine"
          }`}
          aria-hidden
        >
          ›
        </span>
      </div>
    </FastLink>
  );
}
