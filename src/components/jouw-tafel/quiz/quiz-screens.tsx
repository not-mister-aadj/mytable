"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import type { Locale } from "@/i18n/config";
import { CheckIcon, PinIcon } from "@/components/jouw-tafel/icons";
import {
  ChoiceButton,
  FieldError,
  StickyBar,
  StopCard,
  inputBad,
  inputClass,
  inputOk,
  primaryButton,
  questionTitle,
} from "@/components/jouw-tafel/quiz/quiz-ui";
import { cityMatchKey } from "@/lib/waitlist-city";
import { QUIZ_CITIES, displayCity, supportedCity, type QuizCity } from "@/lib/jouw-tafel/logic";
import type { QuizCopy } from "@/lib/jouw-tafel/quiz-copy";
import {
  DIETARY_OPTIONS,
  FORMAT_OPTIONS,
  WHY_MAX,
  WHY_OPTIONS,
  parseBirthDate,
  type BirthDateError,
  type DietaryAnswer,
  type FormatAnswer,
  type QuizAnswers,
  type QuizStepId,
  type WhyAnswer,
} from "@/lib/jouw-tafel/quiz-logic";

export type QuizTestimonial = { name: string; city: string; quote: string };

/** Delay between tapping a single-choice answer and the next screen, so
 * the selected state is seen. */
export const AUTO_ADVANCE_MS = 250;

/** Real photos from earlier tables, one per stop. */
export const STOP_PHOTOS: Partial<Record<QuizStepId, string>> = {
  "stop-stad": "/girls-only/wine-tasting-toast.jpg",
  "stop-zoekt": "/girls-only/wine-tasting-conversation.jpg",
  "stop-gesprek": "/girls-only/table-wine-laughing.jpg",
  "stop-wijn": "/girls-only/wine-moment.jpg",
  "stop-alleen": "/girls-only/laughing-bar.jpg",
  "stop-wie": "/girls-only/duo-table.jpg",
  "stop-reviews": "/girls-only/table-group.jpg",
};

export const PHOTO_SIZES = "(max-width: 480px) 100vw, 448px";

type QuizScreenContextValue = {
  locale: Locale;
  copy: QuizCopy;
  step: QuizStepId;
  answers: QuizAnswers;
  accountFirstName: string;
  geoCity: QuizCity | null;
  cityCounts: Record<string, number>;
  testimonials: QuizTestimonial[];
  reduceMotion: boolean;
  answerAndNext: (patch: Partial<QuizAnswers>, options?: { delay?: number }) => void;
  continueFrom: () => void;
  primaryActionRef: RefObject<(() => void) | null>;
};

export const QuizScreenContext = createContext<QuizScreenContextValue | null>(null);

function useQuiz(): QuizScreenContextValue {
  const value = useContext(QuizScreenContext);
  if (!value) throw new Error("Quiz screens need QuizScreenContext");
  return value;
}

/** What Enter does on this screen when no field or button has focus. */
function usePrimaryAction(action: (() => void) | null) {
  const { primaryActionRef } = useQuiz();
  useEffect(() => {
    primaryActionRef.current = action;
    return () => {
      // A screen fading out must not clear the action of the one coming in.
      if (primaryActionRef.current === action) primaryActionRef.current = null;
    };
  });
}

function NextBar({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <StickyBar>
      <button type="button" className={primaryButton} onClick={onClick} disabled={disabled}>
        {label}
      </button>
    </StickyBar>
  );
}

// ------------------------------------------------------------- intro, stops

export function WelcomeScreen() {
  const { copy, answers, accountFirstName, continueFrom } = useQuiz();
  usePrimaryAction(continueFrom);
  const name = answers.name?.trim() || accountFirstName || null;
  return (
    <>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-wine/70 shadow-[0_2px_10px_rgba(43,13,18,0.05)]">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </svg>
        {copy.duration}
      </span>
      <h1 tabIndex={-1} className={`${questionTitle} mt-6 !text-[2.5rem]`}>
        {copy.welkom.title(name)}
      </h1>
      <p className="mt-4 text-[1.15rem] leading-relaxed text-wine/75">{copy.welkom.sub}</p>
      <NextBar label={copy.welkom.begin} onClick={continueFrom} />
    </>
  );
}

