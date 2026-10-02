"use client";

import Image from "next/image";
import Link from "next/link";
import { MotionConfig, motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getBrandLandingTestimonialRows } from "@/data/brand-landing-testimonials";
import {
  jouwTafelLogInPath,
  jouwTafelSignUpPath,
  privacyPath,
  termsPath,
  type Locale,
} from "@/i18n/config";
import { getLandingCopy } from "@/lib/jouw-tafel/copy";
import {
  displayCity,
  type QuizCity,
  type QuizEvent,
} from "@/lib/jouw-tafel/logic";
import { ease } from "@/lib/motion";
import { trackJouwTafelEvent } from "@/lib/posthog/analytics";
import { PostHogEvents } from "@/lib/posthog/events";
import { JouwTafelFaq } from "@/components/jouw-tafel/JouwTafelFaq";
import { JouwTafelTables } from "@/components/jouw-tafel/JouwTafelTables";
import {
  CalendarIcon,
  CheckIcon,
  DoorIcon,
  GlassIcon,
  PinIcon,
  ShieldIcon,
} from "@/components/jouw-tafel/icons";

/** Real photos from MyTable wine afternoons, already used on the site. */
const HERO_PHOTO = "/girls-only/wine-tasting-toast.jpg";
const HOW_PHOTO = "/girls-only/wine-tasting-conversation.jpg";
const TABLE_PHOTO = "/girls-only/table-wine-laughing.jpg";

/** Quotes about the atmosphere and the wine, from the homepage set. */
const TESTIMONIAL_NAMES = ["Carmen", "Mark", "Sophie"];

export type LandingSection =
  | "hero"
  | "herkenning"
  | "zo-werkt-het"
  | "tafels"
  | "aan-tafel"
  | "belofte"
  | "faq"
  | "afsluiter";

export type CtaLocation = "header" | "hero" | "sticky" | "tables" | "final";

const primaryCta =
  "cta-lift cta-lift-burgundy inline-flex min-h-12 items-center justify-center rounded-full bg-burgundy px-8 text-xs font-semibold uppercase tracking-[0.16em] text-cream shadow-[0_14px_34px_rgba(90,15,27,0.28)] transition hover:bg-wine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy focus-visible:ring-offset-2 focus-visible:ring-offset-cream";
const secondaryCta =
  "inline-flex min-h-12 items-center justify-center rounded-full px-5 text-xs font-semibold uppercase tracking-[0.16em] text-wine/70 underline-offset-4 transition hover:text-wine hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/60";
const eyebrowClass =
  "text-[11px] font-semibold uppercase tracking-[0.28em] text-gold";
const h2Class =
  "font-serif text-[2rem] font-medium leading-[1.1] tracking-tight text-wine text-balance sm:text-[2.5rem]";

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** "Aanmelden" with "Inloggen" next to it: the only two actions on the page. */
function CtaPair({
  location,
  center = false,
  signUpHref,
  logInHref,
  signUpLabel,
  logInLabel,
  onClick,
}: {
  location: CtaLocation;
  center?: boolean;
  signUpHref: string;
  logInHref: string;
  signUpLabel: string;
  logInLabel: string;
  onClick: (location: CtaLocation, cta: "signup" | "login") => void;
}) {
  return (
    <div
      className={`flex flex-col gap-1 sm:flex-row sm:items-center ${center ? "sm:justify-center" : ""}`}
    >
      <Link
        href={signUpHref}
        className={`${primaryCta} w-full sm:w-auto`}
        onClick={() => onClick(location, "signup")}
      >
        {signUpLabel}
      </Link>
      <Link
        href={logInHref}
        className={`${secondaryCta} w-full sm:w-auto`}
        onClick={() => onClick(location, "login")}
      >
        {logInLabel}
      </Link>
    </div>
  );
}

