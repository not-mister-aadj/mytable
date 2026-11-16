"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { moveSeatAction } from "@/app/[locale]/aan-tafel/[token]/actions";

export type MoveSeatOption = { eventId: string; label: string };

const COPY = {
  nl: {
    title: "Naar welke zondag wil je?",
    body: (own: string) => `Je staat nu op ${own}. Verzetten kan tot 7 dagen vooraf.`,
    move: "Verzet mijn plek",
    sending: "Even geduld...",
    none: "Er is nu geen andere zondag open in jouw steden.",
    back: "Terug naar je tafelpagina",
    doneTitle: "Je plek is verzet.",
    doneBody: (to: string) => `Je schuift nu aan op ${to}. Je krijgt er een mail van.`,
    table: "Naar je tafelpagina",
    taken: "Die zondag is net vol geraakt. Kies een andere.",
    error: "Dat lukte niet. Probeer het opnieuw.",
  },
  en: {
    title: "Which Sunday would you like?",
    body: (own: string) => `You're now booked for ${own}. You can move until 7 days before.`,
    move: "Move my seat",
    sending: "One moment...",
    none: "There's no other Sunday open in your cities right now.",
    back: "Back to your table page",
    doneTitle: "Your seat has been moved.",
    doneBody: (to: string) => `You're now joining on ${to}. We've sent you a mail about it.`,
    table: "To your table page",
    taken: "That Sunday just filled up. Pick another one.",
    error: "That didn't work. Please try again.",
  },
} as const;

const card = "rounded-3xl border border-gold/30 bg-cream px-6 py-8 shadow-[0_20px_50px_rgba(43,13,18,0.06)] sm:px-8";
const cta = "inline-flex rounded-full bg-burgundy px-6 py-3 text-sm font-semibold text-cream transition hover:bg-burgundy/90 disabled:opacity-50";

/** "Ik wil verzetten": pick one of the open Sundays, one tap to move. */
export function MoveSeat({
  token,
  locale,
  own,
  options,
  tableHref,
}: {
  token: string;
  locale: "nl" | "en";
  /** "zondag 13 december in Amsterdam". */
  own: string;
  options: MoveSeatOption[];
  tableHref: string;
}) {
  const t = COPY[locale];
  const [picked, setPicked] = useState(options[0]?.eventId ?? "");
  const [done, setDone] = useState<{ label: string; tableUrl: string } | null>(null);
  const [error, setError] = useState<"taken" | "failed" | null>(null);
  const [pending, start] = useTransition();

  if (done) {
    return (
      <section className={`${card} text-center`}>
        <p className="font-serif text-3xl text-wine">{t.doneTitle}</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-wine/70">{t.doneBody(done.label)}</p>
        <Link href={done.tableUrl} className={`mt-6 ${cta}`}>
          {t.table}
        </Link>
      </section>
    );
  }
  return (
    <section className={card}>
      <h1 className="font-serif text-3xl font-medium text-wine sm:text-4xl">{t.title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-wine/70">{t.body(own)}</p>
      {options.length === 0 ? (
        <p className="mt-5 text-sm text-wine/70">{t.none}</p>
      ) : (
        <div role="radiogroup" aria-label={t.title} className="mt-5 space-y-2">
          {options.map((o) => {
            const on = o.eventId === picked;
            return (
              <button
                key={o.eventId}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setPicked(o.eventId)}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition ${on ? "border-burgundy bg-white text-wine" : "border-gold/30 bg-white/60 text-wine/80 hover:border-burgundy/50"}`}
              >
                <span className={`h-4 w-4 shrink-0 rounded-full border ${on ? "border-burgundy bg-burgundy shadow-[inset_0_0_0_3px_white]" : "border-wine/30"}`} />
                <span className="font-medium">{o.label}</span>
              </button>
            );
          })}
        </div>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-4">
        {options.length > 0 ? (
          <button
            type="button"
            disabled={pending || !picked}
            onClick={() =>
              start(async () => {
                setError(null);
                const r = await moveSeatAction(token, picked, locale);
                if (r.ok) setDone({ label: r.label, tableUrl: r.tableUrl });
                else setError(r.error === "taken" ? "taken" : "failed");
              })
            }
            className={cta}
          >
            {pending ? t.sending : t.move}
          </button>
        ) : null}
        <Link href={tableHref} className="text-sm text-wine/60 underline underline-offset-4 hover:text-burgundy">
          {t.back}
        </Link>
      </div>
      {error ? <p className="mt-3 text-sm text-red-800">{error === "taken" ? t.taken : t.error}</p> : null}
    </section>
  );
}
