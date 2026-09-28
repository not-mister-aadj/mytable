"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import {
  SundayTableBookingCard,
  type EnglishComingSoonLabels,
} from "@/components/sunday-table-lp/SundayTableBookingCard";
import { SundayTableNotifyMeForm } from "@/components/sunday-table-lp/SundayTableNotifyMeForm";
import { TestimonialMarquee } from "@/components/TestimonialMarquee";
import { SundayTableSectionNav } from "@/components/sunday-table-lp/SundayTableSectionNav";
import {
  SundayTableDaySteps,
  SundayTableHighlights,
  SundayTableVenueAbout,
  type DateHighlights,
  type DaySteps,
  type VenueAbout,
} from "@/components/sunday-table-lp/SundayTableDateDetails";
import { getBrandLandingTestimonialRows } from "@/data/brand-landing-testimonials";
import { trackGroupInvitationShared } from "@/lib/posthog/analytics";

interface HeroImage {
  src: string;
  alt: string;
  /** Tailwind object-position class; defaults to object-center. */
  position?: string;
}

interface SundayTableEventRevealProps {
  locale: Locale;
  dateLabel: string;
  timeLabel: string;
  venueName: string;
  address: string;
  heroImages: HeroImage[];
  intro: string;
  eyebrow: string;
  detailsLabel: string;
  dateFieldLabel: string;
  venueFieldLabel: string;
  shareUrl: string;
  shareLabel: string;
  shareCopiedLabel: string;
  shareTitle: string;
  /** Short badges shown right under the venue name, e.g. the age bracket
   * and "Mixed". Kept separate from the eyebrow since those need to be
   * unmistakable at a glance, not read out of a small caption line. */
  tags: string[];
  statsEyebrow: string;
  statsTitle: string;
  stats: { value: string; label: string }[];
  faqEyebrow: string;
  faqTitle: string;
  faqItems: { question: string; answer: string }[];
  eventId: string;
  spotsLeft: number;
  /** False until enough real tickets have sold. Hides the numeric count in
   * favor of a neutral "available" badge (see hasEnoughSoldToShowSpots). */
  showSpotsCount: boolean;
  pricePerSeatEuros: number;
  /** Venue is still being finalized: shows the page but replaces the
   * booking form with an announcement instead of taking payments. */
  comingSoon?: boolean;
  ticketsLeftLabel: string;
  availableChipLabel: string;
  soldOutChipLabel: string;
  comingSoonChipLabel: string;
  comingSoonTitle: string;
  comingSoonBody: string;
  comingSoonEmailLabel: string;
  comingSoonSubmitLabel: string;
  comingSoonSuccessLabel: string;
  comingSoonErrorLabel: string;
  bookingEmailLabel: string;
  bookingNameLabel: string;
  bookingSeatsLabel: string;
  bookingSeatOneLabel: string;
  bookingSeatTwoLabel: string;
  bookingLanguageLabel: string;
  bookingLanguageDutchLabel: string;
  bookingLanguageEnglishLabel: string;
  bookingLanguageBothLabel: string;
  bookingCtaLabel: string;
  bookingCtaLabelPlural: string;
  bookingSoldOutLabel: string;
  bookingGuarantees: string[];
  bookingErrorLabel: string;
  /** "per plek" / "per seat", next to the price. */
  perSeatLabel: string;
  /** City of this table ("Rotterdam"), for the English-table sign-up. */
  cityName: string;
  englishComingSoon: EnglishComingSoonLabels;
  /** Google rating of the venue, only for venues we have a verified rating for. */
  googleRating?: { score: string; label: string; href: string } | null;
  /** Photo cards: why this will be a good Sunday. */
  highlights: DateHighlights;
  /** What the afternoon itself looks like, in three steps. */
  daySteps: DaySteps;
  /** Story and practical details of the venue; null while it is unknown. */
  venueAbout?: VenueAbout | null;
  /** One line under the price: what the ticket includes. */
  includedLine: string;
  /** Labels for the sticky tab bar. */
  sectionNavLabels: {
    overview: string;
    highlights: string;
    howItWorks: string;
    venue: string;
    reviews: string;
    faq: string;
    share: string;
    copied: string;
  };
}

