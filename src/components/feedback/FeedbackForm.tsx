"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { bookFreeSeatAction, completeFeedbackAction, saveFeedbackAction } from "@/app/[locale]/hoe-was-het/[token]/actions";
import type { FeedbackPage, FeedbackState, Mood } from "@/lib/feedback";
import { DISLIKED_LABELS, DISLIKED_REASONS, LIKED_LABELS, LIKED_REASONS, orderFor } from "@/lib/feedback-reasons";

const COPY = {
  nl: {
    moodTitle: (name: string, venue: string | null, city: string) =>
      `${name ? `Hoi ${name}, hoe` : "Hoe"} was het gezelschap ${venue ? `bij ${venue}` : `in ${city}`}?`,
    moodSub: "Een paar korte vragen, 1 minuut.",
    moods: { great: "Geweldig", good: "Leuk", meh: "Matig", bad: "Niet leuk" } as Record<Mood, string>,
    thanks: (name: string) => (name ? `Dank je, ${name}!` : "Dank je!"),
    thanksSub: "We lezen alles.",
    thanksPicked: "Kiest iemand jou ook, dan hoor je het woensdag.",
    reservePrice: "Reserveer · €10",
    memberLine: "Vaker komen? Als lid ben je elke Sunday Social welkom voor €10 per maand.",
    memberLink: "Word lid",
    missingQuiet: "Was er iemand van je tafel niet? Tik wie, alleen voor ons.",
    venueKicker: "De bar",
    venue: (venue: string) => `En ${venue} zelf?`,
    venueHint: "De plek, de wijn, de bediening.",
    stars: (n: number) => (n === 1 ? "1 ster" : `${n} sterren`),
    liked: "Wat maakte het zo leuk?",
    likedGood: "Wat vond je het leukst?",
    improve: "Wat kan beter?",
    pickHint: "Tik aan wat klopt, meer mag ook.",
    improveHint: "Tik aan wat klopt, meer mag ook. Alleen voor ons, we lezen alles.",
    more: "Vertel er iets meer over (mag ook leeg)",
    wantTitle: "Wie wil je vaker zien?",
    wantNote: "Kiezen jullie elkaar, dan is de kans groter dat we jullie weer bij elkaar zetten. Niemand ziet wat je aanvinkt.",
    nextTitle: "Je volgende zondag",
    seats: (n: number) => `nog ${n} ${n === 1 ? "plek" : "plekken"}`,
    reserve: "Reserveer",
    noNext: "Bekijk de Sunday Socials",
    contact: "Mogen we contact met je opnemen om het goed te maken?",
    save: "Versturen",
    next: "Volgende",
    skip: "Overslaan",
    back: "Terug",
    saving: "Bezig…",
    thanksSorry: "Dank je dat je het eerlijk zegt.",
    sorryBody:
      "Niet elke tafel klikt meteen, dat hoort erbij. Elke Sunday Social zit je met andere mensen, en met wat je ons net vertelde delen we je de volgende keer beter in.",
    freeTitle: "Je volgende ticket is op ons",
    freeBody: "Boek hier gratis je ticket voor de volgende Sunday Social.",
    freeCta: "Reserveer gratis",
    freeSmall: "Alleen als je nu hier boekt · eenmalig · voor jezelf",
    freeDone: (label: string) => `Je gratis ticket staat: ${label}. De bevestiging komt in je mail.`,
    freeBooked: (label: string) => `Je gratis ticket staat al: ${label}.`,
    freeFull: "Die datum is net vol. Kies een andere.",
    error: "Opslaan lukte niet. Probeer het opnieuw.",
  },
  en: {
    moodTitle: (name: string, venue: string | null, city: string) =>
      `${name ? `Hi ${name}, how` : "How"} was the company ${venue ? `at ${venue}` : `in ${city}`}?`,
    moodSub: "A few short questions, 1 minute.",
    moods: { great: "Amazing", good: "Nice", meh: "So-so", bad: "Not great" } as Record<Mood, string>,
    thanks: (name: string) => (name ? `Thank you, ${name}!` : "Thank you!"),
    thanksSub: "We read everything.",
    thanksPicked: "If someone picks you too, you'll hear on Wednesday.",
    reservePrice: "Reserve · €10",
    memberLine: "Coming more often? As a member you're welcome at every Sunday Social for €10 a month.",
    memberLink: "Become a member",
    missingQuiet: "Was anyone from your table not there? Tap who, only for us.",
    venueKicker: "The bar",
    venue: (venue: string) => `And ${venue} itself?`,
    venueHint: "The place, the wine, the service.",
    stars: (n: number) => (n === 1 ? "1 star" : `${n} stars`),
    liked: "What made it so good?",
    likedGood: "What did you like most?",
    improve: "What could be better?",
    pickHint: "Tap what fits, more than one is fine.",
    improveHint: "Tap what fits, more than one is fine. Only for us, we read everything.",
    more: "Tell us a bit more (optional)",
    wantTitle: "Who would you like to see again?",
    wantNote: "If you choose each other, we're more likely to seat you together again. Nobody sees what you tick.",
    nextTitle: "Your next Sunday",
    seats: (n: number) => `${n} ${n === 1 ? "seat" : "seats"} left`,
    reserve: "Reserve",
    noNext: "See the Sunday Socials",
    contact: "May we contact you to make it right?",
    save: "Send",
    next: "Next",
    skip: "Skip",
    back: "Back",
    saving: "Saving…",
    thanksSorry: "Thank you for being honest.",
    sorryBody:
      "Not every table clicks straight away, that's part of it. Every Sunday Social you sit with different people, and with what you just told us we'll seat you better next time.",
    freeTitle: "Your next ticket is on us",
    freeBody: "Book your ticket for the next Sunday Social here, for free.",
    freeCta: "Book for free",
    freeSmall: "Only when you book here now · one time only · for yourself",
    freeDone: (label: string) => `Your free ticket is booked: ${label}. The confirmation is on its way to your inbox.`,
    freeBooked: (label: string) => `Your free ticket is already booked: ${label}.`,
    freeFull: "That date just filled up. Pick another one.",
    error: "Saving didn't work. Please try again.",
  },
} as const;

