"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { GuessCard, TableGame as Game } from "@/lib/table-game";
import { trackTableGame } from "@/lib/posthog/analytics";

export type TableGameCopy = {
  label: string;
  /** With {time}. */
  soonTitle: string;
  soonBody: string;
  title: string;
  lead: string;
  start: string;
  namesTitle: string;
  namesBody: string;
  namesDone: string;
  turnTitle: string;
  turnBody: string;
  deckGuess: string;
  deckQuestion: string;
  /** With {n}. */
  left: string;
  guessEmpty: string;
  guessHint: string;
  flip: string;
  /** With {name}. */
  revealed: string;
  revealedBody: string;
  questionHint: string;
  pass: string;
};

type View =
  | { kind: "intro" }
  | { kind: "names" }
  | { kind: "table" }
  | { kind: "guess"; card: GuessCard; flipped: boolean }
  | { kind: "question"; text: string };

const CARD = "relative mx-auto aspect-[5/7] w-full max-w-[260px] rounded-[1.4rem] shadow-[0_18px_40px_rgba(43,13,18,0.22)]";
const solid = "rounded-full bg-burgundy px-6 py-3 text-sm font-semibold text-cream transition hover:bg-burgundy/90";
const spring = { type: "spring" as const, stiffness: 220, damping: 22 };

/**
 * The table game as a deck of cards. Whoever holds the phone plays: tap a
 * deck ("Raad wie" or "Vraag"), the card turns over, then pass the turn. No
 * phone has to match another (lib/table-game.ts).
 */