export function SundayTableEventReveal({
  locale,
  dateLabel,
  timeLabel,
  venueName,
  address,
  heroImages,
  intro,
  eyebrow,
  detailsLabel,
  dateFieldLabel,
  venueFieldLabel,
  shareUrl,
  shareLabel,
  shareCopiedLabel,
  shareTitle,
  tags,
  statsEyebrow,
  statsTitle,
  stats,
  faqEyebrow,
  faqTitle,
  faqItems,
  eventId,
  spotsLeft,
  showSpotsCount,
  pricePerSeatEuros,
  comingSoon = false,
  ticketsLeftLabel,
  availableChipLabel,
  soldOutChipLabel,
  comingSoonChipLabel,
  comingSoonTitle,
  comingSoonBody,
  comingSoonEmailLabel,
  comingSoonSubmitLabel,
  comingSoonSuccessLabel,
  comingSoonErrorLabel,
  bookingEmailLabel,
  bookingNameLabel,
  bookingSeatsLabel,
  bookingSeatOneLabel,
  bookingSeatTwoLabel,
  bookingLanguageLabel,
  bookingLanguageDutchLabel,
  bookingLanguageEnglishLabel,
  bookingLanguageBothLabel,
  bookingCtaLabel,
  bookingCtaLabelPlural,
  bookingSoldOutLabel,
  bookingGuarantees,
  bookingErrorLabel,
  perSeatLabel,
  cityName,
  englishComingSoon,
  googleRating = null,
  highlights,
  daySteps,
  venueAbout = null,
  includedLine,
  sectionNavLabels,
}: SundayTableEventRevealProps) {
  const [shareCopied, setShareCopied] = useState(false);
  const [slide, setSlide] = useState(0);
  const activeImage = heroImages[slide] ?? heroImages[0];
  const { people } = getBrandLandingTestimonialRows(locale);
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${venueName}, ${address}`,
  )}`;

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl });
        trackGroupInvitationShared({
          channel: "web_share_api",
          source: "sunday_table_event_reveal",
          locale,
        });
      } catch {
        // user cancelled the native share sheet
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      trackGroupInvitationShared({
        channel: "copy_link",
        source: "sunday_table_event_reveal",
        locale,
      });
      window.setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // ignore clipboard failures
    }
  }

  const bookingPanelRef = useRef<HTMLDivElement>(null);
  const [bookingPanelVisible, setBookingPanelVisible] = useState(false);
  const soldOut = !comingSoon && spotsLeft === 0;

  // The mobile bar only points at the booking form, so hide it while that
  // form is already on screen instead of covering it.
  useEffect(() => {
    const panel = bookingPanelRef.current;
    if (!panel || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setBookingPanelVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  function scrollToBooking() {
    bookingPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <section className="bg-cream pb-28 pt-24 sm:pt-32 lg:pb-20">
        <SundayTableSectionNav
          locale={locale}
          shareUrl={shareUrl}
          shareLabel={sectionNavLabels.share}
          copiedLabel={sectionNavLabels.copied}
          items={[
            { id: "overzicht", label: sectionNavLabels.overview },
            { id: "hoogtepunten", label: sectionNavLabels.highlights },
            { id: "zo-werkt-het", label: sectionNavLabels.howItWorks },
            ...(venueAbout && !comingSoon
              ? [{ id: "locatie", label: sectionNavLabels.venue }]
              : []),
            { id: "ervaringen", label: sectionNavLabels.reviews },
            { id: "vragen", label: sectionNavLabels.faq },
          ]}
        />
        {/* One grid for the whole page: on desktop the booking panel has its
            own column and stays in view while the rest scrolls past; on
            mobile it falls in right after the intro. */}
        <div className="mx-auto grid max-w-lg gap-8 px-5 sm:px-6 lg:max-w-6xl lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-x-12 lg:gap-y-0">
          <div className="min-w-0 lg:col-start-1 lg:row-start-1">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] shadow-[0_24px_60px_rgba(43,13,18,0.18)]">
              {heroImages.map((image, index) => (
                <Image
                  key={image.src}
                  src={image.src}
                  alt={image.alt}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 1024px) 100vw, 640px"
                  className={`object-cover ${image.position ?? "object-center"} transition-opacity duration-500 ${
                    index === slide ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#14060a]/50 to-transparent" />

              <span
                className={`absolute left-4 top-4 z-10 inline-flex items-center rounded-full px-3.5 py-2 text-xs font-semibold uppercase tracking-wide backdrop-blur-sm ${
                  comingSoon
                    ? "bg-[#14060a]/50 text-cream"
                    : spotsLeft > 0
                      ? "bg-gold text-wine"
                      : "bg-[#14060a]/50 text-cream"
                }`}
              >
                {comingSoon
                  ? comingSoonChipLabel
                  : spotsLeft === 0
                    ? soldOutChipLabel
                    : showSpotsCount
                      ? ticketsLeftLabel.replace("{count}", String(spotsLeft))
                      : availableChipLabel}
              </span>

              <button
                type="button"
                onClick={handleShare}
                className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-[#14060a]/35 px-3.5 py-2 text-xs font-medium text-cream backdrop-blur-sm transition hover:bg-[#14060a]/50"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M12 3v12" />
                  <path d="M7 8l5-5 5 5" />
                  <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
                </svg>
                {shareCopied ? shareCopiedLabel : shareLabel}
              </button>

              {heroImages.length > 1 ? (
                <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-1.5">
                  {heroImages.map((image, index) => (
                    <button
                      key={image.src}
                      type="button"
                      aria-label={image.alt}
                      onClick={() => setSlide(index)}
                      className={`h-1.5 rounded-full transition-all ${
                        index === slide ? "w-5 bg-cream" : "w-1.5 bg-cream/50 hover:bg-cream/75"
                      }`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              {googleRating && !comingSoon ? (
                <a
                  href={googleRating.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex shrink-0 items-center gap-1.5 text-sm text-wine/60 transition hover:text-wine"
                >
                  <span className="font-semibold text-wine">★ {googleRating.score}</span>
                  <span className="whitespace-nowrap">· {googleRating.label}</span>
                </a>
              ) : null}
              <p className="truncate text-xs text-wine/45">{activeImage?.alt}</p>
            </div>

            <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
              {eyebrow}
            </p>
            <h1 className="mt-3 font-serif text-[2.1rem] font-medium leading-[1.05] tracking-tight text-wine text-balance sm:text-[2.75rem]">
              {venueName}
            </h1>
            {tags.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full border border-wine/15 bg-beige/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-wine/80"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            <p className="mt-3 text-lg font-medium text-wine/90 sm:text-xl">
              {dateLabel} · {timeLabel}
            </p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-wine/70 sm:text-lg">
              {intro}
            </p>

            {/* On phones these come before the booking form, so people know
                what it is before they are asked to pay; on desktop the form
                stays in view on the right while they read. */}
            <SundayTableHighlights highlights={highlights} />
            <SundayTableDaySteps daySteps={daySteps} />
          </div>

          <div
            ref={bookingPanelRef}
            id="boeken"
            className="min-w-0 scroll-mt-24 lg:col-start-2 lg:row-span-2 lg:row-start-1"
          >
            {/* Kept compact so the buy button still fits on a laptop screen
                while sticky; very short screens scroll inside the panel. */}
            <div className="rounded-[1.75rem] border border-wine/10 bg-beige/60 px-6 py-5 shadow-[0_20px_50px_rgba(43,13,18,0.08)] sm:px-7 sm:py-6 lg:sticky lg:top-24 lg:max-h-[calc(100svh-7rem)] lg:overflow-y-auto">
              <p className="font-serif text-3xl text-wine">
                €{pricePerSeatEuros}{" "}
                <span className="font-sans text-sm text-wine/60">{perSeatLabel}</span>
              </p>
              <dl className="mt-3 space-y-2 border-t border-wine/10 pt-3 text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-wine/55">{dateFieldLabel}</dt>
                  <dd className="text-right font-medium text-wine">
                    {dateLabel} · {timeLabel}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-wine/55">{venueFieldLabel}</dt>
                  <dd className="text-right">
                    {comingSoon ? (
                      <span className="font-medium text-wine">{venueName}</span>
                    ) : (
                      <a
                        href={mapsHref}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-wine underline-offset-4 hover:underline"
                      >
                        {venueName}
                      </a>
                    )}
                    <span className="block text-xs text-wine/55">{address}</span>
                  </dd>
                </div>
              </dl>
              <p className="mt-3 border-t border-wine/10 pt-2.5 text-xs leading-snug text-wine/65">
                {includedLine}
              </p>

              {comingSoon ? (
                <SundayTableNotifyMeForm
                  eventId={eventId}
                  locale={locale}
                  title={comingSoonTitle}
                  body={comingSoonBody}
                  emailLabel={comingSoonEmailLabel}
                  submitLabel={comingSoonSubmitLabel}
                  successLabel={comingSoonSuccessLabel}
                  errorLabel={comingSoonErrorLabel}
                />
              ) : (
                <SundayTableBookingCard
                  eventId={eventId}
                  locale={locale}
                  cityName={cityName}
                  englishComingSoon={englishComingSoon}
                  pricePerSeatEuros={pricePerSeatEuros}
                  spotsLeft={spotsLeft}
                  emailLabel={bookingEmailLabel}
                  nameLabel={bookingNameLabel}
                  seatsLabel={bookingSeatsLabel}
                  seatOneLabel={bookingSeatOneLabel}
                  seatTwoLabel={bookingSeatTwoLabel}
                  languageLabel={bookingLanguageLabel}
                  languageDutchLabel={bookingLanguageDutchLabel}
                  languageEnglishLabel={bookingLanguageEnglishLabel}
                  languageBothLabel={bookingLanguageBothLabel}
                  ctaLabel={bookingCtaLabel}
                  ctaLabelPlural={bookingCtaLabelPlural}
                  soldOutLabel={bookingSoldOutLabel}
                  guarantees={bookingGuarantees}
                  genericErrorLabel={bookingErrorLabel}
                />
              )}
            </div>
          </div>

          <div className="min-w-0 lg:col-start-1 lg:row-start-2">
            {venueAbout && !comingSoon ? (
              <div className="mb-10 lg:mt-14">
                <SundayTableVenueAbout venue={venueAbout} />
              </div>
            ) : null}
            <div id="ervaringen" className="border-t border-wine/10 pt-10 lg:mt-14">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
                {statsEyebrow}
              </p>
              <h2 className="mt-3 max-w-xl font-serif text-2xl font-medium tracking-tight text-wine sm:text-3xl">
                {statsTitle}
              </h2>
              <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="font-serif text-3xl font-medium text-wine sm:text-4xl">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-sm leading-snug text-wine/60">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="-mx-5 overflow-hidden sm:-mx-6 lg:mx-0">
              <TestimonialMarquee
                top={people}
                bottom={[]}
                fadeFromClassName="from-cream"
                cardClassName="border-wine/10 bg-white/80"
                singleRow
              />
            </div>

            <div id="vragen" className="mt-6 border-t border-wine/10 pt-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
                {faqEyebrow}
              </p>
              <h2 className="mt-3 font-serif text-2xl font-medium tracking-tight text-wine sm:text-3xl">
                {faqTitle}
              </h2>
              <div className="mt-8 divide-y divide-wine/10 rounded-[1.5rem] border border-wine/10 bg-white/70 px-6 shadow-[0_20px_50px_rgba(43,13,18,0.06)] sm:px-8">
                {faqItems.map((item) => (
                  <details key={item.question} className="group py-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-lg font-medium tracking-tight text-wine [&::-webkit-details-marker]:hidden">
                      {item.question}
                      <span
                        aria-hidden
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-wine/8 text-base leading-none text-wine/60 transition-transform duration-200 group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="mt-2 text-sm leading-relaxed text-wine/60">
                      {item.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile: price, date and one button always in reach, like the ticket
          bar on event sites. Slides away while the form itself is visible. */}
      {!soldOut ? (
        <div
          className={`fixed inset-x-0 bottom-0 z-[48] border-t border-wine/10 bg-cream/97 shadow-[0_-12px_36px_rgba(43,13,18,0.14)] backdrop-blur-md transition-transform duration-300 lg:hidden ${
            bookingPanelVisible ? "translate-y-full" : "translate-y-0"
          }`}
          style={{ paddingBottom: "max(0.65rem, env(safe-area-inset-bottom))" }}
          role="region"
          aria-label={comingSoon ? comingSoonSubmitLabel : bookingCtaLabel}
          aria-hidden={bookingPanelVisible}
        >
          <div className="mx-auto flex max-w-lg items-center justify-between gap-4 px-5 pt-3">
            <div className="min-w-0">
              <p className="font-serif text-xl leading-none text-wine">
                €{pricePerSeatEuros}{" "}
                <span className="font-sans text-xs text-wine/55">{perSeatLabel}</span>
              </p>
              <p className="mt-1 truncate text-xs text-wine/60">
                {/* Weekday and year dropped so it fits next to the button:
                    "25 oktober · 14:00". It's always a Sunday anyway. */}
                {dateLabel.replace(/^\S+,?\s/, "").replace(/\s\d{4}$/, "")} · {timeLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={scrollToBooking}
              tabIndex={bookingPanelVisible ? -1 : 0}
              className="cta-lift cta-lift-burgundy inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-burgundy px-6 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-cream shadow-[0_10px_26px_rgba(90,15,27,0.25)] hover:bg-wine"
            >
              {comingSoon ? comingSoonSubmitLabel : bookingCtaLabel}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
