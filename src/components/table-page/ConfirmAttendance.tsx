"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { confirmAttendanceAction } from "@/app/[locale]/aan-tafel/[token]/actions";

const COPY = {
  nl: {
    title: "Kom je zondag?",
    yes: "Ja, ik kom",
    sending: "Even geduld...",
    doneTitle: "Je staat erbij.",
    later: "Volgende week zondag hoor je waar je aan tafel zit.",
    soon: "Je tafel rekent op je.",
    table: "Naar je tafelpagina",
    error: "Dat lukte niet. Probeer het opnieuw.",
  },
  en: {
    title: "Are you coming on Sunday?",
    yes: "Yes, I'm coming",
    sending: "One moment...",
    doneTitle: "You're in.",
    later: "Next Sunday you'll hear where you'll be seated.",
    soon: "Your table counts on you.",
    table: "To your table page",
    error: "That didn't work. Please try again.",
  },
} as const;

const card = "rounded-3xl border border-gold/30 bg-cream px-6 py-8 text-center shadow-[0_20px_50px_rgba(43,13,18,0.06)] sm:px-8";

/**
 * The page behind "Ja, ik kom": the yes is saved as the page opens in a real
 * browser (a mail scanner that only fetches the link does not count), so one
 * tap in the mail is enough.
 */
export function ConfirmAttendance({
  token,
  locale,
  when,
  placeKnown,
  confirmed,
  tableHref,
}: {
  token: string;
  locale: "nl" | "en";
  /** "Zondag 13 december om 14:00 in Amsterdam." */
  when: string;
  /** The location mail is out: nothing more to wait for. */
  placeKnown: boolean;
  confirmed: boolean;
  tableHref: string;
}) {
  const t = COPY[locale];
  const [done, setDone] = useState(confirmed);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();
  const asked = useRef(false);
  const confirm = () =>
    start(async () => {
      setError(false);
      const r = await confirmAttendanceAction(token);
      if (r.ok) setDone(true);
      else setError(true);
    });
  useEffect(() => {
    if (confirmed || asked.current) return;
    asked.current = true;
    confirm();
    // Once, when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (done) {
    return (
      <section className={card}>
        <p className="font-serif text-3xl text-wine">{t.doneTitle}</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-wine/70">
          {when} {placeKnown ? t.soon : t.later}
        </p>
        <Link href={tableHref} className="mt-6 inline-flex rounded-full bg-burgundy px-6 py-3 text-sm font-semibold text-cream hover:bg-burgundy/90">
          {t.table}
        </Link>
      </section>
    );
  }
  return (
    <section className={card}>
      <h1 className="font-serif text-3xl font-medium text-wine">{t.title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-wine/70">{when}</p>
      <button type="button" disabled={pending} onClick={confirm} className="mt-6 rounded-full bg-burgundy px-7 py-3 text-sm font-semibold text-cream transition hover:bg-burgundy/90 disabled:opacity-50">
        {pending ? t.sending : t.yes}
      </button>
      {error ? <p className="mt-3 text-sm text-red-800">{t.error}</p> : null}
    </section>
  );
}