const FACE: Record<Mood, { bg: string; mouth: string }> = {
  great: { bg: "#1f9d55", mouth: "M9 14.5c1.6 2.2 4.4 2.2 6 0" },
  good: { bg: "#8cc795", mouth: "M9.5 15c1.4 1 3.6 1 5 0" },
  meh: { bg: "#e9a2a2", mouth: "M9.5 16c1.4-1 3.6-1 5 0" },
  bad: { bg: "#d64550", mouth: "M9 16.5c1.6-2.2 4.4-2.2 6 0" },
};

function Face({ mood, size = 52 }: { mood: Mood; size?: number }) {
  const f = FACE[mood];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="11" fill={f.bg} />
      <circle cx="9" cy="10" r="1.2" fill="#fff" />
      <circle cx="15" cy="10" r="1.2" fill="#fff" />
      <path d={f.mouth} stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** 1 to 5 stars; the stars up to the one tapped light up. */
function Stars({ value, onPick, label }: { value: number | null; onPick: (n: number) => void; label: (n: number) => string }) {
  const [hover, setHover] = useState<number | null>(null);
  const lit = hover ?? value ?? 0;
  return (
    <div className="mt-4 flex gap-1" onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onPick(n)}
          onMouseEnter={() => setHover(n)}
          aria-label={label(n)}
          aria-pressed={value === n}
          className="rounded-lg p-1 transition hover:scale-110"
        >
          <svg viewBox="0 0 24 24" className={`h-10 w-10 transition ${n <= lit ? "fill-gold text-gold" : "fill-transparent text-wine/25"}`} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden>
            <path d="M12 2.8l2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.3l-5.7 3 1.1-6.3-4.6-4.5 6.4-.9z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

/** Only the two outer faces get a word, so the words don't steer the answer. */
function Faces({ value, onPick, labels, size }: { value: Mood | null; onPick: (m: Mood) => void; labels: Record<Mood, string>; size?: number }) {
  return (
    <div className="mt-4 grid grid-cols-4 gap-2">
      {(["great", "good", "meh", "bad"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onPick(m)}
          aria-pressed={value === m}
          aria-label={labels[m]}
          className={`flex flex-col items-center gap-1.5 rounded-2xl px-1 py-2 transition ${
            value === m ? "scale-105 bg-white shadow-sm ring-1 ring-wine/10" : value ? "opacity-35 hover:opacity-70" : "hover:bg-white/60"
          }`}
        >
          <Face mood={m} size={size} />
          <span className={`h-4 whitespace-nowrap text-xs transition ${value === m ? "font-semibold text-wine" : "text-wine/60"}`}>{labels[m]}</span>
        </button>
      ))}
    </div>
  );
}

const card = "rounded-3xl border border-gold/30 bg-cream px-6 py-7 shadow-[0_20px_50px_rgba(43,13,18,0.06)] sm:px-8";
const field =
  "mt-2 w-full rounded-xl border border-wine/15 bg-white px-3.5 py-2.5 text-sm text-wine shadow-sm placeholder:text-wine/35 focus:border-burgundy/40 focus:outline-none focus:ring-2 focus:ring-burgundy/10";

/** Links from the last screen carry where they came from, so a booking made
 * after the feedback shows as "feedback" in the sources (utm_content: which button). */
function fromFeedback(href: string, content: string): string {
  const [rest, hash] = href.split("#");
  const url = new URL(rest!, "https://www.mytable.club");
  url.searchParams.set("utm_source", "mytable");
  url.searchParams.set("utm_medium", "feedback");
  url.searchParams.set("utm_campaign", "feedback");
  url.searchParams.set("utm_content", content);
  return `${url.pathname}${url.search}${hash ? `#${hash}` : ""}`;
}

type Step = "mood" | "venue" | "liked" | "improve" | "want";

/** One question per screen: which ones depend on the first answer. Who
 * they'd like to see again comes right after, before anyone drops off. */
function stepsFor(mood: Mood | null, hasMates: boolean): Step[] {
  const okish = mood === "great" || mood === "good";
  return [
    "mood",
    ...(mood && mood !== "bad" && hasMates ? (["want"] as const) : []),
    "venue",
    ...(okish ? (["liked"] as const) : []),
    ...(mood && mood !== "great" ? (["improve"] as const) : []),
  ];
}

export function FeedbackForm({ page, token, mailAnswer = null }: { page: FeedbackPage; token: string; /** The answer tapped in the mail. */ mailAnswer?: Mood | null }) {
  const t = COPY[page.locale];
  const venue = page.venueName ?? page.city;
  // A tap in the mail is the first answer, unless they answered before.
  const fromMail = !page.saved.completed && !page.saved.mood ? mailAnswer : null;
  const [state, setState] = useState<FeedbackState>(() => (fromMail ? { ...page.saved, mood: fromMail } : page.saved));
  // Back on the page after finishing (for instance as a new member): the last screen.
  const [sent, setSent] = useState(page.saved.completed);
  // Came through an answer in the mail: on with the next question.
  const [step, setStep] = useState(mailAnswer && !page.saved.completed ? 1 : 0);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();
  // Saved from the browser, not when the link is fetched: a mail scanner
  // that opens the link leaves no answer behind.
  const savedFromMail = useRef(false);
  useEffect(() => {
    if (!fromMail || savedFromMail.current) return;
    savedFromMail.current = true;
    start(async () => {
      const r = await saveFeedbackAction(token, { mood: fromMail });
      setError(!r.ok);
    });
  }, [fromMail, token]);
  const likedOrder = useMemo(() => orderFor(LIKED_REASONS, page.bookingId), [page.bookingId]);
  const dislikedOrder = useMemo(() => orderFor(DISLIKED_REASONS, page.bookingId), [page.bookingId]);

  const save = (patch: Partial<FeedbackState>) => {
    setState((s) => ({ ...s, ...patch }));
    start(async () => {
      const r = await saveFeedbackAction(token, patch);
      setError(!r.ok);
    });
  };

  const okish = state.mood === "great" || state.mood === "good";
  const hasMates = page.tablemates.length > 0;
  const steps = stepsFor(state.mood, hasMates);
  const current = steps[Math.min(step, steps.length - 1)]!;
  const last = step >= steps.length - 1;

  const finish = () =>
    start(async () => {
      const r = await completeFeedbackAction(token, state);
      if (r.ok) setSent(true);
      else setError(true);
    });
  const next = () => (last ? finish() : setStep((n) => n + 1));
  // A tap answers the question: a moment to see it, then on.
  const pickAndGo = (patch: Partial<FeedbackState>) => {
    save(patch);
    const at = step;
    window.setTimeout(() => setStep((n) => (n === at ? n + 1 : n)), 280);
  };

  const toggle = (key: "wantToSee" | "missing", id: string) =>
    save({ [key]: state[key].includes(id) ? state[key].filter((x) => x !== id) : [...state[key], id] } as Partial<FeedbackState>);

  const chips = (key: "wantToSee" | "missing") => (
    <div className="mt-4 flex flex-wrap gap-2">
      {page.tablemates.map((m) => {
        const on = state[key].includes(m.bookingId);
        return (
          <button
            key={m.bookingId}
            type="button"
            onClick={() => toggle(key, m.bookingId)}
            className={`inline-flex items-center gap-1.5 rounded-full py-1.5 text-sm transition ${
              key === "wantToSee" && m.photoUrl ? "pl-1.5 pr-3.5" : "px-3.5"
            } ${on ? "bg-burgundy text-cream" : "bg-white text-wine ring-1 ring-wine/15"}`}
          >
            {/* A face next to the name, where they pick who to see again. */}
            {key === "wantToSee" && m.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.photoUrl} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" />
            ) : null}
            <span>
              {on && key === "wantToSee" ? "✓ " : ""}
              {m.firstName}
            </span>
          </button>
        );
      })}
    </div>
  );

  if (sent) {
    // One next step: the next Sunday. Becoming a member is a line under it.
    const nextHref = page.next
      ? okish && !page.member
        ? fromFeedback(`${page.next.path}?ticket=deze-zondag#boeken`, "eenmalig")
        : fromFeedback(page.next.path, "volgende")
      : null;
    const memberHref = page.next ? fromFeedback(`${page.next.path}?ticket=elke-zondag#boeken`, "lid-en-reserveer") : fromFeedback(page.joinPath, "lid");
    const freeSeat = !okish && page.freeSeat && (page.freeSeat.booked || page.freeSeat.options.length > 0);
    return (
      <section className={`${card} text-center`}>
        <p className="font-serif text-3xl text-wine">{okish ? t.thanks(page.firstName) : t.thanksSorry}</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-wine/70">
          {okish ? `${t.thanksSub}${state.wantToSee.length > 0 ? ` ${t.thanksPicked}` : ""}` : t.sorryBody}
        </p>
        {freeSeat ? (
          <FreeSeat page={page} token={token} t={t} />
        ) : okish || state.mood === "meh" ? (
          <NextSunday page={page} t={t} href={nextHref} label={okish && !page.member ? t.reservePrice : t.reserve} />
        ) : null}
        {okish && !page.member ? (
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-wine/70">
            {t.memberLine}{" "}
            <Link href={memberHref} className="whitespace-nowrap font-semibold text-burgundy underline decoration-burgundy/30 underline-offset-4">
              {t.memberLink}
            </Link>
          </p>
        ) : null}
        {hasMates ? (
          <div className="mt-7 border-t border-wine/10 pt-4 text-left">
            <p className="text-sm text-wine/60">{t.missingQuiet}</p>
            {chips("missing")}
          </div>
        ) : null}
      </section>
    );
  }

  const reasonStep = (kind: "liked" | "improve") => {
    const listKey = kind === "liked" ? "liked" : "disliked";
    const textKey = kind === "liked" ? "highlight" : "improve";
    const order: readonly string[] = kind === "liked" ? likedOrder : dislikedOrder;
    const labels: Record<string, string> = kind === "liked" ? LIKED_LABELS[page.locale] : DISLIKED_LABELS[page.locale];
    const picked: readonly string[] = state[listKey];
    const answered = picked.length > 0 || state[textKey].trim() !== "";
    const title = kind === "improve" ? t.improve : state.mood === "good" ? t.likedGood : t.liked;
    return (
      <>
        <h1 className="font-serif text-2xl font-medium text-wine sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-wine/55">{kind === "improve" ? t.improveHint : t.pickHint}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {order.map((key) => {
            const on = picked.includes(key);
            return (
              <button
                key={key}
                type="button"
                aria-pressed={on}
                onClick={() => save({ [listKey]: on ? picked.filter((k) => k !== key) : [...picked, key] } as Partial<FeedbackState>)}
                className={`rounded-full px-3.5 py-2 text-sm transition ${on ? "bg-burgundy text-cream" : "bg-white text-wine ring-1 ring-wine/15 hover:ring-wine/30"}`}
              >
                {on ? "✓ " : ""}
                {labels[key]}
              </button>
            );
          })}
        </div>
        <label className="mt-5 block text-sm text-wine/70">
          {t.more}
          <textarea
            rows={3}
            className={field}
            value={state[textKey]}
            onChange={(e) => setState((s) => ({ ...s, [textKey]: e.target.value }))}
          />
        </label>
        {kind === "improve" && state.mood === "bad" ? (
          <label className="mt-4 flex items-start gap-3 text-sm text-wine">
            <input type="checkbox" className="mt-1" checked={state.contactOk} onChange={(e) => save({ contactOk: e.target.checked })} />
            {t.contact}
          </label>
        ) : null}
        {nav({ primary: answered ? (last ? t.save : t.next) : t.skip, primaryStyle: answered ? "solid" : "ghost", onPrimary: () => {
            save({ [textKey]: state[textKey] } as Partial<FeedbackState>);
            next();
          } })}
      </>
    );
  };

  const nav = ({ primary, onPrimary, primaryStyle = "solid" }: { primary: string; onPrimary: () => void; primaryStyle?: "solid" | "ghost" }) => {
    return (
      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          disabled={pending && last}
          onClick={onPrimary}
          className={`rounded-full px-6 py-3 text-sm font-semibold transition disabled:opacity-60 ${
            primaryStyle === "solid" ? "bg-burgundy text-cream hover:bg-burgundy/90" : "bg-white text-wine ring-1 ring-wine/15 hover:ring-wine/30"
          }`}
        >
          {pending && last ? t.saving : primary}
        </button>
        {step > 0 ? (
          <button type="button" onClick={() => setStep((n) => n - 1)} className="text-sm text-wine/55 hover:text-wine">
            {t.back}
          </button>
        ) : null}
        {error ? <span className="text-sm text-red-800">{t.error}</span> : null}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <section className={card}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">
            {page.dateLabel} · {page.city}
          </p>
          {state.mood ? (
            <span className="text-xs text-wine/45">
              {step + 1}/{steps.length}
            </span>
          ) : null}
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-wine/10">
          <div className="h-full rounded-full bg-burgundy transition-all" style={{ width: `${((step + 1) / (state.mood ? steps.length : 5)) * 100}%` }} />
        </div>

        <div className="mt-6">
          {current === "mood" ? (
            <>
              <h1 className="font-serif text-3xl font-medium text-wine text-balance sm:text-4xl">{t.moodTitle(page.firstName, page.venueName, page.city)}</h1>
              <p className="mt-1.5 text-sm text-wine/55">{t.moodSub}</p>
              <Faces value={state.mood} onPick={(m) => pickAndGo({ mood: m })} labels={t.moods} />
            </>
          ) : current === "venue" ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-wine/45">{t.venueKicker}</p>
              <h1 className="mt-1 font-serif text-3xl font-medium text-wine sm:text-4xl">{t.venue(venue)}</h1>
              <p className="mt-1 text-sm text-wine/55">{t.venueHint}</p>
              <Stars value={state.venueRating} onPick={(n) => pickAndGo({ venueRating: n })} label={t.stars} />
              {nav({ primary: t.skip, primaryStyle: "ghost", onPrimary: next })}
            </>
          ) : current === "liked" || current === "improve" ? (
            reasonStep(current)
          ) : (
            <>
              <h1 className="font-serif text-2xl font-medium text-wine sm:text-3xl">{t.wantTitle}</h1>
              <p className="mt-1 text-sm text-wine/55">{t.wantNote}</p>
              {chips("wantToSee")}
              {nav({ primary: state.wantToSee.length > 0 ? (last ? t.save : t.next) : t.skip, primaryStyle: state.wantToSee.length > 0 ? "solid" : "ghost", onPrimary: next })}
            </>
          )}
        </div>
      </section>

    </div>
  );
}