export function StopScreen() {
  const { copy, locale, step, answers, cityCounts, testimonials, continueFrom } = useQuiz();
  usePrimaryAction(continueFrom);
  const photo = STOP_PHOTOS[step] ?? "/girls-only/table-group.jpg";

  if (step === "stop-reviews") {
    return (
      <>
        <div className="relative h-40 w-full overflow-hidden rounded-[1.75rem] bg-wine">
          <Image src={photo} alt="" fill sizes={PHOTO_SIZES} className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2b0d12]/85 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">{copy.stopReviews.eyebrow}</p>
            <h1 tabIndex={-1} className="mt-1 font-serif text-[1.7rem] font-medium leading-tight text-cream outline-none">
              {copy.stopReviews.title}
            </h1>
          </div>
        </div>
        <ul className="mt-4 space-y-3 pb-28">
          {testimonials.map((t) => (
            <li key={t.name} className="rounded-2xl border border-wine/10 bg-white px-5 py-4 shadow-[0_2px_12px_rgba(43,13,18,0.05)]">
              <p className="font-serif text-[1.08rem] leading-snug text-wine">&ldquo;{t.quote}&rdquo;</p>
              <p className="mt-2 text-sm font-semibold text-wine/60">
                {t.name}, {displayCity(t.city, locale)}
              </p>
            </li>
          ))}
        </ul>
        <NextBar label={copy.next} onClick={continueFrom} />
      </>
    );
  }

  let lines: ReactNode = null;
  const city = answers.city ?? "";
  switch (step) {
    case "stop-stad": {
      const known = supportedCity(city);
      const shown = known ? displayCity(known, locale) : city;
      const key = cityMatchKey(known ?? city);
      const count = Object.entries(cityCounts).find(([c]) => cityMatchKey(c) === key)?.[1];
      lines = count ? copy.stopStad.count(count, shown) : copy.stopStad.few(shown);
      break;
    }
    case "stop-zoekt":
      lines = copy.stopZoekt[(answers.why?.[0] ?? "cosy") as WhyAnswer];
      break;
    case "stop-gesprek":
      lines = answers.conversation === "both" ? copy.stopGesprek.both : copy.stopGesprek.known;
      break;
    case "stop-wijn":
      lines = answers.wine === "none" ? copy.stopWijn.none : copy.stopWijn.wine;
      break;
    case "stop-alleen":
      lines = copy.stopAlleen;
      break;
    case "stop-wie":
      lines = copy.stopWie[answers.companionWho ?? "friend"];
      break;
  }
  return (
    <>
      <StopCard photo={photo} alt="" priority>
        <p className="font-serif text-[1.85rem] font-medium leading-[1.15] text-cream text-balance">{lines}</p>
      </StopCard>
      <NextBar label={copy.next} onClick={continueFrom} />
    </>
  );
}

// ---------------------------------------------------------------- questions

/** Single-choice question: tap, see it selected, next screen. */
export function SingleChoiceScreen<T extends string>({
  title,
  options,
  labels,
  value,
  toPatch,
}: {
  title: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: T | undefined;
  toPatch: (value: T) => Partial<QuizAnswers>;
}) {
  const { answerAndNext } = useQuiz();
  const [picked, setPicked] = useState<T | undefined>(value);
  usePrimaryAction(picked ? () => answerAndNext(toPatch(picked)) : null);
  return (
    <>
      <h1 tabIndex={-1} className={questionTitle}>
        {title}
      </h1>
      <div role="radiogroup" className="mt-7 space-y-3 pb-24">
        {options.map((id) => (
          <ChoiceButton
            key={id}
            selected={picked === id}
            label={labels[id]}
            onClick={() => {
              setPicked(id);
              answerAndNext(toPatch(id), { delay: AUTO_ADVANCE_MS });
            }}
          />
        ))}
      </div>
    </>
  );
}

