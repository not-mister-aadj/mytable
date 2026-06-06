"use client";

import Link from "next/link";
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
import { formatAlmostFullImageHint } from "@/lib/event-display";

const statusBadgeStyles: Record<
  ExperienceItem["status"],
  string
> = {
  available:
    "bg-cream/95 text-burgundy ring-1 ring-burgundy/15 backdrop-blur-md",
  almostFull: "bg-gold text-wine shadow-sm backdrop-blur-md",
  soldOut: "bg-burgundy text-cream backdrop-blur-md",
  new: "bg-cream/90 text-burgundy ring-2 ring-gold backdrop-blur-md",
};

interface ExperienceCardProps {
  experience: ExperienceItem;
  statusLabels: Dictionary["experiences"]["status"];
  femaleOnlyBadge: string;
  reserveCta: string;
  viewTableCta: string;
  href: string;
  locale?: Locale;
  sourceSection?: AnalyticsSourceSection;
}

export function ExperienceCard({
  experience,
  statusLabels,
  femaleOnlyBadge,
  reserveCta: _reserveCta,
  viewTableCta,
  href,
  locale = "nl",
  sourceSection = "agenda_grid",
}: ExperienceCardProps) {
  const isSoldOut = experience.status === "soldOut";
  const isAlmostFull = experience.status === "almostFull";
  const spotsLeft = getSpotsLeft(experience);
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

  function handleClick() {
    trackEventCardClicked(experience, locale, sourceSection);
  }

  return (
    <Link
      href={href}
      prefetch={true}
      onClick={handleClick}
      className={`group flex cursor-pointer flex-col overflow-hidden rounded-3xl border bg-beige shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_44px_rgba(43,13,18,0.12)] ${
        isFemaleOnly
          ? "border-rose/40 bg-rose-soft ring-1 ring-rose/25 hover:shadow-[0_22px_44px_rgba(157,77,111,0.18)]"
          : "border-border-subtle"
      }`}
    >
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: cardSettings?.aspectRatio?.replace(":", " / ") ?? "16 / 10" }}
      >
        {hasCardImage ? (
          <PositionedImage
            src={cardSrc}
            alt={`${experience.cardTitle ?? experience.experienceName}, ${experience.city}`}
            settings={cardSettings}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={`object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] ${
              isSoldOut ? "opacity-75 saturate-[0.85]" : ""
            } ${isFemaleOnly ? "saturate-[1.05]" : ""}`}
          />
        ) : (
          <div className="flex h-full min-h-[160px] items-center justify-center bg-wine/5 text-sm text-wine/40">
            Afbeelding volgt
          </div>
        )}
        <div
          className={`absolute inset-0 bg-gradient-to-t transition-opacity duration-300 ${
            isFemaleOnly
              ? "from-rose-deep/35 via-rose/10 to-rose-soft/20 group-hover:from-rose-deep/25"
              : "from-wine/25 via-transparent to-wine/5 group-hover:from-wine/15"
          }`}
        />

        {isFemaleOnly ? (
          <span className="absolute left-4 top-4 z-10 rounded-full bg-rose px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-cream shadow-sm backdrop-blur-md sm:text-sm">
            {femaleOnlyBadge}
          </span>
        ) : null}

        {isSoldOut ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-wine/35">
            <span
              className={`rounded-full px-5 py-2.5 text-sm font-bold uppercase tracking-wide sm:text-base ${statusBadgeStyles.soldOut}`}
            >
              {statusLabels.soldOut}
            </span>
          </div>
        ) : (
          <span
            className={`absolute right-4 top-4 z-10 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide sm:text-sm ${statusBadgeStyles[experience.status]}`}
          >
            {statusLabels[experience.status]}
          </span>
        )}

        {isAlmostFull && spotsLeft !== null && spotsLeft > 0 ? (
          <p className="absolute bottom-4 left-4 z-10 max-w-[90%] text-sm font-medium leading-snug text-white drop-shadow-[0_1px_3px_rgba(43,13,18,0.65)] sm:text-[15px]">
            {formatAlmostFullImageHint(spotsLeft, locale)}
          </p>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p
          className={`text-[10px] font-semibold uppercase tracking-[0.2em] sm:text-xs ${
            isFemaleOnly ? "text-rose-deep" : "text-gold"
          }`}
        >
          {experience.category}
        </p>

        <h3 className="mt-2 font-serif text-3xl font-medium leading-none tracking-tight text-wine sm:text-4xl">
          {experience.city}
        </h3>

        <p className="mt-2 text-base font-medium text-wine/80 sm:text-lg">
          {experience.cardTitle ?? experience.experienceName}
        </p>

        {experience.cardText ? (
          <p className="mt-2 text-sm leading-relaxed text-wine/65 line-clamp-2">
            {experience.cardText}
          </p>
        ) : null}

        {visibleTags.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {visibleTags.map((tag) => (
              <li
                key={tag}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
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

        <p className="mt-3 text-sm text-wine/60">{experience.dateTime}</p>

        <div className="mt-5 flex items-end justify-between gap-4 border-t border-border-subtle pt-5">
          <p className="font-serif text-3xl font-medium leading-none text-burgundy">
            €{experience.price}
          </p>
          <span
            className={`shrink-0 text-sm font-medium transition-colors ${
              isSoldOut ? "text-wine/40" : "text-burgundy group-hover:text-wine"
            }`}
          >
            {isSoldOut ? statusLabels.soldOut : viewTableCta}
          </span>
        </div>
      </div>
    </Link>
  );
}
