"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MotionConfig, motion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { JouwTafelFaq } from "@/components/jouw-tafel/JouwTafelFaq";
import { CalendarIcon, CheckIcon, ClockIcon, TwoGlassesIcon } from "@/components/jouw-tafel/icons";
import {
  jouwTafelKiesPath,
  jouwTafelLogInPath,
  jouwTafelPath,
  jouwTafelSettingsPath,
  jouwTafelSignUpPath,
  privacyPath,
  termsPath,
  type Locale,
} from "@/i18n/config";
import { getMetaBrowserCookies, getMetaEventSourceUrl } from "@/lib/analytics/metaCookies";
import { trackMetaSubscribe } from "@/lib/analytics/metaTracking";
import { displayCity } from "@/lib/jouw-tafel/logic";
import { getMembershipPageCopy } from "@/lib/membership/page-copy";
import {
  MEMBERSHIP_PLAN_IDS,
  formatPlanEuros,
  savingsExample,
  type MembershipPlanId,
} from "@/lib/membership/plans";
import { ease } from "@/lib/motion";
import { trackMembershipEvent } from "@/lib/posthog/analytics";
import { PostHogEvents } from "@/lib/posthog/events";

const HERO_PHOTO = "/girls-only/wine-tasting-toast.jpg";
const HOW_PHOTO = "/girls-only/wine-tasting-conversation.jpg";

export type MembershipPageState =
  | { kind: "visitor" }
  | { kind: "signed_in" }
  /** Back from Checkout, the membership is not in yet (webhook on its way). */
  | { kind: "pending" }
  | {
      kind: "member";
      plan: MembershipPlanId;
      /** Just came back from Checkout. */
      welcome: boolean;
      bookedSunday: string | null;
      /** Meta Subscribe for the browser Pixel (deduplicated with CAPI). */
      subscribe: { subscriptionId: string; value: number } | null;
    };

export type MembershipTestimonial = { name: string; city: string; quote: string };

const primaryCta =
  "cta-lift cta-lift-burgundy inline-flex min-h-[3.25rem] items-center justify-center gap-2 rounded-full bg-burgundy px-8 text-xs font-semibold uppercase tracking-[0.16em] text-cream shadow-[0_14px_34px_rgba(90,15,27,0.28)] transition hover:bg-wine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-wait disabled:opacity-70";
const secondaryCta =
  "inline-flex min-h-12 items-center justify-center rounded-full px-5 text-xs font-semibold uppercase tracking-[0.16em] text-wine/70 underline-offset-4 transition hover:text-wine hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/60";
const eyebrowClass = "text-[11px] font-semibold uppercase tracking-[0.28em] text-gold";
const h2Class = "font-serif text-[2rem] font-medium leading-[1.1] tracking-tight text-wine text-balance sm:text-[2.5rem]";

function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
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

