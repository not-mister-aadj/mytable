"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeftIcon, CheckIcon } from "@/components/jouw-tafel/icons";
import { CHIP_TONE, spotsChip } from "@/components/jouw-tafel/quiz/QuizChoose";
import { primaryButton, secondaryButton } from "@/components/jouw-tafel/quiz/quiz-ui";
import type { Locale } from "@/i18n/config";
import { displayCity, type QuizEvent } from "@/lib/jouw-tafel/logic";
import { getQuizCopy } from "@/lib/jouw-tafel/quiz-copy";
import { getTableCopy } from "@/lib/jouw-tafel/table-copy";
import type { TableState } from "@/lib/jouw-tafel/table-logic";
import { trackTableEvent } from "@/lib/posthog/analytics";
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
      <div className="mx-auto grid h-14 w-full max-w-md grid-cols-[3rem_1fr_3rem] items-center px-2">
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

function ListSection({ title, items, numbered = false }: { title: string; items: string[]; numbered?: boolean }) {
  return (
    <section className="mt-9">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">{title}</h2>
      <ul className="mt-4 space-y-3.5">
        {items.map((item, i) => (
          <li key={item} className="flex items-start gap-3.5 text-[1rem] leading-relaxed text-wine/85">
            <span
              aria-hidden
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-white text-[0.8rem] font-semibold text-burgundy"
            >
              {numbered ? i + 1 : <CheckIcon className="h-3.5 w-3.5" />}
            </span>
            {item}
          </li>
        ))}
      </ul>
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
      <main className="mx-auto w-full max-w-md px-5">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-1 aspect-[4/3] overflow-hidden rounded-[1.75rem]"
        >
          <Image src={PHOTO} alt={t.imageAlt} fill priority sizes="(min-width: 480px) 448px, 100vw" className="object-cover object-[35%_55%]" />
        </motion.div>

        <h1 className="mt-6 font-serif text-[2.4rem] font-medium leading-[1.05] tracking-tight text-wine">{t.title}</h1>
        <p className="mt-2 text-[1.02rem] text-wine/75">
          {t.dateLine(tableDate(event.startsAt, locale), time, city)}
        </p>
        <p className="mt-3">
          <span className={`inline-block rounded-full px-2.5 py-1 text-[0.78rem] font-semibold leading-none ${CHIP_TONE[chip.tone]}`}>
            {chip.text}
          </span>
        </p>

        <ListSection title={t.how.title} items={t.how.steps(time)} numbered />
        <ListSection title={t.expect.title} items={t.expect.items} />
        <ListSection title={t.good.title} items={t.good.items} />
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
