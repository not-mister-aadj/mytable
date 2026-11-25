"use client";

import { useState, type ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { CheckIcon } from "@/components/jouw-tafel/icons";
import { SundayTableIntroForm } from "@/components/booking/SundayTableIntroForm";
import type { Locale } from "@/i18n/config";
import type { SundayTableIntro } from "@/lib/sunday-table-intro";
import { TELL_FRIENDS_COPY } from "@/lib/tafelvrienden/tell-friends-copy";

const COPY = {
  nl: {
    paid: (sunday: string | null) => (sunday ? `Betaald. Je plek op ${sunday} staat vast.` : "Betaald. Je plek staat vast."),
    step: (n: number, of: number) => `Stap ${n} van ${of}`,
    yes: "Ja, laat het ze weten",
    no: "Nee, liever niet",
    skip: "Overslaan",
    failed: "Dat lukte niet. Probeer het opnieuw.",
  },
  en: {
    paid: (sunday: string | null) => (sunday ? `Paid. Your seat on ${sunday} is yours.` : "Paid. Your seat is yours."),
    step: (n: number, of: number) => `Step ${n} of ${of}`,
    yes: "Yes, let them know",
    no: "No thanks",
    skip: "Skip",
    failed: "That didn't work. Please try again.",
  },
} as const;

/** The frame of the steps between paying and the confirmation: paid, and which step this is. */
function StepShell({ locale, sunday, step, children }: { locale: Locale; sunday: string | null; step: { n: number; of: number }; children: ReactNode }) {
  const t = COPY[locale === "en" ? "en" : "nl"];
  return (
    <main className="relative min-h-dvh overflow-hidden bg-wine text-cream">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-burgundy/70 blur-3xl" />
        <div className="absolute bottom-[-220px] right-[-160px] h-[460px] w-[460px] rounded-full bg-gold/10 blur-3xl" />
      </div>
      <div className="relative border-b border-wine/10 bg-cream text-wine">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-5 py-3 sm:px-6">
          <Logo priority />
          <p className="flex items-center gap-2 text-right text-[13px] font-medium leading-snug sm:text-sm">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-700 text-cream">
              <CheckIcon className="h-3 w-3" />
            </span>
            {t.paid(sunday)}
          </p>
        </div>
      </div>
      <div className="relative mx-auto max-w-2xl px-5 pb-14 pt-10 sm:px-6 sm:pt-16">
        <div className="flex items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{t.step(step.n, step.of)}</p>
          <span aria-hidden className="flex gap-1.5">
            {Array.from({ length: step.of }, (_, i) => (
              <span key={i} className={`h-1.5 w-6 rounded-full ${i < step.n ? "bg-gold" : "bg-cream/20"}`} />
            ))}
          </span>
        </div>
        {children}
      </div>
    </main>
  );
}

/**
 * Step: "Laat je tafelvrienden weten dat je komt?", for a booker with a
 * mutual like who did not see the checkbox in the card (not signed in).
 * Yes or no is saved on the booking; both go on.
 */
export function TellFriendsStep({
  locale,
  sessionId,
  sunday,
  step,
  onDone,
}: {
  locale: Locale;
  sessionId: string;
  sunday: string | null;
  step: { n: number; of: number };
  onDone: () => void;
}) {
  const l = locale === "en" ? "en" : "nl";
  const t = COPY[l];
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const answer = async (tell: boolean) => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    const ok = await fetch("/api/booking/tell-friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, tell }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { ok?: boolean } | null) => Boolean(d?.ok))
      .catch(() => false);
    setBusy(false);
    // A "no" that did not save changes nothing: it stays unnamed.
    if (ok || !tell) onDone();
    else setFailed(true);
  };
  return (
    <StepShell locale={locale} sunday={sunday} step={step}>
      <h1 className="mt-3 font-serif text-[2.3rem] font-medium leading-[1.08] tracking-tight text-cream sm:text-[3.2rem]">{TELL_FRIENDS_COPY[l].title}</h1>
      <p className="mt-5 max-w-xl text-base leading-relaxed text-cream/80 sm:text-lg">{TELL_FRIENDS_COPY[l].note}</p>
      <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => void answer(true)}
          disabled={busy}
          className="rounded-full bg-cream px-7 py-3.5 text-[0.95rem] font-semibold text-wine transition hover:bg-white disabled:opacity-60"
        >
          {busy ? "…" : t.yes}
        </button>
        <button
          type="button"
          onClick={() => void answer(false)}
          disabled={busy}
          className="rounded-full px-5 py-3 text-[0.95rem] font-medium text-cream/70 transition hover:text-cream disabled:opacity-60"
        >
          {t.no}
        </button>
      </div>
      {failed ? <p className="mt-3 text-sm text-cream">{t.failed}</p> : null}
    </StepShell>
  );
}

/** Step: "Meet your table", the questions for the seating, saved or skipped. */
export function IntroStep({
  locale,
  sessionId,
  sunday,
  step,
  city,
  bookingCode,
  seats,
  initial,
  reusable,
  onDone,
}: {
  locale: Locale;
  sessionId: string;
  sunday: string | null;
  step: { n: number; of: number };
  city: string;
  bookingCode?: string | null;
  seats?: number | null;
  initial: SundayTableIntro | null;
  reusable: boolean;
  onDone: () => void;
}) {
  const t = COPY[locale === "en" ? "en" : "nl"];
  return (
    <StepShell locale={locale} sunday={sunday} step={step}>
      <div className="mt-6 text-wine [&>section]:!pb-0">
        <SundayTableIntroForm
          locale={locale}
          city={city}
          auth={{ sessionId }}
          bookingCode={bookingCode}
          seats={seats}
          initial={initial}
          reusable={reusable}
          onSaved={onDone}
        />
      </div>
      <button type="button" onClick={onDone} className="mt-5 text-[0.95rem] font-medium text-cream/70 underline-offset-4 transition hover:text-cream hover:underline">
        {t.skip}
      </button>
    </StepShell>
  );
}
