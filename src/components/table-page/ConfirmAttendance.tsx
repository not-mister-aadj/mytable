"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { confirmAttendanceAction } from "@/app/[locale]/aan-tafel/[token]/actions";

const COPY = {
  nl: {
    kicker: "Zondag",
    title: (venue: string) => `Kom je zondag bij ${venue}?`,
    body: "Je tafel rekent op je. Laat het even weten, dan houden we bij het indelen rekening met je.",
    yes: "Ja, ik kom",
    sending: "Even geduld...",
    doneTitle: "Top, tot zondag",
    doneBody: "Je tafel rekent op je. Zaterdag krijg je je groepsnummer en zie je wie er aanschuiven.",
    table: "Naar je tafelpagina",
    cant: "Kun je toch niet? Laat het ons dan vandaag nog weten via info@mytable.club, zodat we je plek aan iemand anders kunnen geven.",
    error: "Dat lukte niet. Probeer het opnieuw.",
  },
  en: {
    kicker: "Sunday",
    title: (venue: string) => `Are you coming to ${venue} on Sunday?`,
    body: "Your table counts on you. Let us know, and we'll keep you in mind when we seat everyone.",
    yes: "Yes, I'm coming",
    sending: "One moment...",
    doneTitle: "Great, see you Sunday",
    doneBody: "Your table counts on you. On Saturday you'll get your group number and see who's joining.",
    table: "To your table page",
    cant: "Can't make it after all? Let us know today at info@mytable.club, so we can give your seat to someone else.",
    error: "That didn't work. Please try again.",
  },
} as const;

const card = "rounded-3xl border border-gold/30 bg-cream px-6 py-8 shadow-[0_20px_50px_rgba(43,13,18,0.06)] sm:px-8";

/** The page behind "Ja, ik kom": one more tap, so a mail scanner opening the link doesn't count as a yes. */
export function ConfirmAttendance({
  token,
  locale,
  venue,
  confirmed,
  tableHref,
}: {
  token: string;
  locale: "nl" | "en";
  venue: string;
  confirmed: boolean;
  tableHref: string;
}) {
  const t = COPY[locale];
  const [done, setDone] = useState(confirmed);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();

  if (done) {
    return (
      <section className={`${card} text-center`}>
        <p className="font-serif text-3xl text-wine">{t.doneTitle}</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-wine/70">{t.doneBody}</p>
        <Link href={tableHref} className="mt-6 inline-flex rounded-full bg-burgundy px-6 py-3 text-sm font-semibold text-cream hover:bg-burgundy/90">
          {t.table}
        </Link>
      </section>
    );
  }
  return (
    <section className={card}>
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-wine/45">{t.kicker}</p>
      <h1 className="mt-1 font-serif text-3xl font-medium text-wine sm:text-4xl">{t.title(venue)}</h1>
      <p className="mt-2 text-sm leading-relaxed text-wine/70">{t.body}</p>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await confirmAttendanceAction(token);
            if (r.ok) setDone(true);
            else setError(true);
          })
        }
        className="mt-6 rounded-full bg-burgundy px-7 py-3 text-sm font-semibold text-cream transition hover:bg-burgundy/90 disabled:opacity-50"
      >
        {pending ? t.sending : t.yes}
      </button>
      {error ? <p className="mt-3 text-sm text-red-800">{t.error}</p> : null}
      <p className="mt-6 text-xs leading-relaxed text-wine/55">{t.cant}</p>
    </section>
  );
}
