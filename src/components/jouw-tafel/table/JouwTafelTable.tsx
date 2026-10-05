"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeftIcon, CheckIcon } from "@/components/jouw-tafel/icons";
import { CHIP_TONE, spotsChip } from "@/components/jouw-tafel/quiz/QuizChoose";
import { primaryButton, secondaryButton } from "@/components/jouw-tafel/quiz/quiz-ui";
import type { Locale } from "@/i18n/config";
import { displayCity, type QuizEvent } from "@/lib/jouw-tafel/logic";
import { getQuizCopy } from "@/lib/jouw-tafel/quiz-copy";
import { getTableCopy } from "@/lib/jouw-tafel/table-copy";
import type { TableState } from "@/lib/jouw-tafel/table-logic";
import { trackTableEvent } from "@/lib/posthog/analytics";
import { TestimonialMarquee } from "@/components/TestimonialMarquee";
import { getBrandLandingTestimonialRows } from "@/data/brand-landing-testimonials";
import { PostHogEvents } from "@/lib/posthog/events";

const PHOTO = "/girls-only/wine-tasting-toast.jpg";
const AMSTERDAM = "Europe/Amsterdam";

export function tableDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", {
    timeZone: AMSTERDAM,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
}

export function tableTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "nl-NL", {
    timeZone: AMSTERDAM,
    hour: locale === "en" ? "numeric" : "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Header with the back arrow to "Kies je zondag". */
export function TableHeader({ href, label, title }: { href: string; label: string; title?: string }) {
  return (
    <header className="sticky top-0 z-30 bg-cream/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-cream/80">
      <div className="mx-auto grid h-14 w-full max-w-md sm:max-w-2xl grid-cols-[3rem_1fr_3rem] items-center px-2">
        <Link
          href={href}
          aria-label={label}
          className="flex h-11 w-11 items-center justify-center rounded-full text-wine transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/50 active:scale-95 active:bg-wine/5"
        >
          <ArrowLeftIcon className="h-[1.35rem] w-[1.35rem]" />
        </Link>
        <p className="text-center text-[0.9rem] font-semibold text-wine">{title}</p>
        <span />
      </div>
    </header>
  );
}

/** "Nog twijfels?": the same questions block as the Sunday Social pages. */
function TableFaq({ faq }: { faq: { eyebrow: string; title: string; items: { q: string; a: string }[] } }) {
  return (
    <section className="mt-12 border-t border-wine/10 pt-10">
      <p className={eyebrowClass}>{faq.eyebrow}</p>
      <h2 className="mt-3 font-serif text-[1.6rem] font-medium leading-tight tracking-tight text-wine">{faq.title}</h2>
      <div className="mt-6 divide-y divide-wine/10 rounded-[1.5rem] border border-wine/10 bg-white/70 px-5 shadow-[0_20px_50px_rgba(43,13,18,0.06)]">
        {faq.items.map((item) => (
          <details key={item.q} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-[1.1rem] font-medium leading-snug tracking-tight text-wine [&::-webkit-details-marker]:hidden">
              {item.q}
              <span
                aria-hidden
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-wine/8 text-base leading-none text-wine/60 transition-transform duration-200 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-wine/65">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

const eyebrowClass = "text-[11px] font-semibold uppercase tracking-[0.28em] text-gold";

/** Small line icons for the steps, on a dark tile like the Sunday Social
 * pages: reserve, hear the venue, join the table, more tables. */
function StepIcon({ index }: { index: number }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (index === 0) {
    return (
      <svg {...common}>
        <path d="M4 8a2 2 0 0 0 0 4v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4a2 2 0 0 1 0-4V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v3Z" />
        <path d="M14 4v13" strokeDasharray="2 2" />
      </svg>
    );
  }
  if (index === 1) {
    return (
      <svg {...common}>
        <path d="M12 21s-6-5.6-6-11a6 6 0 1 1 12 0c0 5.4-6 11-6 11Z" />
        <circle cx="12" cy="10" r="2.2" />
      </svg>
    );
  }
  if (index === 2) {
    return (
      <svg {...common}>
        <path d="M8 3h8l-.6 6.2A3.4 3.4 0 0 1 12 12.3a3.4 3.4 0 0 1-3.4-3.1L8 3Z" />
        <path d="M12 12.3V20M8.5 20h7" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="8" cy="9" r="2.6" />
      <circle cx="16" cy="9" r="2.6" />
      <path d="M3.5 19c.6-2.8 2.4-4.3 4.5-4.3s3.9 1.5 4.5 4.3M11.5 19c.6-2.8 2.4-4.3 4.5-4.3s3.9 1.5 4.5 4.3" />
    </svg>
  );
}

/** "Zo werkt het": each step on a dark icon tile. */
function StepsSection({ title, steps }: { title: string; steps: string[] }) {
  return (
    <section className="mt-12">
      <p className={eyebrowClass}>{title}</p>
      <ol className="mt-6 space-y-5">
        {steps.map((step, i) => (
          <li key={step} className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-wine text-cream">
              <StepIcon index={i} />
            </span>
            <p className="font-serif text-[1.15rem] font-medium leading-snug tracking-tight text-wine">{step}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

const EXPECT_PHOTOS = [
  "/girls-only/wine-tasting-conversation.jpg",
  "/girls-only/table-wine-laughing.jpg",
  "/girls-only/smiling-glasses.jpg",
  "/girls-only/wine-tasting-presenter.jpg",
  "/girls-only/duo-table.jpg",
];

const arrowClass =
  "flex h-9 w-9 items-center justify-center rounded-full border border-wine/15 bg-white/70 text-wine transition hover:bg-white disabled:cursor-default disabled:opacity-30";

/** "Wat je kunt verwachten": a sideways row of photo cards, one line each.
 * Swipe on a phone; arrows and dots for a mouse. */
function ExpectSection({ title, items, locale }: { title: string; items: string[]; locale: Locale }) {
  const rowRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [atEnd, setAtEnd] = useState(false);

  const onScroll = () => {
    const row = rowRef.current;
    if (!row) return;
    const card = row.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 12 : row.clientWidth;
    setActive(Math.min(items.length - 1, Math.round(row.scrollLeft / step)));
    setAtEnd(row.scrollLeft + row.clientWidth >= row.scrollWidth - 4);
  };

  const scrollToCard = (index: number) => {
    const row = rowRef.current;
    const card = row?.children[index] as HTMLElement | undefined;
    if (!row || !card) return;
    const first = row.firstElementChild as HTMLElement;
    row.scrollTo({ left: card.offsetLeft - first.offsetLeft, behavior: "smooth" });
  };

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between gap-4">
        <p className={eyebrowClass}>{title}</p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            aria-label={locale === "en" ? "Previous" : "Vorige"}
            onClick={() => scrollToCard(Math.max(0, active - 1))}
            disabled={active === 0}
            className={arrowClass}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            aria-label={locale === "en" ? "Next" : "Volgende"}
            onClick={() => scrollToCard(Math.min(items.length - 1, active + 1))}
            disabled={atEnd}
            className={arrowClass}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
      <ul
        ref={rowRef}
        onScroll={onScroll}
        className={`-mx-5 mt-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:scroll-px-0 sm:px-0 [&::-webkit-scrollbar]:hidden ${
          atEnd ? "" : "sm:[mask-image:linear-gradient(to_right,black_80%,transparent)]"
        }`}
      >
        {items.map((item, i) => (
          <li key={item} className="w-[72%] shrink-0 snap-start sm:w-[15rem]">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-wine/10">
              <Image
                src={EXPECT_PHOTOS[i % EXPECT_PHOTOS.length]!}
                alt=""
                fill
                sizes="(min-width: 640px) 240px, 72vw"
                quality={90}
                className="object-cover"
              />
            </div>
            <p className="mt-3 font-serif text-[1.08rem] font-medium leading-snug tracking-tight text-wine">{item}</p>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
        {items.map((item, i) => (
          <span
            key={item}
            className={`h-1.5 rounded-full transition-all ${i === active ? "w-5 bg-wine" : "w-1.5 bg-wine/20"}`}
          />
        ))}
      </div>
    </section>
  );
}

/** "Goed om te weten": the practical points in one white card. */
function GoodToKnow({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="mt-12">
      <p className={eyebrowClass}>{title}</p>
      <ul className="mt-5 space-y-3.5 rounded-[1.5rem] border border-wine/10 bg-white/70 p-5 shadow-[0_20px_50px_rgba(43,13,18,0.05)]">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 text-[0.98rem] leading-relaxed text-wine/80">
            <span aria-hidden className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
              <CheckIcon className="h-3.5 w-3.5" />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export type TableStats = { meetNewPeople: number; solo: number; discoverPlaces: number; justForFun: number };

/** "Waarom mensen bij MyTable komen" plus the guests' own words, as on the
 * Sunday Social pages. */
function WhyPeopleCome({ locale, stats }: { locale: Locale; stats: TableStats }) {
  const t = getTableCopy(locale);
  // A 0% says nothing, so those are left out (and the grid with them).
  const items = [stats.meetNewPeople, stats.solo, stats.discoverPlaces, stats.justForFun]
    .map((value, i) => ({ value, label: t.stats.labels[i]! }))
    .filter((item) => item.value > 0);
  const people = getBrandLandingTestimonialRows(locale).people;
  return (
    <section className="mt-12 border-t border-wine/10 pt-10">
      <p className={eyebrowClass}>{t.stats.eyebrow}</p>
      <h2 className="mt-3 font-serif text-[1.6rem] font-medium leading-tight tracking-tight text-wine text-balance">
        {t.stats.title}
      </h2>
      {items.length > 0 ? (
        <div className="mt-7 grid grid-cols-2 gap-6">
          {items.map((item) => (
            <div key={item.label}>
              <p className="font-serif text-3xl font-medium text-wine">{item.value}%</p>
              <p className="mt-1 text-sm leading-snug text-wine/60">{item.label}</p>
            </div>
          ))}
        </div>
      ) : null}
      <div className="-mx-5 overflow-hidden">
        <TestimonialMarquee top={people} bottom={[]} fadeFromClassName="from-cream" cardClassName="border-wine/10 bg-white/80" singleRow />
      </div>
    </section>
  );
}

/**
 * The table page after "Kies je zondag": what the Sunday is like, then one
 * sticky button. No price here (that is the reserve step), never a venue.
 * `cta` replaces the default button (the membership branch uses it).
 */
export function JouwTafelTable({
  locale,
  event,
  state,
  email,
  kiesHref,
  reserveHref,
  cta,
  chip: chipOverride,
  stats,
}: {
  locale: Locale;
  event: QuizEvent;
  state: TableState;
  email: string;
  kiesHref: string;
  reserveHref: string;
  cta?: ReactNode;
  /** Replaces the spots chip (a non-member's "Te boeken vanaf ..."). */
  chip?: { text: string; tone: keyof typeof CHIP_TONE };
  /** "Waarom mensen bij MyTable komen" (real waitlist numbers); the block
   * is left out without them. */
  stats?: TableStats | null;
}) {
  const t = getTableCopy(locale);
  const k = getQuizCopy(locale).kies;
  const reduceMotion = useReducedMotion();
  const chip = chipOverride ?? spotsChip(event, locale, k);
  const time = tableTime(event.startsAt, locale);
  const city = displayCity(event.city, locale);

  useEffect(() => {
    trackTableEvent(PostHogEvents.tablePageViewed, { event_slug: event.slug, state, locale });
  }, [event.slug, state, locale]);

  return (
    <div className="min-h-[100svh] bg-cream pb-36 text-wine">
      <TableHeader href={kiesHref} label={t.back} />
      <main className="mx-auto w-full max-w-md px-5 sm:max-w-2xl sm:px-8">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-1 aspect-[4/3] sm:aspect-[16/9] overflow-hidden rounded-[1.75rem] shadow-[0_24px_60px_rgba(43,13,18,0.18)]"
        >
          <Image src={PHOTO} alt={t.imageAlt} fill priority sizes="(min-width: 640px) 608px, 100vw" quality={90} className="object-cover object-[35%_55%]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#14060a]/45 to-transparent" />
          <span
            className={`absolute left-4 top-4 inline-flex items-center rounded-full px-3.5 py-2 text-xs font-semibold backdrop-blur-sm ${
              chip.tone === "grey" ? "bg-[#14060a]/50 text-cream" : "bg-gold text-wine"
            }`}
          >
            {chip.text}
          </span>
        </motion.div>

        <p className={`mt-7 ${eyebrowClass}`}>
          {t.title} · {city}
        </p>
        <h1 className="mt-3 font-serif text-[2.4rem] font-medium leading-[1.05] tracking-tight text-wine">{t.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-wine/15 bg-beige/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-wine/80">
            {t.sizeTag}
          </span>
        </div>
        <p className="mt-3 text-lg font-medium text-wine/90 first-letter:uppercase">
          {tableDate(event.startsAt, locale)} · {time}
        </p>

        <StepsSection title={t.how.title} steps={t.how.steps(time)} />
        <ExpectSection title={t.expect.title} items={t.expect.items} locale={locale} />
        <GoodToKnow title={t.good.title} items={t.good.items} />
        {stats ? <WhyPeopleCome locale={locale} stats={stats} /> : null}
        <TableFaq faq={t.faq} />
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-wine/10 bg-cream/95 backdrop-blur-md">
        <div className="mx-auto w-full max-w-md px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          {cta ?? <DefaultCta locale={locale} event={event} state={state} email={email} reserveHref={reserveHref} />}
        </div>
      </div>
    </div>
  );
}

function DefaultCta({
  locale,
  event,
  state,
  email,
  reserveHref,
}: {
  locale: Locale;
  event: QuizEvent;
  state: TableState;
  email: string;
  reserveHref: string;
}) {
  const t = getTableCopy(locale);
  if (state === "open") {
    return (
      <Link
        href={reserveHref}
        onClick={() => trackTableEvent(PostHogEvents.tableReserveClicked, { event_slug: event.slug, locale })}
        className={primaryButton}
      >
        {t.cta.reserve}
      </Link>
    );
  }
  if (state === "soon") return <NotifyButton locale={locale} eventId={event.id} email={email} />;
  return (
    <button type="button" disabled className={primaryButton}>
      {state === "sold_out" ? t.cta.soldOut : t.cta.closed}
    </button>
  );
}

/** "Houd me op de hoogte" for a Binnenkort table (the event's notify list). */
export function NotifyButton({ locale, eventId, email }: { locale: Locale; eventId: string; email: string }) {
  const t = getTableCopy(locale);
  const [state, setState] = useState<"idle" | "busy" | "done" | "failed">("idle");
  async function notify() {
    if (state === "busy" || state === "done") return;
    setState("busy");
    try {
      const res = await fetch(`/api/events/${eventId}/notify-me`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
      setState(res.ok ? "done" : "failed");
    } catch {
      setState("failed");
    }
  }
  return (
    <>
      <button type="button" onClick={() => void notify()} disabled={state === "busy" || state === "done"} className={state === "done" ? secondaryButton : primaryButton}>
        {state === "busy" ? t.cta.notifyBusy : state === "done" ? t.cta.notifyDone : t.cta.notify}
      </button>
      {state === "failed" ? <p role="alert" className="mt-2 text-center text-sm font-semibold text-red-600">{t.cta.notifyFailed}</p> : null}
    </>
  );
}