export function JouwTafelLanding({
  locale,
  events,
  geoCity,
  proof,
  now,
  preview,
}: {
  locale: Locale;
  events: QuizEvent[];
  geoCity: QuizCity | null;
  /** Waitlist size for the line under the hero (already rounded down). */
  proof: { count: number; city: string | null } | null;
  /** Server time, so the table list renders the same on both sides. */
  now: number;
  /** ?voorbeeld=1: no PostHog events, for checking the page. */
  preview: boolean;
}) {
  const copy = getLandingCopy(locale);
  const city = geoCity ? displayCity(geoCity, locale) : null;
  const signUpHref = jouwTafelSignUpPath(locale);
  const logInHref = jouwTafelLogInPath(locale);

  const { culinary, people } = getBrandLandingTestimonialRows(locale);
  const testimonials = TESTIMONIAL_NAMES.map((name) =>
    [...culinary, ...people].find((t) => t.name === name),
  ).filter((t): t is NonNullable<typeof t> => Boolean(t));

  // ---------------------------------------------------------------- tracking

  const track = useCallback(
    (
      event: Parameters<typeof trackJouwTafelEvent>[0],
      props: Record<string, unknown>,
    ) => {
      if (!preview)
        trackJouwTafelEvent(event, {
          locale,
          geo_city: geoCity ?? "none",
          ...props,
        });
    },
    [preview, locale, geoCity],
  );

  const ctaClicked = (location: CtaLocation, cta: "signup" | "login") =>
    track(PostHogEvents.landingCtaClicked, { location, cta });

  // landing_section_viewed: once per section, when a third of it is in view.
  const seenRef = useRef(new Set<string>());
  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>(
      "[data-landing-section]",
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const section = (entry.target as HTMLElement).dataset.landingSection!;
          if (seenRef.current.has(section)) continue;
          seenRef.current.add(section);
          track(PostHogEvents.landingSectionViewed, { section });
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.3 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [track]);

  // Mobile sticky CTA: from the moment the hero buttons scroll out of view,
  // until the closing section (which has its own buttons) comes in.
  const heroCtaRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef<HTMLElement>(null);
  const [heroCtaVisible, setHeroCtaVisible] = useState(true);
  const [closingVisible, setClosingVisible] = useState(false);
  useEffect(() => {
    const hero = heroCtaRef.current;
    const closing = closingRef.current;
    if (!hero || !closing) return;
    const heroObserver = new IntersectionObserver(([entry]) => {
      // Only "out of view" once it has scrolled up past the top.
      setHeroCtaVisible(
        entry!.isIntersecting || entry!.boundingClientRect.top > 0,
      );
    });
    const closingObserver = new IntersectionObserver(([entry]) =>
      setClosingVisible(entry!.isIntersecting),
    );
    heroObserver.observe(hero);
    closingObserver.observe(closing);
    return () => {
      heroObserver.disconnect();
      closingObserver.disconnect();
    };
  }, []);
  const showSticky = !heroCtaVisible && !closingVisible;

  const ctaProps = {
    signUpHref,
    logInHref,
    signUpLabel: copy.signUp,
    logInLabel: copy.logIn,
    onClick: ctaClicked,
  };

  const stepIcons = [CalendarIcon, DoorIcon, GlassIcon];
  const promiseIcons = [CalendarIcon, ShieldIcon, GlassIcon];

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-[100svh] bg-cream pb-24 text-wine lg:pb-0">
        <header className="flex h-16 items-center justify-between px-5 sm:px-8 lg:mx-auto lg:max-w-7xl lg:px-12">
          <Logo priority />
          <div className="flex items-center gap-1">
            <LanguageSwitcher
              locale={locale}
              label={locale === "nl" ? "EN" : "NL"}
            />
            <Link
              href={logInHref}
              className="rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-wine/70 transition hover:text-wine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/60"
              onClick={() => ctaClicked("header", "login")}
            >
              {copy.logIn}
            </Link>
          </div>
        </header>

        {/* 1. Hero. Phone: Groupvibe style, one big rounded photo with the
            headline, one line and the single CTA on it (zoomed in on the
            table so the street above drops out). Desktop: Timeleft style,
            text on the left and the photo on the right, so no face ends up
            behind the headline. */}
        <section
          data-landing-section="hero"
          className="px-3 pt-1 sm:px-6 lg:mx-auto lg:max-w-7xl lg:px-10 lg:pt-4"
        >
          <div className="relative isolate flex h-[calc(100svh-7.5rem)] max-h-[720px] min-h-[540px] flex-col justify-end overflow-hidden rounded-[2rem] lg:grid lg:h-[600px] lg:max-h-none lg:min-h-0 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center lg:gap-14 lg:overflow-visible lg:rounded-none">
            <div className="absolute inset-0 -z-10 overflow-hidden lg:relative lg:inset-auto lg:z-0 lg:order-2 lg:h-full lg:rounded-[2rem]">
              <Image
                src={HERO_PHOTO}
                alt={copy.hero.imageAlt}
                fill
                priority
                quality={90}
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="origin-[35%_80%] scale-[1.18] object-cover object-[30%_60%] lg:origin-center lg:scale-100 lg:object-[50%_45%]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1e0a0e]/90 via-[#1e0a0e]/40 to-transparent lg:hidden" />
              {city ? (
                <p className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-cream/90 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-burgundy shadow-sm backdrop-blur sm:left-6 sm:top-6">
                  <PinIcon className="h-3.5 w-3.5 text-gold" />
                  <span className="sr-only">{copy.hero.locationAria}: </span>
                  {city}
                </p>
              ) : null}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05, ease }}
              className="px-6 pb-7 sm:px-10 sm:pb-10 lg:order-1 lg:px-2 lg:pb-0"
            >
              <h1 className="font-serif text-[2.6rem] font-medium leading-[1.02] tracking-tight text-cream text-balance sm:text-[3.4rem] lg:text-[3.6rem] lg:text-wine">
                {copy.hero.title}
              </h1>
              <p className="mt-4 max-w-md text-[1.02rem] leading-relaxed text-cream/85 sm:text-[1.1rem] lg:text-wine/70">
                {copy.hero.body}
              </p>
              <div ref={heroCtaRef} className="mt-6 lg:mt-8">
                <Link
                  href={signUpHref}
                  className="cta-lift inline-flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-full bg-cream px-8 text-xs font-semibold uppercase tracking-[0.16em] text-burgundy shadow-[0_14px_34px_rgba(0,0,0,0.25)] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream focus-visible:ring-offset-2 focus-visible:ring-offset-wine sm:w-auto lg:bg-burgundy lg:text-cream lg:shadow-[0_14px_34px_rgba(90,15,27,0.28)] lg:hover:bg-wine lg:focus-visible:ring-burgundy lg:focus-visible:ring-offset-cream"
                  onClick={() => ctaClicked("hero", "signup")}
                >
                  {copy.signUp}
                  <span aria-hidden>&rarr;</span>
                </Link>
              </div>
              {proof ? (
                <p className="mt-6 hidden items-center gap-2 text-sm font-medium text-wine/75 lg:flex">
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 rounded-full bg-gold"
                  />
                  {copy.hero.proof(
                    proof.count,
                    proof.city
                      ? displayCity(proof.city as QuizCity, locale)
                      : null,
                  )}
                </p>
              ) : null}
            </motion.div>
          </div>

          <div className="mt-4 flex flex-col items-center gap-1 text-center lg:hidden">
            {proof ? (
              <p className="flex items-center gap-2 text-sm font-medium text-wine/75">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full bg-gold"
                />
                {copy.hero.proof(
                  proof.count,
                  proof.city
                    ? displayCity(proof.city as QuizCity, locale)
                    : null,
                )}
              </p>
            ) : null}
            <p className="text-xs text-wine/50">{copy.hero.note}</p>
          </div>
        </section>

        {/* 2. Herkenning */}
        <section
          data-landing-section="herkenning"
          className="px-5 pb-16 pt-16 sm:pt-20 lg:pt-8"
        >
          <div className="mx-auto max-w-2xl">
            <Reveal>
              <h2 className={`${h2Class} text-center`}>
                {copy.herkenning.title}
              </h2>
            </Reveal>
            <ul className="mt-9 space-y-3">
              {copy.herkenning.lines.map((line, index) => (
                <Reveal key={line} delay={index * 0.08}>
                  <li className="flex items-start gap-4 rounded-2xl border border-wine/8 bg-white/70 px-5 py-4">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-burgundy/8 text-burgundy">
                      <CheckIcon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-[1.02rem] leading-relaxed text-wine/85">
                      {line}
                    </span>
                  </li>
                </Reveal>
              ))}
            </ul>
            <Reveal delay={0.25}>
              <p className="mt-9 text-center font-serif text-[1.65rem] italic leading-snug text-burgundy">
                {copy.herkenning.closing}
              </p>
            </Reveal>
          </div>
        </section>

        {/* 3. Zo werkt het */}
        <section
          data-landing-section="zo-werkt-het"
          className="border-t border-wine/8 bg-white py-16 sm:py-20"
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
            <Reveal className="text-center">
              <p className={eyebrowClass}>{copy.howItWorks.eyebrow}</p>
              <h2 className={`${h2Class} mt-3`}>{copy.howItWorks.title}</h2>
            </Reveal>

            <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-14">
              <Reveal className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] lg:aspect-[4/5]">
                <Image
                  src={HOW_PHOTO}
                  alt={copy.howItWorks.imageAlt}
                  fill
                  quality={90}
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover object-[55%_50%]"
                />
              </Reveal>

              <ol className="relative space-y-8">
                <span
                  aria-hidden
                  className="absolute bottom-6 left-[1.45rem] top-6 w-px bg-gold/40"
                />
                {copy.howItWorks.steps.map((step, index) => {
                  const Icon = stepIcons[index] ?? CalendarIcon;
                  return (
                    <Reveal key={step.title} delay={index * 0.08}>
                      <li className="relative flex gap-5">
                        <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-cream text-burgundy">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="pt-1">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
                            {index + 1}
                          </p>
                          <h3 className="mt-1 font-serif text-[1.55rem] font-medium leading-tight text-wine">
                            {step.title}
                          </h3>
                          <p className="mt-2 text-[0.98rem] leading-relaxed text-wine/70">
                            {step.body}
                          </p>
                        </div>
                      </li>
                    </Reveal>
                  );
                })}
              </ol>
            </div>

            <Reveal>
              <p className="mx-auto mt-12 flex max-w-xl items-center justify-center gap-4 text-center font-serif text-[1.3rem] italic leading-snug text-wine/80">
                <span
                  aria-hidden
                  className="hidden h-px w-10 shrink-0 bg-gold sm:block"
                />
                {copy.howItWorks.reassurance}
                <span
                  aria-hidden
                  className="hidden h-px w-10 shrink-0 bg-gold sm:block"
                />
              </p>
            </Reveal>
          </div>
        </section>

        {/* 4. Eerstvolgende tafels (information only) */}
        <section
          data-landing-section="tafels"
          className="border-t border-wine/8 py-16 sm:py-20"
        >
          <div className="mx-auto max-w-2xl px-5 sm:px-8">
            <JouwTafelTables
              locale={locale}
              events={events}
              geoCity={geoCity}
              now={now}
            />
            <Reveal className="mt-8">
              <CtaPair location="tables" center {...ctaProps} />
            </Reveal>
          </div>
        </section>

        {/* 5. Aan tafel */}
        <section
          data-landing-section="aan-tafel"
          className="border-t border-wine/8 bg-white py-16 sm:py-20"
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
            <Reveal className="text-center">
              <p className={eyebrowClass}>{copy.testimonials.eyebrow}</p>
              <h2 className={`${h2Class} mt-3`}>{copy.testimonials.title}</h2>
            </Reveal>
            <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-stretch lg:gap-10">
              <Reveal className="relative aspect-[3/2] overflow-hidden rounded-[1.75rem] lg:aspect-auto lg:min-h-[480px]">
                <Image
                  src={TABLE_PHOTO}
                  alt={copy.testimonials.imageAlt}
                  fill
                  quality={90}
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  className="object-cover object-[40%_45%]"
                />
              </Reveal>
              <div className="grid gap-4">
                {testimonials.map((t, index) => (
                  <Reveal key={t.name} delay={index * 0.08}>
                    <figure className="h-full rounded-[1.5rem] border border-wine/10 bg-cream/70 p-6 shadow-[0_12px_32px_rgba(43,13,18,0.06)]">
                      <span
                        aria-hidden
                        className="block font-serif text-4xl leading-none text-gold"
                      >
                        &ldquo;
                      </span>
                      <blockquote className="-mt-2 font-serif text-[1.22rem] leading-snug text-wine">
                        {t.quote}
                      </blockquote>
                      <figcaption className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-wine/55">
                        {t.name}
                        <span className="font-normal normal-case tracking-normal text-wine/45">
                          {" "}
                          · {t.detail.split("·")[0]!.trim()}
                        </span>
                      </figcaption>
                    </figure>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 6. Onze belofte: three light promises, same style as "Zo werkt het". */}
        <section data-landing-section="belofte" className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
            <Reveal className="text-center">
              <p className={eyebrowClass}>{copy.promise.eyebrow}</p>
              <h2 className={`${h2Class} mt-3`}>{copy.promise.title}</h2>
            </Reveal>
            <ul className="mt-10 grid gap-4 sm:grid-cols-3 sm:gap-5">
              {copy.promise.items.map((item, index) => {
                const Icon = promiseIcons[index] ?? ShieldIcon;
                return (
                  <Reveal
                    key={item.title}
                    delay={index * 0.08}
                    className="h-full"
                  >
                    <li className="flex h-full flex-col rounded-[1.5rem] border border-wine/8 bg-white/70 p-6">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/50 text-burgundy">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="mt-4 font-serif text-[1.35rem] font-medium leading-tight text-wine">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-[0.96rem] leading-relaxed text-wine/70">
                        {item.body}
                      </p>
                    </li>
                  </Reveal>
                );
              })}
            </ul>
          </div>
        </section>

        {/* 7. FAQ */}
        <section
          data-landing-section="faq"
          className="border-t border-wine/8 bg-white py-16 sm:py-20"
        >
          <div className="mx-auto max-w-2xl px-5 sm:px-8">
            <Reveal className="text-center">
              <p className={eyebrowClass}>{copy.faq.eyebrow}</p>
              <h2 className={`${h2Class} mt-3`}>{copy.faq.title}</h2>
            </Reveal>
            <JouwTafelFaq items={copy.faq.items} />
          </div>
        </section>

        {/* 8. Afsluiter */}
        <section
          ref={closingRef}
          data-landing-section="afsluiter"
          className="relative overflow-hidden py-20 sm:py-24"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(197,154,91,0.16),transparent_60%)]" />
          <Reveal className="relative mx-auto max-w-xl px-5 text-center">
            <span aria-hidden className="mx-auto block h-px w-12 bg-gold" />
            <h2 className={`${h2Class} mt-6`}>{copy.closing.title}</h2>
            <div className="mt-8">
              <CtaPair location="final" center {...ctaProps} />
            </div>
            <p className="mt-2 text-xs text-wine/50">{copy.closing.note}</p>
          </Reveal>
        </section>

        <footer className="border-t border-wine/8 px-5 py-8 text-center text-xs text-wine/45">
          <nav className="flex items-center justify-center gap-5">
            <Link
              href={termsPath(locale)}
              className="underline-offset-4 hover:text-wine hover:underline"
            >
              {copy.footer.terms}
            </Link>
            <Link
              href={privacyPath(locale)}
              className="underline-offset-4 hover:text-wine hover:underline"
            >
              {copy.footer.privacy}
            </Link>
          </nav>
          <p className="mt-3">© MyTable</p>
        </footer>

        {/* Mobile sticky CTA, like the homepage's. */}
        <div
          className={`fixed inset-x-0 bottom-0 z-[48] border-t border-wine/10 bg-cream/95 shadow-[0_-12px_36px_rgba(43,13,18,0.14)] backdrop-blur-md transition-transform duration-300 lg:hidden ${
            showSticky
              ? "translate-y-0"
              : "pointer-events-none translate-y-full"
          }`}
          style={{ paddingBottom: "max(0.65rem, env(safe-area-inset-bottom))" }}
          aria-hidden={!showSticky}
          inert={!showSticky}
        >
          <div className="mx-auto flex max-w-xl items-center gap-2 px-4 pt-2.5">
            <Link
              href={signUpHref}
              className={`${primaryCta} flex-1`}
              onClick={() => ctaClicked("sticky", "signup")}
            >
              {copy.signUp}
            </Link>
            <Link
              href={logInHref}
              className={`${secondaryCta} px-4`}
              onClick={() => ctaClicked("sticky", "login")}
            >
              {copy.logIn}
            </Link>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
