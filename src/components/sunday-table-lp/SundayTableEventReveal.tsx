"use client";

import Image from "next/image";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { SundayTableBookingCard } from "@/components/sunday-table-lp/SundayTableBookingCard";
import { TestimonialMarquee } from "@/components/TestimonialMarquee";
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
  pricePerSeatEuros: number;
  ticketsLeftLabel: string;
  soldOutChipLabel: string;
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
  pricePerSeatEuros,
  ticketsLeftLabel,
  soldOutChipLabel,
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

  return (
    <>
      <section className="bg-cream pb-10 pt-24 sm:pt-32 lg:pb-16">
        <div className="mx-auto max-w-lg px-5 sm:px-6 lg:max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start lg:gap-12">
            <div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] shadow-[0_24px_60px_rgba(43,13,18,0.18)]">
                {heroImages.map((image, index) => (
                  <Image
                    key={image.src}
                    src={image.src}
                    alt={image.alt}
                    fill
                    priority={index === 0}
                    sizes="(max-width: 1024px) 100vw, 560px"
                    className={`object-cover ${image.position ?? "object-center"} transition-opacity duration-500 ${
                      index === slide ? "opacity-100" : "opacity-0"
                    }`}
                  />
                ))}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#14060a]/50 to-transparent" />

                <span
                  className={`absolute left-4 top-4 z-10 inline-flex items-center rounded-full px-3.5 py-2 text-xs font-semibold uppercase tracking-wide backdrop-blur-sm ${
                    spotsLeft > 0
                      ? "bg-gold text-wine"
                      : "bg-[#14060a]/50 text-cream"
                  }`}
                >
                  {spotsLeft > 0
                    ? ticketsLeftLabel.replace("{count}", String(spotsLeft))
                    : soldOutChipLabel}
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
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Juni+Rotterdam"
                  target="_blank"
                  rel="noreferrer"
                  className="flex shrink-0 items-center gap-1.5 text-sm text-wine/60 transition hover:text-wine"
                >
                  <span className="font-semibold text-wine">★ 4.9</span>
                  <span className="whitespace-nowrap">· 123 reviews op Google</span>
                </a>
                <p className="truncate text-xs text-wine/45">{activeImage?.alt}</p>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
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
              <p className="mt-4 max-w-lg text-base leading-relaxed text-wine/70 sm:text-lg">
                {intro}
              </p>

              <div className="mt-7 rounded-[1.75rem] border border-wine/10 bg-beige/60 px-6 py-6 shadow-[0_20px_50px_rgba(43,13,18,0.08)] sm:px-7 sm:py-7">
                <dl className="space-y-4">
                  <div className="flex items-baseline justify-between gap-4 border-b border-wine/10 pb-4">
                    <dt className="text-sm text-wine/60">{dateFieldLabel}</dt>
                    <dd className="text-right font-serif text-lg text-wine">
                      {dateLabel} · {timeLabel}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-sm text-wine/60">{venueFieldLabel}</dt>
                    <dd className="text-right">
                      <a
                        href={mapsHref}
                        target="_blank"
                        rel="noreferrer"
                        className="font-serif text-lg text-wine underline-offset-4 hover:underline"
                      >
                        {venueName}
                      </a>
                      <p className="mt-0.5 text-sm text-wine/60">{address}</p>
                    </dd>
                  </div>
                </dl>

                <SundayTableBookingCard
                  eventId={eventId}
                  locale={locale}
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
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-t border-wine/8 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-lg px-5 sm:px-6 lg:max-w-6xl">
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

        <TestimonialMarquee
          top={people}
          bottom={[]}
          fadeFromClassName="from-white"
          cardClassName="border-wine/10 bg-cream/80"
          singleRow
        />
      </section>

      <section className="border-t border-wine/8 bg-beige/40 py-12 sm:py-16">
        <div className="mx-auto max-w-lg px-5 sm:px-6 lg:max-w-2xl">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
            {faqEyebrow}
          </p>
          <h2 className="mt-3 text-center font-serif text-2xl font-medium tracking-tight text-wine sm:text-3xl">
            {faqTitle}
          </h2>
          <div className="mt-8 divide-y divide-wine/10 rounded-[1.5rem] border border-wine/10 bg-cream px-6 shadow-[0_20px_50px_rgba(43,13,18,0.06)] sm:px-8">
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
      </section>
    </>
  );
}