export function NameScreen() {
  const { copy, answers, accountFirstName, answerAndNext } = useQuiz();
  const [value, setValue] = useState(answers.name ?? accountFirstName ?? "");
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  function submit() {
    const name = value.replace(/\s+/g, " ").trim();
    if (!name) {
      setError(true);
      setAttempt((n) => n + 1);
      inputRef.current?.focus();
      return;
    }
    answerAndNext({ name });
  }
  // No <form>: a tap before the page is interactive must never submit the
  // name into the URL.
  return (
    <div>
      <h1 tabIndex={-1} className={questionTitle}>
        {copy.naam.title}
      </h1>
      <label htmlFor="jt-quiz-name" className="sr-only">
        {copy.naam.label}
      </label>
      <input
        ref={inputRef}
        id="jt-quiz-name"
        name="given-name"
        type="text"
        autoComplete="given-name"
        autoCapitalize="words"
        enterKeyHint="next"
        maxLength={60}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (error) setError(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={copy.naam.placeholder}
        aria-invalid={error || undefined}
        className={`${inputClass} mt-7 ${error ? inputBad : inputOk}`}
      />
      {error ? <FieldError message={copy.naam.error} attempt={attempt} /> : null}
      <p className="mt-3 text-sm leading-relaxed text-wine/60">{copy.naam.hint}</p>
      <NextBar label={copy.next} onClick={submit} />
    </div>
  );
}

function DigitField({
  id,
  label,
  placeholder,
  value,
  max,
  inputRef,
  onValue,
  next,
  prev,
  autoComplete,
  invalid,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  max: number;
  inputRef: RefObject<HTMLInputElement | null>;
  onValue: (value: string) => void;
  next: RefObject<HTMLInputElement | null> | null;
  prev: RefObject<HTMLInputElement | null> | null;
  autoComplete: string;
  invalid: boolean;
}) {
  return (
    <label htmlFor={id} className={max === 4 ? "flex-[1.5]" : "flex-1"}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-burgundy">{label}</span>
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete={autoComplete}
        enterKeyHint={max === 4 ? "next" : undefined}
        maxLength={max}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").slice(0, max);
          onValue(digits);
          if (digits.length === max && next) next.current?.focus();
        }}
        onKeyDown={(e) => {
          if (e.key === "Backspace" && !value && prev) prev.current?.focus();
        }}
        aria-invalid={invalid || undefined}
        className={`${inputClass} mt-1.5 px-2 text-center tabular-nums ${invalid ? inputBad : inputOk}`}
      />
    </label>
  );
}

export function BirthDateScreen() {
  const { copy, answers, answerAndNext } = useQuiz();
  const c = copy.geboortedatum;
  const stored = answers.birthDate?.split("-") ?? [];
  const [day, setDay] = useState(stored[2] ?? "");
  const [month, setMonth] = useState(stored[1] ?? "");
  const [year, setYear] = useState(stored[0] ?? "");
  const [error, setError] = useState<BirthDateError | null>(null);
  const [attempt, setAttempt] = useState(0);
  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  function check(d: string, m: string, y: string, final: boolean) {
    const result = parseBirthDate(d, m, y);
    if (result.ok) {
      setError(null);
      return result;
    }
    // Live feedback once the year is complete; "incomplete" only on submit.
    if (final || result.error !== "incomplete") {
      setError(result.error);
      setAttempt((n) => n + 1);
    }
    return null;
  }

  function submit() {
    const result = check(day, month, year, true);
    if (result) answerAndNext({ birthDate: result.iso });
    else if (!day) dayRef.current?.focus();
    else if (!month) monthRef.current?.focus();
    else yearRef.current?.focus();
  }

  const message =
    error === "under_18" ? c.under18 : error === "incomplete" ? c.incomplete : error ? c.invalid : null;

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submit();
        }
      }}
    >
      <h1 tabIndex={-1} className={questionTitle}>
        {c.title}
      </h1>
      <div className="mt-7 flex gap-3">
        <DigitField
          id="jt-quiz-day"
          label={c.day}
          placeholder={c.dayPlaceholder}
          value={day}
          max={2}
          inputRef={dayRef}
          onValue={(v) => {
            setDay(v);
            setError(null);
          }}
          next={monthRef}
          prev={null}
          autoComplete="bday-day"
          invalid={Boolean(error)}
        />
        <DigitField
          id="jt-quiz-month"
          label={c.month}
          placeholder={c.monthPlaceholder}
          value={month}
          max={2}
          inputRef={monthRef}
          onValue={(v) => {
            setMonth(v);
            setError(null);
          }}
          next={yearRef}
          prev={dayRef}
          autoComplete="bday-month"
          invalid={Boolean(error)}
        />
        <DigitField
          id="jt-quiz-year"
          label={c.year}
          placeholder={c.yearPlaceholder}
          value={year}
          max={4}
          inputRef={yearRef}
          onValue={(v) => {
            setYear(v);
            setError(null);
            if (v.length === 4) check(day, month, v, false);
          }}
          next={null}
          prev={monthRef}
          autoComplete="bday-year"
          invalid={Boolean(error)}
        />
      </div>
      {message ? <FieldError message={message} attempt={attempt} /> : null}
      <p className="mt-3 text-sm leading-relaxed text-wine/60">{c.hint}</p>
      <NextBar label={copy.next} onClick={submit} />
    </div>
  );
}