function FreeSeat({ page, token, t }: { page: FeedbackPage; token: string; t: (typeof COPY)["nl"] | (typeof COPY)["en"] }) {
  const options = page.freeSeat?.options ?? [];
  const [pick, setPick] = useState(options[0]?.eventId ?? "");
  const [done, setDone] = useState<string | null>(page.freeSeat?.booked ? t.freeBooked(page.freeSeat.booked) : null);
  const [full, setFull] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();
  if (done) return <p className="mx-auto mt-5 max-w-md rounded-2xl bg-white/70 px-4 py-3 text-sm font-medium text-wine ring-1 ring-wine/10">{done}</p>;
  const left = options.filter((o) => !full.includes(o.eventId));
  return (
    <div className="mt-6 rounded-2xl bg-white p-5 text-left ring-2 ring-burgundy shadow-[0_10px_30px_rgba(90,15,27,0.10)]">
      <p className="font-serif text-2xl text-wine">{t.freeTitle}</p>
      <p className="mt-1 text-sm text-wine/70">{t.freeBody}</p>
      <div className="mt-4 space-y-2">
        {left.map((o) => (
          <label key={o.eventId} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 ring-1 ring-wine/10 has-[:checked]:ring-burgundy">
            <input type="radio" name="free-seat" className="accent-burgundy" checked={pick === o.eventId} onChange={() => setPick(o.eventId)} />
            <span className="flex-1 text-sm text-wine">{o.label}</span>
            <span className="text-xs text-wine/50">{t.seats(o.seatsLeft)}</span>
          </label>
        ))}
      </div>
      {full.length > 0 ? <p className="mt-2 text-sm text-red-800">{t.freeFull}</p> : null}
      <button
        type="button"
        disabled={pending || !left.some((o) => o.eventId === pick)}
        onClick={() =>
          start(async () => {
            const r = await bookFreeSeatAction(token, pick);
            if (r.ok) setDone(t.freeDone(r.label));
            else if (r.error === "capacity") setFull((f) => [...f, pick]);
            else setError(true);
          })
        }
        className="mt-4 w-full rounded-full bg-burgundy px-5 py-3 text-sm font-semibold text-cream transition hover:bg-wine disabled:opacity-60"
      >
        {pending ? t.saving : t.freeCta}
      </button>
      {error ? <p className="mt-2 text-sm text-red-800">{t.error}</p> : null}
      <p className="mt-3 text-center text-xs text-wine/50">{t.freeSmall}</p>
    </div>
  );
}

function NextSunday({ page, t, href, label }: { page: FeedbackPage; t: (typeof COPY)["nl"] | (typeof COPY)["en"]; href: string | null; label: string }) {
  if (!page.next || !href) {
    return (
      <Link href={fromFeedback(page.cityPath, "steden")} className="mt-5 inline-flex rounded-full bg-burgundy px-5 py-2.5 text-sm font-semibold text-cream">
        {t.noNext}
      </Link>
    );
  }
  return (
    <div className="mt-6 rounded-2xl bg-white p-5 text-left ring-1 ring-wine/10">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">{t.nextTitle}</p>
      <p className="mt-1.5 text-lg font-semibold leading-snug text-wine first-letter:uppercase">{page.next.label}</p>
      <p className="text-sm text-wine/60">{page.next.city}</p>
      <p className="mt-2 inline-block rounded-full bg-burgundy/[0.09] px-2.5 py-1 text-xs font-semibold text-burgundy first-letter:uppercase">{t.seats(page.next.seatsLeft)}</p>
      <Link href={href} className="mt-4 block rounded-full bg-burgundy px-5 py-3 text-center text-sm font-semibold uppercase tracking-[0.08em] text-cream transition hover:bg-wine">
        {label}
      </Link>
    </div>
  );
}
