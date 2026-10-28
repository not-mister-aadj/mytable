"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { bookFreeSeatAction, completeFeedbackAction, saveFeedbackAction } from "@/app/[locale]/hoe-was-het/[token]/actions";
import type { FeedbackPage, FeedbackState, Mood } from "@/lib/feedback";
import { DISLIKED_LABELS, DISLIKED_REASONS, LIKED_LABELS, LIKED_REASONS, orderFor } from "@/lib/feedback-reasons";

const COPY = {
  nl: {
    title: (venue: string) => `Hoe was je middag bij ${venue}?`,
    moods: { great: "Geweldig", good: "Leuk", meh: "Matig", bad: "Niet leuk" } as Record<Mood, string>,
    venue: (venue: string) => `En hoe was ${venue}?`,
    liked: "Wat maakte het zo leuk?",
    likedGood: "Wat vond je het leukst?",
    improve: "Wat kan beter?",
    pickHint: "Tik aan wat klopt, meer mag ook.",
    improveHint: "Tik aan wat klopt, meer mag ook. Alleen voor ons, we lezen alles.",
    more: "Vertel er iets meer over (mag ook leeg)",
    wantTitle: "Wie wil je vaker zien?",
    membersOnly: "Alleen voor leden",
    wantNote: "Leden kiezen wie ze terugzien. Niemand ziet wat jij aanvinkt.",
    offerTitle: "Klikte het aan tafel? Zie ze terug.",
    offerBody: "Als lid kies je wie je vaker wilt zien. Kiezen jullie elkaar, dan zetten we jullie een volgende keer weer samen aan tafel.",
    offerSmall: "€10 per maand · elke Sunday Social in alle 5 steden · maandelijks opzegbaar",
    offerCta: "Word lid en reserveer",
    offerCtaNoDate: "Word lid",
    memberOnly: "Alleen lid worden",
    memberCardTitle: "Lid worden",
    memberPrice: "€10 per maand",
    memberPoints: ["Kies wie je terugziet", "Elke Sunday Social, alle 5 steden", "Maandelijks opzegbaar"],
    alsoBook: (date: string) => `Reserveer ${date} meteen`,
    plusOne: "Ik neem iemand mee (+1)",
    plusOneMember: "je gast gratis",
    plusOnePrice: "€20 voor jullie twee",
    singleCardTitle: "Alleen de volgende keer",
    singlePrice: "€10 eenmalig",
    singleSeat: "of reserveer alleen deze zondag",
    nextTitle: "Je volgende zondag",
    seats: (n: number) => `nog ${n} ${n === 1 ? "plek" : "plekken"}`,
    reserve: "Reserveer",
    noNext: "Bekijk de Sunday Socials",
    contact: "Mogen we contact met je opnemen om het goed te maken?",
    missingTitle: "Was er iemand van je groep niet?",
    missingHint: "Tik wie er niet was. Alleen voor ons.",
    save: "Versturen",
    next: "Volgende",
    skip: "Overslaan",
    back: "Terug",
    everyoneThere: "Iedereen was er",
    wantLater: "Klikte het met iemand? Als lid kies je wie je terugziet.",
    saving: "Bezig…",
    thanks: "Dank je! We lezen alles.",
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
    title: (venue: string) => `How was your afternoon at ${venue}?`,
    moods: { great: "Amazing", good: "Nice", meh: "So-so", bad: "Not great" } as Record<Mood, string>,
    venue: (venue: string) => `And how was ${venue}?`,
    liked: "What made it so good?",
    likedGood: "What did you like most?",
    improve: "What could be better?",
    pickHint: "Tap what fits, more than one is fine.",
    improveHint: "Tap what fits, more than one is fine. Only for us, we read everything.",
    more: "Tell us a bit more (optional)",
    wantTitle: "Who would you like to see again?",
    membersOnly: "Members only",
    wantNote: "Members choose who they see again. Nobody sees what you tick.",
    offerTitle: "Clicked at the table? See them again.",
    offerBody: "As a member you choose who you'd like to see more of. If you choose each other, we'll seat you together again another time.",
    offerSmall: "€10 a month · every Sunday Social in all 5 cities · cancel monthly",
    offerCta: "Become a member and reserve",
    offerCtaNoDate: "Become a member",
    memberOnly: "Just become a member",
    memberCardTitle: "Become a member",
    memberPrice: "€10 a month",
    memberPoints: ["Choose who you see again", "Every Sunday Social, all 5 cities", "Cancel monthly"],
    alsoBook: (date: string) => `Reserve ${date} right away`,
    plusOne: "I'm bringing someone (+1)",
    plusOneMember: "your guest free",
    plusOnePrice: "€20 for the two of you",
    singleCardTitle: "Just the next one",
    singlePrice: "€10 one time",
    singleSeat: "or reserve just this Sunday",
    nextTitle: "Your next Sunday",
    seats: (n: number) => `${n} ${n === 1 ? "seat" : "seats"} left`,
    reserve: "Reserve",
    noNext: "See the Sunday Socials",
    contact: "May we contact you to make it right?",
    missingTitle: "Was anyone from your group not there?",
    missingHint: "Tap who wasn't there. Only for us.",
    save: "Send",
    next: "Next",
    skip: "Skip",
    back: "Back",
    everyoneThere: "Everyone was there",
    wantLater: "Clicked with someone? As a member you choose who you see again.",
    saving: "Saving…",
    thanks: "Thank you! We read everything.",
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

function Faces({ value, onPick, labels, size }: { value: Mood | null; onPick: (m: Mood) => void; labels: Record<Mood, string>; size?: number }) {
  return (
    <div className="mt-4 grid grid-cols-4 gap-2">
      {(["great", "good", "meh", "bad"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onPick(m)}
          aria-pressed={value === m}
          className={`flex flex-col items-center gap-1.5 rounded-2xl px-1 py-2 transition ${
            value === m ? "scale-105 bg-white shadow-sm ring-1 ring-wine/10" : value ? "opacity-35 hover:opacity-70" : "hover:bg-white/60"
          }`}
        >
          <Face mood={m} size={size} />
          <span className={`text-xs transition ${value === m ? "font-semibold text-wine" : "text-wine/45"}`}>{labels[m]}</span>
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

type Step = "mood" | "venue" | "liked" | "improve" | "missing";

/** One question per screen: which ones depend on the first answer. */
function stepsFor(mood: Mood | null, hasMates: boolean): Step[] {
  const okish = mood === "great" || mood === "good";
  return [
    "mood",
    "venue",
    ...(okish ? (["liked"] as const) : []),
    ...(mood && mood !== "great" ? (["improve"] as const) : []),
    ...(hasMates ? (["missing"] as const) : []),
  ];
}

export function FeedbackForm({ page, token }: { page: FeedbackPage; token: string }) {
  const t = COPY[page.locale];
  const venue = page.venueName ?? page.city;
  const [state, setState] = useState<FeedbackState>(page.saved);
  // Back on the page after finishing (for instance as a new member): the last screen.
  const [sent, setSent] = useState(page.saved.completed);
  const [step, setStep] = useState(0);
  const [error, setError] = useState(false);
  const [alsoBook, setAlsoBook] = useState(true);
  const [plusOne, setPlusOne] = useState(false);
  const [pending, start] = useTransition();
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

  const chips = (key: "wantToSee" | "missing", enabled = true) => (
    <div className={`mt-4 flex flex-wrap gap-2 ${enabled ? "" : "pointer-events-none opacity-45"}`}>
      {page.tablemates.map((m) => {
        const on = state[key].includes(m.bookingId);
        return (
          <button
            key={m.bookingId}
            type="button"
            disabled={!enabled}
            onClick={() => toggle(key, m.bookingId)}
            className={`rounded-full px-3.5 py-1.5 text-sm transition ${on ? "bg-burgundy text-cream" : "bg-white text-wine ring-1 ring-wine/15"}`}
          >
            {on && key === "wantToSee" ? "✓ " : ""}
            {m.firstName}
          </button>
        );
      })}
    </div>
  );

  if (sent) {
    const withTicket = (ticket: "elke-zondag" | "deze-zondag") =>
      fromFeedback(
        page.next ? `${page.next.path}?ticket=${ticket}${plusOne ? "&plekken=2" : ""}#boeken` : page.cityPath,
        ticket === "elke-zondag" ? "lid-en-reserveer" : "eenmalig",
      );
    return (
      <div className="space-y-5">
        <section className={`${card} text-center`}>
          <p className="font-serif text-2xl text-wine">{okish ? t.thanks : t.thanksSorry}</p>
          {!okish ? <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-wine/70">{t.sorryBody}</p> : null}
          {!okish && page.freeSeat && (page.freeSeat.booked || page.freeSeat.options.length > 0) ? (
            <FreeSeat page={page} token={token} t={t} />
          ) : state.mood === "meh" || (okish && page.member) ? (
            <NextSunday page={page} t={t} />
          ) : null}
        </section>
        {okish && page.member && hasMates ? (
          <section className={card}>
            <h2 className="font-serif text-2xl text-wine">{t.wantTitle}</h2>
            <p className="mt-1 text-xs text-wine/50">{t.wantNote}</p>
            {chips("wantToSee")}
          </section>
        ) : null}
        {okish && !page.member ? (
          <section className={card}>
            <h2 className="font-serif text-2xl text-wine sm:text-3xl">{t.offerTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-wine/70">{t.offerBody}</p>
            {hasMates ? (
              <div className="mt-4">
                <span className="text-xs font-semibold text-wine/50">🔒 {t.membersOnly}</span>
                {chips("wantToSee", false)}
              </div>
            ) : null}
            {page.next && page.next.seatsLeft >= 2 ? (
              <label className="mt-6 flex items-center gap-2 text-sm text-wine">
                <input type="checkbox" checked={plusOne} onChange={(e) => setPlusOne(e.target.checked)} className="accent-burgundy" />
                {t.plusOne}
              </label>
            ) : null}
            <div className={`mt-4 grid gap-3 ${page.next ? "sm:grid-cols-2" : ""}`}>
              <div className="flex flex-col rounded-2xl bg-white p-5 text-wine ring-2 ring-burgundy shadow-[0_10px_30px_rgba(90,15,27,0.10)]">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">{t.memberCardTitle}</p>
                <p className="mt-1 font-serif text-2xl">{t.memberPrice}</p>
                {plusOne && alsoBook && page.next ? <p className="text-xs font-semibold text-burgundy">+1 · {t.plusOneMember}</p> : null}
                <ul className="mt-3 flex-1 space-y-1.5 text-sm">
                  {t.memberPoints.map((point) => (
                    <li key={point} className="flex gap-2">
                      <span aria-hidden className="text-gold">✓</span>
                      {point}
                    </li>
                  ))}
                </ul>
                {page.next ? (
                  <label className="mt-4 flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={alsoBook} onChange={(e) => setAlsoBook(e.target.checked)} className="accent-burgundy" />
                    {t.alsoBook(page.next.shortLabel)}
                  </label>
                ) : null}
                <Link
                  href={page.next && alsoBook ? withTicket("elke-zondag") : fromFeedback(page.joinPath, "lid")}
                  className="mt-4 rounded-full bg-burgundy px-5 py-2.5 text-center text-sm font-semibold text-cream transition hover:bg-wine"
                >
                  {t.offerCtaNoDate}
                </Link>
              </div>
              {page.next ? (
                <div className="flex flex-col rounded-2xl bg-white/60 p-5 text-wine ring-1 ring-wine/10">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">{t.singleCardTitle}</p>
                  <p className="mt-1 font-serif text-2xl">{plusOne ? t.plusOnePrice : t.singlePrice}</p>
                  <p className="mt-3 flex-1 text-sm text-wine/75">
                    {page.city}
                    <br />
                    {page.next.label}
                    <br />
                    <span className="text-wine/50">{t.seats(page.next.seatsLeft)}</span>
                  </p>
                  <Link
                    href={withTicket("deze-zondag")}
                    className="mt-4 rounded-full bg-white px-5 py-2.5 text-center text-sm font-semibold text-burgundy ring-1 ring-burgundy/40 transition hover:ring-burgundy"
                  >
                    {t.reserve}
                  </Link>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
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
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">Sunday Social {page.city}</p>
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
              <h1 className="font-serif text-3xl font-medium text-wine sm:text-4xl">{t.title(venue)}</h1>
              <Faces value={state.mood} onPick={(m) => pickAndGo({ mood: m })} labels={t.moods} />
            </>
          ) : current === "venue" ? (
            <>
              <h1 className="font-serif text-2xl font-medium text-wine sm:text-3xl">{t.venue(venue)}</h1>
              <Faces value={state.venueMood} onPick={(m) => pickAndGo({ venueMood: m })} labels={t.moods} />
              {nav({ primary: t.skip, primaryStyle: "ghost", onPrimary: next })}
            </>
          ) : current === "liked" || current === "improve" ? (
            reasonStep(current)
          ) : (
            <>
              <h1 className="font-serif text-2xl font-medium text-wine sm:text-3xl">{t.missingTitle}</h1>
              <p className="mt-1 text-sm text-wine/55">{t.missingHint}</p>
              {chips("missing")}
              {nav({ primary: state.missing.length > 0 ? t.save : t.everyoneThere, onPrimary: next })}
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

function NextSunday({ page, t }: { page: FeedbackPage; t: (typeof COPY)["nl"] | (typeof COPY)["en"] }) {
  if (!page.next) {
    return (
      <Link href={fromFeedback(page.cityPath, "steden")} className="mt-5 inline-flex rounded-full bg-burgundy px-5 py-2.5 text-sm font-semibold text-cream">
        {t.noNext}
      </Link>
    );
  }
  return (
    <div className="mt-5 text-left">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">{t.nextTitle}</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-wine/10">
        <div>
          <p className="font-serif text-lg text-wine">
            {page.city} · {page.next.label}
          </p>
          <p className="text-xs text-wine/55">{t.seats(page.next.seatsLeft)}</p>
        </div>
        <Link href={fromFeedback(page.next.path, "volgende")} className="rounded-full bg-burgundy px-5 py-2.5 text-sm font-semibold text-cream">
          {t.reserve}
        </Link>
      </div>
    </div>
  );
}