export function CityScreen() {
  const { copy, locale, answers, geoCity, answerAndNext } = useQuiz();
  const knownAnswer = answers.city ? supportedCity(answers.city) : null;
  const [choice, setChoice] = useState<QuizCity | "other" | null>(answers.city ? knownAnswer ?? "other" : geoCity);
  const [other, setOther] = useState(answers.city && !knownAnswer ? answers.city : "");
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const otherRef = useRef<HTMLInputElement>(null);
  const prefilledFromGeo = !answers.city && geoCity !== null;

  function confirm() {
    if (choice === "other") {
      const city = other.replace(/\s+/g, " ").trim();
      if (!city) {
        setError(true);
        setAttempt((n) => n + 1);
        otherRef.current?.focus();
        return;
      }
      answerAndNext({ city: supportedCity(city) ?? city });
    } else if (choice) {
      answerAndNext({ city: choice });
    }
  }
  usePrimaryAction(choice ? confirm : null);

  return (
    <div>
      <h1 tabIndex={-1} className={questionTitle}>
        {copy.stad.title}
      </h1>
      <div role="radiogroup" className="mt-7 space-y-3">
        {QUIZ_CITIES.map((city) => (
          <div key={city}>
            {prefilledFromGeo && city === geoCity ? (
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                <PinIcon className="h-3.5 w-3.5" />
                {copy.stad.geoHint}
              </p>
            ) : null}
            <ChoiceButton
              selected={choice === city}
              label={displayCity(city, locale)}
              onClick={() => {
                setChoice(city);
                answerAndNext({ city }, { delay: AUTO_ADVANCE_MS });
              }}
            />
          </div>
        ))}
        <ChoiceButton
          selected={choice === "other"}
          label={copy.stad.other}
          onClick={() => {
            setChoice("other");
            requestAnimationFrame(() => otherRef.current?.focus());
          }}
        />
      </div>
      {choice === "other" ? (
        <div className="mt-4">
          <label htmlFor="jt-quiz-city" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-burgundy">
            {copy.stad.otherLabel}
          </label>
          <input
            ref={otherRef}
            id="jt-quiz-city"
            type="text"
            autoComplete="address-level2"
            enterKeyHint="next"
            maxLength={60}
            value={other}
            placeholder={copy.stad.otherPlaceholder}
            onChange={(e) => {
              setOther(e.target.value);
              if (error) setError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                confirm();
              }
            }}
            aria-invalid={error || undefined}
            className={`${inputClass} mt-1.5 ${error ? inputBad : inputOk}`}
          />
          {error ? <FieldError message={copy.stad.otherError} attempt={attempt} /> : null}
        </div>
      ) : null}
      <div className="h-28" />
      {choice ? <NextBar label={copy.next} onClick={confirm} /> : null}
    </div>
  );
}

export function WhyScreen() {
  const { copy, answers, answerAndNext } = useQuiz();
  const [picked, setPicked] = useState<WhyAnswer[]>(answers.why ?? []);
  const submit = () => answerAndNext({ why: picked });
  usePrimaryAction(picked.length ? submit : null);
  return (
    <>
      <h1 tabIndex={-1} className={questionTitle}>
        {copy.zoekt.title}
      </h1>
      <p className="mt-2 text-sm font-medium text-wine/60">{copy.chooseMax(WHY_MAX)}</p>
      <div role="group" className="mt-6 space-y-3 pb-28">
        {WHY_OPTIONS.map((id) => {
          const selected = picked.includes(id);
          return (
            <ChoiceButton
              key={id}
              multi
              selected={selected}
              disabled={!selected && picked.length >= WHY_MAX}
              label={copy.zoekt.options[id]}
              onClick={() =>
                setPicked((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id].slice(0, WHY_MAX)))
              }
            />
          );
        })}
      </div>
      <NextBar label={copy.next} onClick={submit} disabled={picked.length === 0} />
    </>
  );
}