export function TableGame({
  game,
  copy,
  startsAt,
  timeLabel,
  city,
}: {
  game: Game;
  copy: TableGameCopy;
  startsAt: string;
  timeLabel: string;
  city: string;
}) {
  const startMs = Date.parse(startsAt);
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(() => Date.now() >= startMs);
  const [view, setView] = useState<View>({ kind: "intro" });
  const [gi, setGi] = useState(0);
  const [qi, setQi] = useState(0);
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

  const guessesLeft = game.guesses.length - gi;
  const drawGuess = () => {
    const card = game.guesses[gi];
    if (!card) return;
    setGi(gi + 1);
    setView({ kind: "guess", card, flipped: false });
    track("finished");
  };
  const drawQuestion = () => {
    // The questions go round again once all have been played.
    setView({ kind: "question", text: game.questions[qi % game.questions.length]! });
    setQi(qi + 1);
    track("questions");
  };

  const shell = "rounded-3xl border border-gold/30 bg-cream px-6 py-7 shadow-[0_20px_50px_rgba(43,13,18,0.06)] sm:px-8";
  const enter = reduce ? { opacity: 0 } : { opacity: 0, y: 40, rotate: -4, scale: 0.96 };
  const settle = { opacity: 1, y: 0, rotate: 0, scale: 1 };

  if (!open) {
    return (
      <section className={shell}>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">{copy.label}</p>
        <h2 className="mt-2 font-serif text-2xl font-medium text-wine">{copy.soonTitle.replace("{time}", timeLabel)}</h2>
        <p className="mt-2 text-sm leading-relaxed text-wine/70">{copy.soonBody}</p>
      </section>
    );
  }

  return (
    <section className={shell} aria-live="polite">
      <AnimatePresence mode="wait">
        {view.kind === "intro" ? (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">{copy.label}</p>
            <h2 className="mt-2 font-serif text-2xl font-medium text-wine">{copy.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-wine/70">{copy.lead}</p>
            <button
              type="button"
              onClick={() => {
                setView({ kind: "names" });
                track("started");
              }}
              className={`${solid} mt-5`}
            >
              {copy.start}
            </button>
          </motion.div>
        ) : view.kind === "names" ? (
          <motion.div key="names" initial={enter} animate={settle} exit={{ opacity: 0, y: -20 }} transition={spring}>
            <Face tone="light" corner="1">
              <p className="font-serif text-[1.7rem] leading-tight text-wine">{copy.namesTitle}</p>
              <p className="mt-3 text-sm leading-relaxed text-wine/70">{copy.namesBody}</p>
            </Face>
            <div className="mt-6 flex justify-center">
              <button type="button" onClick={() => setView({ kind: "table" })} className={solid}>
                {copy.namesDone}
              </button>
            </div>
          </motion.div>
        ) : view.kind === "table" ? (
          <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="text-center font-serif text-2xl text-wine">{copy.turnTitle}</p>
            <p className="mt-1 text-center text-sm text-wine/60">{copy.turnBody}</p>
            <div className={`mt-6 grid gap-5 ${game.guesses.length > 0 ? "grid-cols-2" : "mx-auto max-w-[170px] grid-cols-1"}`}>
              {game.guesses.length > 0 ? (
                <Deck
                  tone="dark"
                  title={copy.deckGuess}
                  note={guessesLeft > 0 ? copy.left.replace("{n}", String(guessesLeft)) : copy.guessEmpty}
                  disabled={guessesLeft <= 0}
                  onDraw={drawGuess}
                />
              ) : null}
              <Deck tone="light" title={copy.deckQuestion} note={copy.left.replace("{n}", String(Math.max(game.questions.length - qi, 0)))} onDraw={drawQuestion} />
            </div>
          </motion.div>
        ) : view.kind === "guess" ? (
          <motion.div key={`g-${view.card.bookingId}`} initial={enter} animate={settle} exit={{ opacity: 0, y: -20 }} transition={spring}>
            {/* Tap the card to turn it over: who said it. */}
            <button type="button" aria-label={copy.flip} onClick={() => setView({ ...view, flipped: !view.flipped })} className="block w-full [perspective:1200px]">
              <motion.div
                className={`${CARD} [transform-style:preserve-3d]`}
                animate={{ rotateY: view.flipped ? 180 : 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
              >
                <div className="absolute inset-0 [backface-visibility:hidden]">
                  <Face tone="dark" corner="?" fill>
                    <p className="text-xs text-cream/60">{view.card.prompt}</p>
                    <p className="mt-3 font-serif text-[1.9rem] leading-tight text-cream">&ldquo;{view.card.answer}&rdquo;</p>
                    <p className="mt-5 text-xs text-gold">{copy.guessHint}</p>
                  </Face>
                </div>
                <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <Face tone="light" corner="!" fill>
                    <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-burgundy font-serif text-3xl text-cream">
                      {view.card.name.charAt(0).toUpperCase()}
                    </span>
                    <p className="mt-4 font-serif text-[1.7rem] leading-tight text-wine">{copy.revealed.replace("{name}", view.card.name)}</p>
                    <p className="mt-2 text-sm text-wine/70">{copy.revealedBody}</p>
                  </Face>
                </div>
              </motion.div>
            </button>
            <div className="mt-6 flex justify-center">
              {view.flipped ? (
                <button type="button" onClick={() => setView({ kind: "table" })} className={solid}>
                  {copy.pass}
                </button>
              ) : (
                <button type="button" onClick={() => setView({ ...view, flipped: true })} className={solid}>
                  {copy.flip}
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key={`q-${qi}`} initial={enter} animate={settle} exit={{ opacity: 0, y: -20 }} transition={spring}>
            <Face tone="light" corner="?">
              <p className="font-serif text-[1.7rem] leading-tight text-wine">{view.text}</p>
              <p className="mt-5 text-xs text-wine/55">{copy.questionHint}</p>
            </Face>
            <div className="mt-6 flex justify-center">
              <button type="button" onClick={() => setView({ kind: "table" })} className={solid}>
                {copy.pass}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/** One side of a playing card: a frame, corner marks, the text in the middle. */
function Face({ tone, corner, fill = false, children }: { tone: "dark" | "light"; corner: string; fill?: boolean; children: React.ReactNode }) {
  const dark = tone === "dark";
  return (
    <div className={`${fill ? "h-full w-full rounded-[1.4rem]" : CARD} ${dark ? "bg-wine" : "bg-white"} p-2.5`}>
      <div className={`relative flex h-full flex-col items-center justify-center rounded-[1rem] border px-5 py-8 text-center ${dark ? "border-gold/40" : "border-gold/50"}`}>
        <span className={`absolute left-3 top-2 font-serif text-lg ${dark ? "text-gold" : "text-burgundy"}`}>{corner}</span>
        <span className={`absolute bottom-2 right-3 rotate-180 font-serif text-lg ${dark ? "text-gold" : "text-burgundy"}`}>{corner}</span>
        <div>{children}</div>
      </div>
    </div>
  );
}

/** A face-down deck: tap to draw the top card. */
function Deck({ tone, title, note, disabled = false, onDraw }: { tone: "dark" | "light"; title: string; note: string; disabled?: boolean; onDraw: () => void }) {
  const dark = tone === "dark";
  const back = dark ? "bg-wine border-gold/40" : "bg-white border-gold/60";
  return (
    <button type="button" onClick={onDraw} disabled={disabled} className="group text-center disabled:opacity-40">
      <div className="relative mx-auto aspect-[5/7] w-full max-w-[150px]">
        {/* Two cards under the top one: a stack. */}
        <div className={`absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-2xl border ${back} opacity-60`} />
        <div className={`absolute inset-0 translate-x-[3px] translate-y-[3px] rounded-2xl border ${back} opacity-80`} />
        <div
          className={`absolute inset-0 flex items-center justify-center rounded-2xl border-2 ${back} shadow-[0_10px_24px_rgba(43,13,18,0.18)] transition group-enabled:group-hover:-translate-y-1 group-enabled:group-active:scale-95`}
        >
          <div className={`flex h-[82%] w-[78%] items-center justify-center rounded-xl border px-2 ${dark ? "border-gold/40" : "border-gold/50"}`}>
            <span className={`font-serif text-lg leading-tight ${dark ? "text-cream" : "text-wine"}`}>{title}</span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-wine/55">{note}</p>
    </button>
  );
}