export function JouwTafelMembership({
  locale,
  state,
  initialPlan,
  singleSeatCents,
  testimonials,
}: {
  locale: Locale;
  state: MembershipPageState;
  initialPlan: MembershipPlanId;
  /** Price of a single seat when all open tables cost the same, else null. */
  singleSeatCents: number | null;
  testimonials: MembershipTestimonial[];
}) {
  const copy = getMembershipPageCopy(locale);
  const router = useRouter();
  const [plan, setPlan] = useState<MembershipPlanId>(initialPlan);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMember = state.kind === "member";
  const single = singleSeatCents ? `€${formatPlanEuros(singleSeatCents, locale)}` : null;
  const example = savingsExample(singleSeatCents);

  useEffect(() => {
    trackMembershipEvent(PostHogEvents.membershipPageViewed, { locale, state: state.kind });
  }, [locale, state.kind]);

  // Meta Subscribe on the return from Checkout (same id as the CAPI event).
  useEffect(() => {
    if (state.kind === "member" && state.subscribe) {
      trackMetaSubscribe({ subscriptionId: state.subscribe.subscriptionId, plan: state.plan, value: state.subscribe.value });
    }
  }, [state]);

  // Back from Checkout before the webhook: look again for a little while.
  useEffect(() => {
    if (state.kind !== "pending") return;
    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      if (tries > 12) window.clearInterval(timer);
      else router.refresh();
    }, 2500);
    return () => window.clearInterval(timer);
  }, [state.kind, router]);

  // Arriving with ?plan= (back from sign up): bring the plans into view.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).has("plan") && state.kind === "signed_in") {
      document.getElementById("plannen")?.scrollIntoView({ block: "start" });
    }
  }, [state.kind]);

  function choosePlan(id: MembershipPlanId) {
    setPlan(id);
    setError(null);
    trackMembershipEvent(PostHogEvents.membershipPlanSelected, { plan: id });
  }

  async function join(location: string) {
    if (busy) return;
    if (isMember) {
      router.push(jouwTafelKiesPath(locale));
      return;
    }
    trackMembershipEvent(PostHogEvents.membershipCheckoutStarted, { plan, source: "page", location });
    if (state.kind === "visitor") {
      router.push(`${jouwTafelSignUpPath(locale)}?naar=lid&plan=${plan}`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/membership/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          locale,
          source: "page",
          meta: { ...getMetaBrowserCookies(), eventSourceUrl: getMetaEventSourceUrl() },
        }),
      });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string; code?: string } | null;
      if (res.status === 401) {
        router.push(`${jouwTafelSignUpPath(locale)}?naar=lid&plan=${plan}`);
        return;
      }
      if (!res.ok || !data?.url) {
        setError(data?.code === "already_member" ? copy.errors.alreadyMember : (data?.error ?? copy.errors.generic));
        setBusy(false);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError(copy.errors.generic);
      setBusy(false);
    }
  }

  // Mobile sticky CTA between the hero button and the closing section.
  const heroCtaRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef<HTMLElement>(null);
  const plansCtaRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(true);
  const [closingVisible, setClosingVisible] = useState(false);
  const [plansCtaVisible, setPlansCtaVisible] = useState(false);
  useEffect(() => {
    const hero = heroCtaRef.current;
    const closing = closingRef.current;
    if (!hero || !closing) return;
    const a = new IntersectionObserver(([e]) => setHeroVisible(e!.isIntersecting || e!.boundingClientRect.top > 0));
    const b = new IntersectionObserver(([e]) => setClosingVisible(e!.isIntersecting));
    const c = new IntersectionObserver(([e]) => setPlansCtaVisible(e!.isIntersecting));
    a.observe(hero);
    b.observe(closing);
    if (plansCtaRef.current) c.observe(plansCtaRef.current);
    return () => {
      a.disconnect();
      b.disconnect();
      c.disconnect();
    };
  }, []);
  const showSticky = !isMember && !heroVisible && !closingVisible && !plansCtaVisible;

  const planName = copy.plans.plan(plan).name;
  const ctaLabel = busy ? copy.plans.busy : isMember ? copy.member.choose : copy.hero.cta;
  const benefitIcons = [CalendarIcon, ClockIcon, TwoGlassesIcon];

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-[100svh] bg-cream pb-24 text-wine lg:pb-0">
        <header className="flex h-16 items-center justify-between px-5 sm:px-8 lg:mx-auto lg:max-w-7xl lg:px-12">
          <Link href={jouwTafelPath(locale)} aria-label="MyTable">
            <Logo priority />
          </Link>
          <div className="flex items-center gap-1">
            <LanguageSwitcher locale={locale} label={locale === "nl" ? "EN" : "NL"} />
            {state.kind === "visitor" ? (
              <Link
                href={`${jouwTafelLogInPath(locale)}?naar=lid&plan=${plan}`}
                className="rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-wine/70 transition hover:text-wine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/60"
              >
                {locale === "en" ? "Log in" : "Inloggen"}
              </Link>
            ) : (
              <Link
                href={jouwTafelSettingsPath(locale)}
                className="rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-wine/70 transition hover:text-wine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/60"
              >
                {copy.settingsLink}
              </Link>
            )}
          </div>
        </header>

        {state.kind === "member" || state.kind === "pending" ? (
          <MemberBanner locale={locale} state={state} />
        ) : null}

        {/* 1. Hero */}
        <section className="px-3 pt-1 sm:px-6 lg:mx-auto lg:max-w-7xl lg:px-10 lg:pt-4">
          <div className="relative isolate flex h-[calc(100svh-7.5rem)] max-h-[680px] min-h-[520px] flex-col justify-end overflow-hidden rounded-[2rem] lg:grid lg:h-[560px] lg:max-h-none lg:min-h-0 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center lg:gap-14 lg:overflow-visible lg:rounded-none">
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
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05, ease }}
              className="px-6 pb-7 sm:px-10 sm:pb-10 lg:order-1 lg:px-2 lg:pb-0"
            >
              <p className={`${eyebrowClass} !text-gold`}>Sunday Table</p>
              <h1 className="mt-3 font-serif text-[2.55rem] font-medium leading-[1.03] tracking-tight text-cream text-balance sm:text-[3.3rem] lg:text-[3.5rem] lg:text-wine">
                {copy.hero.title}
              </h1>
              <p className="mt-4 max-w-md text-[1.02rem] leading-relaxed text-cream/85 sm:text-[1.1rem] lg:text-wine/70">
                {copy.hero.sub}
              </p>
              <div ref={heroCtaRef} className="mt-6 lg:mt-8">
                <button
                  type="button"
                  onClick={() => (isMember ? void join("hero") : document.getElementById("plannen")?.scrollIntoView({ behavior: "smooth", block: "start" }))}
                  className="cta-lift inline-flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-full bg-cream px-8 text-xs font-semibold uppercase tracking-[0.16em] text-burgundy shadow-[0_14px_34px_rgba(0,0,0,0.25)] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream focus-visible:ring-offset-2 focus-visible:ring-offset-wine sm:w-auto lg:bg-burgundy lg:text-cream lg:shadow-[0_14px_34px_rgba(90,15,27,0.28)] lg:hover:bg-wine lg:focus-visible:ring-burgundy lg:focus-visible:ring-offset-cream"
                >
                  {isMember ? copy.member.choose : copy.hero.cta}
                  <span aria-hidden>&rarr;</span>
                </button>
              </div>
              <p className="mt-4 hidden text-sm text-wine/60 lg:block">{copy.hero.note}</p>
            </motion.div>
          </div>
          <p className="mt-4 text-center text-xs text-wine/55 lg:hidden">{copy.hero.note}</p>
        </section>

        {/* 2. Wat je krijgt */}
        <section className="px-5 pb-16 pt-16 sm:pt-20">
          <div className="mx-auto max-w-5xl">
            <Reveal className="text-center">
              <p className={eyebrowClass}>{copy.benefits.eyebrow}</p>
              <h2 className={`${h2Class} mt-3`}>{copy.benefits.title}</h2>
            </Reveal>
            <ul className="mt-10 grid gap-4 sm:grid-cols-3 sm:gap-5">
              {copy.benefits.items({ single }).map((item, index) => {
                const Icon = benefitIcons[index] ?? CalendarIcon;
                return (
                  <Reveal key={item.title} delay={index * 0.08} className="h-full">
                    <li className="flex h-full flex-col rounded-[1.5rem] border border-wine/8 bg-white/80 p-6 shadow-[0_12px_32px_rgba(43,13,18,0.05)]">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/50 text-burgundy">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="mt-4 font-serif text-[1.4rem] font-medium leading-tight text-wine">{item.title}</h3>
                      <p className="mt-2 text-[0.98rem] leading-relaxed text-wine/70">{item.body}</p>
                    </li>
                  </Reveal>
                );
              })}
            </ul>
          </div>
        </section>

        {/* 3. Kies je lidmaatschap */}
        <section id="plannen" className="scroll-mt-4 border-t border-wine/8 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <Reveal className="text-center">
              <p className={eyebrowClass}>{copy.plans.eyebrow}</p>
              <h2 className={`${h2Class} mt-3`}>{copy.plans.title}</h2>
            </Reveal>
            <div role="radiogroup" aria-label={copy.plans.radioLabel} className="mt-10 grid gap-3.5 lg:grid-cols-3 lg:gap-5">
              {MEMBERSHIP_PLAN_IDS.map((id, index) => (
                <Reveal key={id} delay={index * 0.06} className="h-full">
                  <PlanCard
                    selected={plan === id}
                    disabled={isMember}
                    copy={copy.plans.plan(id)}
                    onSelect={() => choosePlan(id)}
                  />
                </Reveal>
              ))}
            </div>
            <div ref={plansCtaRef} className="mx-auto mt-8 max-w-md text-center">
              {isMember ? null : (
                <>
                  <button type="button" onClick={() => void join("plans")} disabled={busy} className={`${primaryCta} w-full`}>
                    {busy ? copy.plans.busy : copy.plans.cta(planName)}
                  </button>
                  {error ? (
                    <p role="alert" className="mt-3 text-sm font-semibold text-red-700">
                      {error}
                    </p>
                  ) : null}
                  <p className="mt-3 text-xs leading-relaxed text-wine/55">
                    {copy.plans.startsNow}{" "}
                    <Link href={termsPath(locale)} className="underline underline-offset-2 hover:text-wine">
                      {copy.plans.termsLink}
                    </Link>
                  </p>
                </>
              )}
              <p className="mt-6 text-[0.98rem] text-wine/70">{copy.plans.single(single)}</p>
            </div>
          </div>
        </section>

        {/* 4. Rekenvoorbeeld */}
        {example ? (
          <section className="py-16 sm:py-20">
            <div className="mx-auto max-w-xl px-5">
              <Reveal className="text-center">
                <p className={eyebrowClass}>{copy.example.eyebrow}</p>
                <h2 className={`${h2Class} mt-3`}>{copy.example.title}</h2>
              </Reveal>
              <Reveal delay={0.08}>
                <div className="mt-9 overflow-hidden rounded-[1.5rem] border border-wine/8 bg-white shadow-[0_12px_32px_rgba(43,13,18,0.06)]">
                  <div className="flex items-center justify-between gap-4 px-6 py-5">
                    <span className="text-[1.02rem] text-wine/70">{copy.example.single(example.sundays)}</span>
                    <span className="font-serif text-[1.6rem] text-wine/45 line-through decoration-wine/30">
                      €{formatPlanEuros(example.singleTotalCents, locale)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-wine/8 bg-[#fcf4f2] px-6 py-5">
                    <span className="text-[1.02rem] font-semibold text-wine">{copy.example.member}</span>
                    <span className="font-serif text-[1.9rem] font-medium text-burgundy">
                      €{formatPlanEuros(example.memberCents, locale)}
                    </span>
                  </div>
                </div>
                <p className="mt-4 text-center text-sm text-wine/55">{copy.example.note}</p>
              </Reveal>
            </div>
          </section>
        ) : null}

        {/* 5. Hoe het werkt */}
        <section className="border-t border-wine/8 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
            <Reveal className="text-center">
              <p className={eyebrowClass}>{copy.how.eyebrow}</p>
              <h2 className={`${h2Class} mt-3`}>{copy.how.title}</h2>
            </Reveal>
            <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-14">
              <Reveal className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] lg:aspect-[4/5]">
                <Image
                  src={HOW_PHOTO}
                  alt={copy.how.imageAlt}
                  fill
                  quality={90}
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover object-[55%_50%]"
                />
              </Reveal>
              <ol className="relative space-y-8">
                <span aria-hidden className="absolute bottom-6 left-[1.45rem] top-6 w-px bg-gold/40" />
                {copy.how.steps.map((step, index) => (
                  <Reveal key={step.title} delay={index * 0.08}>
                    <li className="relative flex gap-5">
                      <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-cream text-[1rem] font-semibold tabular-nums text-burgundy">
                        {index + 1}
                      </span>
                      <div className="pt-1.5">
                        <h3 className="font-serif text-[1.5rem] font-medium leading-tight text-wine">{step.title}</h3>
                        <p className="mt-2 text-[0.98rem] leading-relaxed text-wine/70">{step.body}</p>
                      </div>
                    </li>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* 6. Reviews */}
        {testimonials.length > 0 ? (
          <section className="py-16 sm:py-20">
            <div className="mx-auto max-w-5xl px-5 sm:px-8">
              <Reveal className="text-center">
                <p className={eyebrowClass}>{copy.reviews.eyebrow}</p>
                <h2 className={`${h2Class} mt-3`}>{copy.reviews.title}</h2>
              </Reveal>
              <div className="mt-10 grid gap-4 lg:grid-cols-3">
                {testimonials.map((t, index) => (
                  <Reveal key={t.name} delay={index * 0.08} className="h-full">
                    <figure className="h-full rounded-[1.5rem] border border-wine/10 bg-white/80 p-6 shadow-[0_12px_32px_rgba(43,13,18,0.06)]">
                      <span aria-hidden className="block font-serif text-4xl leading-none text-gold">
                        &ldquo;
                      </span>
                      <blockquote className="-mt-2 font-serif text-[1.18rem] leading-snug text-wine">{t.quote}</blockquote>
                      <figcaption className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-wine/55">
                        {t.name}
                        <span className="font-normal normal-case tracking-normal text-wine/45"> · {displayCity(t.city, locale)}</span>
                      </figcaption>
                    </figure>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* 7. FAQ */}
        <section id="faq" className="border-t border-wine/8 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-2xl px-5 sm:px-8">
            <Reveal className="text-center">
              <p className={eyebrowClass}>{copy.faq.eyebrow}</p>
              <h2 className={`${h2Class} mt-3`}>{copy.faq.title}</h2>
            </Reveal>
            <JouwTafelFaq items={copy.faq.items({ single })} />
          </div>
        </section>

        {/* 8. Afsluiter */}
        <section ref={closingRef} className="relative overflow-hidden py-20 sm:py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(197,154,91,0.16),transparent_60%)]" />
          <Reveal className="relative mx-auto max-w-xl px-5 text-center">
            <span aria-hidden className="mx-auto block h-px w-12 bg-gold" />
            <h2 className={`${h2Class} mt-6`}>{isMember ? copy.member.title : copy.closing.title}</h2>
            <div className="mt-8">
              <button type="button" onClick={() => void join("final")} disabled={busy} className={`${primaryCta} w-full sm:w-auto`}>
                {isMember ? copy.member.choose : busy ? copy.plans.busy : copy.closing.cta}
                <span aria-hidden>&rarr;</span>
              </button>
            </div>
            {isMember ? null : <p className="mt-3 text-xs text-wine/50">{copy.closing.note}</p>}
          </Reveal>
        </section>

        <footer className="border-t border-wine/8 px-5 py-8 text-center text-xs text-wine/45">
          <nav className="flex items-center justify-center gap-5">
            <Link href={termsPath(locale)} className="underline-offset-4 hover:text-wine hover:underline">
              {copy.footer.terms}
            </Link>
            <Link href={privacyPath(locale)} className="underline-offset-4 hover:text-wine hover:underline">
              {copy.footer.privacy}
            </Link>
          </nav>
          <p className="mt-3">© MyTable</p>
        </footer>

        {/* Mobile sticky CTA with the chosen plan. */}
        <div
          className={`fixed inset-x-0 bottom-0 z-[48] border-t border-wine/10 bg-cream/95 shadow-[0_-12px_36px_rgba(43,13,18,0.14)] backdrop-blur-md transition-transform duration-300 lg:hidden ${
            showSticky ? "translate-y-0" : "pointer-events-none translate-y-full"
          }`}
          style={{ paddingBottom: "max(0.65rem, env(safe-area-inset-bottom))" }}
          aria-hidden={!showSticky}
          inert={!showSticky}
        >
          <div className="mx-auto max-w-xl px-4 pt-2.5">
            <button type="button" onClick={() => void join("sticky")} disabled={busy} className={`${primaryCta} w-full`}>
              {busy ? ctaLabel : copy.plans.cta(planName)}
            </button>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}

function PlanCard({
  selected,
  disabled,
  copy,
  onSelect,
}: {
  selected: boolean;
  disabled: boolean;
  copy: ReturnType<ReturnType<typeof getMembershipPageCopy>["plans"]["plan"]>;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={`relative flex h-full w-full touch-manipulation flex-col rounded-[1.5rem] border px-4 py-4 text-left transition-[border-color,background-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-default sm:p-6 ${
        selected
          ? "border-burgundy bg-[#fcf4f2] shadow-[inset_0_0_0_1px_var(--burgundy),0_10px_28px_rgba(90,15,27,0.12)]"
          : "border-wine/[0.1] bg-white shadow-[0_1px_2px_rgba(43,13,18,0.04),0_8px_22px_rgba(43,13,18,0.05)]"
      }`}
    >
      {/* Phone: radio, name and badge left, price right. Desktop: stacked. */}
      <span className="flex items-start gap-3 lg:flex-col lg:gap-0">
        <span
          aria-hidden
          className={`mt-1 flex h-[1.4rem] w-[1.4rem] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors lg:absolute lg:right-6 lg:top-6 lg:mt-0 ${
            selected ? "border-burgundy bg-burgundy text-cream" : "border-wine/20 bg-white text-transparent"
          }`}
        >
          <CheckIcon className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-serif text-[1.4rem] font-medium leading-tight text-wine">{copy.name}</span>
          {copy.badge ? (
            <span
              className={`mt-1.5 inline-block rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] ${
                selected ? "bg-burgundy text-cream" : "bg-gold/[0.18] text-[#7d5c2c]"
              }`}
            >
              {copy.badge}
            </span>
          ) : null}
        </span>
        <span className="shrink-0 text-right lg:mt-5 lg:flex lg:items-baseline lg:gap-1.5 lg:text-left">
          <span className="block font-serif text-[2.1rem] font-medium leading-none tracking-tight text-burgundy lg:text-[2.5rem]">
            {copy.price}
          </span>
          <span className="mt-1 block text-[0.8rem] text-wine/60 lg:mt-0 lg:text-[0.95rem]">{copy.priceUnit}</span>
        </span>
      </span>
      <span className="mt-3 pl-[2.15rem] text-[0.9rem] leading-snug text-wine/65 lg:pl-0">{copy.line}</span>
    </button>
  );
}

function MemberBanner({ locale, state }: { locale: Locale; state: MembershipPageState }) {
  const copy = getMembershipPageCopy(locale);
  if (state.kind === "pending") {
    return (
      <div role="status" className="mx-5 mb-3 rounded-2xl bg-white px-5 py-4 text-center shadow-[0_6px_18px_rgba(43,13,18,0.06)] sm:mx-auto sm:max-w-md">
        <p className="text-[0.95rem] font-medium text-wine">{copy.welcome.pending}</p>
      </div>
    );
  }
  if (state.kind !== "member") return null;
  const planName = copy.plans.plan(state.plan).name;
  return (
    <div
      role="status"
      className="mx-5 mb-3 rounded-[1.5rem] border border-gold/30 bg-white px-5 py-5 text-center shadow-[0_10px_28px_rgba(43,13,18,0.07)] sm:mx-auto sm:max-w-md"
    >
      <span aria-hidden className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-burgundy text-cream">
        <CheckIcon className="h-5 w-5" />
      </span>
      <p className="mt-3 font-serif text-[1.5rem] leading-tight text-wine">{state.welcome ? copy.welcome.title : copy.member.title}</p>
      <p className="mt-1.5 text-[0.95rem] leading-relaxed text-wine/70">
        {state.welcome ? copy.welcome.body : copy.member.body(planName)}
      </p>
      {state.bookedSunday ? (
        <p className="mt-1.5 text-[0.95rem] font-semibold text-burgundy">{copy.welcome.booked(state.bookedSunday)}</p>
      ) : null}
      <div className="mt-4 flex flex-col gap-1">
        <Link href={jouwTafelKiesPath(locale)} className={`${primaryCta} w-full`}>
          {copy.welcome.choose}
        </Link>
        <Link href={jouwTafelSettingsPath(locale)} className={`${secondaryCta} w-full`}>
          {copy.member.settings}
        </Link>
      </div>
    </div>
  );
}