export function DietScreen() {
  const { copy, answers, answerAndNext } = useQuiz();
  const [picked, setPicked] = useState<DietaryAnswer[]>(answers.dietary ?? []);
  const [other, setOther] = useState(answers.dietaryOther ?? "");
  const otherRef = useRef<HTMLInputElement>(null);
  const submit = () =>
    answerAndNext({
      dietary: picked,
      dietaryOther: picked.includes("other") ? other.trim() || undefined : undefined,
    });
  usePrimaryAction(submit);
  function toggle(id: DietaryAnswer) {
    const adding = !picked.includes(id);
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((v) => v !== id);
      if (id === "none") return ["none"];
      return [...prev.filter((v) => v !== "none"), id];
    });
    if (id === "other" && adding) requestAnimationFrame(() => otherRef.current?.focus());
  }
  return (
    <>
      <h1 tabIndex={-1} className={questionTitle}>
        {copy.dieet.title}
      </h1>
      <p className="mt-2 text-sm font-medium text-wine/60">{copy.dieet.note}</p>
      <div role="group" className="mt-6 grid grid-cols-2 gap-3">
        {DIETARY_OPTIONS.map((id) => (
          <div key={id} className={id === "none" ? "col-span-2" : undefined}>
            <ChoiceButton
              multi
              compact
              selected={picked.includes(id)}
              label={copy.dieet.options[id]}
              onClick={() => toggle(id)}
            />
          </div>
        ))}
      </div>
      {picked.includes("other") ? (
        <div className="mt-4">
          <label htmlFor="jt-quiz-diet" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-burgundy">
            {copy.dieet.otherLabel}
          </label>
          <input
            ref={otherRef}
            id="jt-quiz-diet"
            type="text"
            maxLength={120}
            enterKeyHint="next"
            value={other}
            placeholder={copy.dieet.otherPlaceholder}
            onChange={(e) => setOther(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            className={`${inputClass} mt-1.5 ${inputOk}`}
          />
        </div>
      ) : null}
      <div className="h-28" />
      <NextBar label={picked.length ? copy.next : copy.skip} onClick={submit} />
    </>
  );
}

export function FormatsScreen() {
  const { copy, answers, answerAndNext } = useQuiz();
  const [picked, setPicked] = useState<FormatAnswer[]>(answers.formats ?? []);
  const submit = () => answerAndNext({ formats: picked });
  usePrimaryAction(submit);
  function toggle(id: FormatAnswer) {
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((v) => v !== id);
      if (id === "sunday_only") return ["sunday_only"];
      return [...prev.filter((v) => v !== "sunday_only"), id];
    });
  }
  return (
    <>
      <h1 tabIndex={-1} className={questionTitle}>
        {copy.formats.title}
      </h1>
      <div role="group" className="mt-6 space-y-3">
        {FORMAT_OPTIONS.map((id) => (
          <ChoiceButton
            key={id}
            multi
            selected={picked.includes(id)}
            label={copy.formats.options[id].title}
            description={copy.formats.options[id].body}
            onClick={() => toggle(id)}
          />
        ))}
      </div>
      <p className="mt-4 pb-28 text-sm leading-relaxed text-wine/60">{copy.formats.note}</p>
      <NextBar label={picked.length ? copy.next : copy.skip} onClick={submit} />
    </>
  );
}

export function SearchScreen() {
  const { copy, reduceMotion } = useQuiz();
  return (
    <div className="flex min-h-[55svh] flex-col justify-center">
      <h1 tabIndex={-1} className={questionTitle}>
        {copy.zoeken.title}
      </h1>
      <ul className="mt-8 space-y-4" aria-live="polite">
        {copy.zoeken.items.map((item, i) => (
          <motion.li
            key={item}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.2 + i * 0.45, duration: 0.25 }}
            className="flex items-center gap-3 text-[1.15rem] font-medium text-wine"
          >
            <motion.span
              initial={reduceMotion ? false : { scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: reduceMotion ? 0 : 0.4 + i * 0.45, type: "spring", stiffness: 420, damping: 22 }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-burgundy text-cream"
            >
              <CheckIcon className="h-4 w-4" />
            </motion.span>
            {item}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
