"use client";

import { useEffect, useRef, useState } from "react";
import type { TableGame as Game } from "@/lib/table-game";
import { trackTableGame } from "@/lib/posthog/analytics";

export type TableGameCopy = {
  label: string;
  /** With {time}. */
  soonTitle: string;
  soonBody: string;
  title: string;
  lead: string;
  start: string;
  /** Round labels, each with {n}. */
  roundNames: string;
  roundGuess: string;
  roundQuestions: string;
  namesTitle: string;
  namesBody: string;
  guessHint: string;
  yours: string;
  reveal: string;
  /** With {name}. */
  revealed: string;
  next: string;
  previous: string;
  /** With {n} and {total}. */
  card: string;
  doneTitle: string;
  doneBody: string;
  again: string;
};

type Step = { kind: "intro" } | { kind: "names" } | { kind: "guess"; i: number } | { kind: "question"; i: number } | { kind: "done" };

/**
 * The table game: before the start a teaser, from the start until the page
 * closes the two rounds. Everyone at the table sees the same cards in the
 * same order (lib/table-game.ts); whoever has the card reads it out.
 */
export function TableGame({
  game,
  copy,
  startsAt,
  timeLabel,
  myBookingId,
  city,
}: {
  game: Game;
  copy: TableGameCopy;
  startsAt: string;
  timeLabel: string;
  myBookingId: string;
  city: string;
}) {
  const startMs = Date.parse(startsAt);
  const [open, setOpen] = useState(() => Date.now() >= startMs);
  const [step, setStep] = useState<Step>({ kind: "intro" });
  const [shown, setShown] = useState(false);
  const tracked = useRef(new Set<string>());

  // The teaser turns into the game at the start, without a reload.
  useEffect(() => {
    if (open) return;
    const timer = window.setInterval(() => {
      if (Date.now() >= startMs) setOpen(true);
    }, 20_000);
    return () => window.clearInterval(timer);
  }, [open, startMs]);

  const track = (what: "started" | "questions" | "finished") => {
    if (tracked.current.has(what)) return;
    tracked.current.add(what);
    trackTableGame({ step: what, city, guesses: game.guesses.length });
  };

  const go = (next: Step) => {
    setShown(false);
    setStep(next);
    if (next.kind === "names") track("started");
    if (next.kind === "question") track("questions");
    if (next.kind === "done") track("finished");
  };
  // First a round of names (nobody knows them yet), then guessing by pointing, then the questions.
  const firstStep = (): Step => ({ kind: "names" });
  const afterNames = (): Step => (game.guesses.length > 0 ? { kind: "guess", i: 0 } : { kind: "question", i: 0 });
  const afterGuess = (i: number): Step => (i + 1 < game.guesses.length ? { kind: "guess", i: i + 1 } : { kind: "question", i: 0 });

  const shell = "rounded-3xl border border-gold/30 bg-cream px-6 py-7 shadow-[0_20px_50px_rgba(43,13,18,0.06)] sm:px-8";
  const solid = "rounded-full bg-burgundy px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-burgundy/90";
  const quiet = "text-sm text-wine/60 underline-offset-4 hover:text-wine hover:underline";

  if (!open) {
    return (
      <section className={shell}>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">{copy.label}</p>
        <h2 className="mt-2 font-serif text-2xl font-medium text-wine">{copy.soonTitle.replace("{time}", timeLabel)}</h2>
        <p className="mt-2 text-sm leading-relaxed text-wine/70">{copy.soonBody}</p>
      </section>
    );
  }

  const cardOf = (n: number, total: number) => copy.card.replace("{n}", String(n)).replace("{total}", String(total));
  const roundOf = (label: string, n: number) => label.replace("{n}", String(n));
  const questionsRound = game.guesses.length > 0 ? 3 : 2;
  return (
    <section className={shell} aria-live="polite">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">
        {step.kind === "names"
          ? roundOf(copy.roundNames, 1)
          : step.kind === "guess"
            ? roundOf(copy.roundGuess, 2)
            : step.kind === "question"
              ? roundOf(copy.roundQuestions, questionsRound)
              : copy.label}
      </p>

      {step.kind === "intro" ? (
        <>
          <h2 className="mt-2 font-serif text-2xl font-medium text-wine">{copy.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-wine/70">{copy.lead}</p>
          <button type="button" onClick={() => go(firstStep())} className={`${solid} mt-5`}>
            {copy.start}
          </button>
        </>
      ) : step.kind === "names" ? (
        <>
          <h2 className="mt-2 font-serif text-2xl font-medium text-wine">{copy.namesTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-wine/70">{copy.namesBody}</p>
          <div className="mt-5 flex justify-end">
            <button type="button" onClick={() => go(afterNames())} className={solid}>
              {copy.next}
            </button>
          </div>
        </>
      ) : step.kind === "guess" ? (
        (() => {
          const card = game.guesses[step.i]!;
          const mine = card.bookingId === myBookingId;
          return (
            <>
              <p className="mt-3 text-sm text-wine/60">{card.prompt}</p>
              <p className="mt-2 font-serif text-2xl leading-snug text-burgundy">&ldquo;{card.answer}&rdquo;</p>
              {/* No names to tap: everyone points at the person they think it is. */}
              {mine ? <p className="mt-3 text-sm text-wine/70">{copy.yours}</p> : <p className="mt-3 text-sm text-wine/70">{copy.guessHint}</p>}
              {shown ? <p className="mt-4 font-serif text-lg text-wine">{copy.revealed.replace("{name}", card.name)}</p> : null}
              <div className="mt-5 flex items-center justify-between">
                <span className="text-xs text-wine/50">{cardOf(step.i + 1, game.guesses.length)}</span>
                {shown ? (
                  <button type="button" onClick={() => go(afterGuess(step.i))} className={solid}>
                    {copy.next}
                  </button>
                ) : (
                  <button type="button" onClick={() => setShown(true)} className={solid}>
                    {copy.reveal}
                  </button>
                )}
              </div>
            </>
          );
        })()
      ) : step.kind === "question" ? (
        <>
          <p className="mt-3 font-serif text-2xl leading-snug text-burgundy">{game.questions[step.i]}</p>
          <div className="mt-6 flex items-center justify-between">
            {step.i > 0 ? (
              <button type="button" onClick={() => go({ kind: "question", i: step.i - 1 })} className={quiet}>
                {copy.previous}
              </button>
            ) : (
              <span className="text-xs text-wine/50">{cardOf(1, game.questions.length)}</span>
            )}
            {step.i > 0 ? <span className="text-xs text-wine/50">{cardOf(step.i + 1, game.questions.length)}</span> : null}
            <button
              type="button"
              onClick={() => go(step.i + 1 < game.questions.length ? { kind: "question", i: step.i + 1 } : { kind: "done" })}
              className={solid}
            >
              {copy.next}
            </button>
          </div>
        </>
      ) : (
        <>
          <h2 className="mt-2 font-serif text-2xl font-medium text-wine">{copy.doneTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-wine/70">{copy.doneBody}</p>
          <button type="button" onClick={() => go(firstStep())} className={`${quiet} mt-4`}>
            {copy.again}
          </button>
        </>
      )}
    </section>
  );
}
