"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import type { Locale } from "@/i18n/config";
import { CheckIcon } from "@/components/jouw-tafel/icons";
import {
  CalendarSunIcon,
  ClockIcon,
  PinIcon,
  QuoteIcon,
  SearchIcon,
  TwoPeopleIcon,
  WineGlassIcon,
  optionIcon,
} from "@/components/jouw-tafel/quiz/quiz-icons";
import {
  ChoiceButton,
  ChoiceTile,
  FieldError,
  IconBadge,
  OvalPhoto,
  PhotoChoice,
  StickyBar,
  answersGap,
  inputBad,
  inputClass,
  inputOk,
  primaryButton,
  questionSub,
  questionTitle,
  smallCaps,
  useStagger,
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

/** "We zoeken jouw tafel" before the list. */
export const SEARCH_MS = 1800;

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

/** Real photos for the "alone or with someone" tiles. */
export const COMPANION_PHOTOS = {
  alone: "/girls-only/smiling-glasses.jpg",
  with: "/girls-only/duo-table.jpg",
} as const;

/** The welcome collage: three real photos from earlier tables. */
const WELCOME_PHOTOS = [
  "/girls-only/wine-tasting-toast.jpg",
  "/girls-only/connecting.jpg",
  "/girls-only/table-wine-laughing.jpg",
] as const;

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

/** Title (and optional muted line) at the top of a question. */
function QuestionHead({ title, sub }: { title: string; sub?: ReactNode }) {
  return (
    <div className="pt-6">
      <h1 tabIndex={-1} className={questionTitle}>
        {title}
      </h1>
      {sub ? <p className={questionSub}>{sub}</p> : null}
    </div>
  );
}

// ------------------------------------------------------------- intro, stops

function WelcomeCollage() {
  const { reduceMotion } = useQuiz();
  const frames = [
    { photo: WELCOME_PHOTOS[0], className: "left-[4%] top-6 z-0 w-[34%]", rotate: -7 },
    { photo: WELCOME_PHOTOS[2], className: "right-[4%] top-6 z-0 w-[34%]", rotate: 7 },
    { photo: WELCOME_PHOTOS[1], className: "left-1/2 top-0 z-10 w-[40%] -translate-x-1/2", rotate: 0 },
  ];
  return (
    <div aria-hidden className="relative mx-auto h-[12.5rem] w-full max-w-[22rem]">
      {frames.map((f, i) => (
        <div key={f.photo} className={`absolute ${f.className}`}>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 14, rotate: 0 }}
            animate={{ opacity: 1, y: 0, rotate: f.rotate }}
            transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.05 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-[3/4] w-full overflow-hidden rounded-[1.25rem] border-[3px] border-white bg-wine/10 shadow-[0_16px_36px_rgba(43,13,18,0.18)]"
          >
            <Image src={f.photo} alt="" fill sizes="160px" className="object-cover" priority />
          </motion.div>
        </div>
      ))}
    </div>
  );
}

export function WelcomeScreen() {
  const { copy, answers, accountFirstName, continueFrom } = useQuiz();
  usePrimaryAction(continueFrom);
  const name = answers.name?.trim() || accountFirstName || null;
  const rowIcons = [<TwoPeopleIcon key="a" className="h-[1.1rem] w-[1.1rem]" />, <SearchIcon key="b" className="h-[1.1rem] w-[1.1rem]" />, <CalendarSunIcon key="c" className="h-[1.1rem] w-[1.1rem]" />];
  return (
    <div className="pb-28 pt-4">
      <WelcomeCollage />
      <div className="mt-5 flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-white px-3 py-1.5 text-xs font-semibold text-wine/75 shadow-[0_2px_10px_rgba(43,13,18,0.05)]">
          <ClockIcon className="h-3.5 w-3.5 text-gold" />
          {copy.duration}
        </span>
      </div>
      <h1 tabIndex={-1} className="mt-4 text-center font-serif text-[2.6rem] font-medium leading-[1.05] tracking-tight text-wine outline-none text-balance">
        {copy.welkom.title(name)}
      </h1>
      <p className="mx-auto mt-2 max-w-[19rem] text-center text-[1.05rem] leading-snug text-wine/65 text-balance">
        {copy.welkom.sub}
      </p>
      <ul className="mt-6 divide-y divide-wine/[0.06] rounded-2xl border border-wine/[0.08] bg-white px-4 shadow-[0_1px_2px_rgba(43,13,18,0.04),0_6px_18px_rgba(43,13,18,0.04)]">
        {copy.welkom.rows.map((row, i) => (
          <WelcomeRow key={row} index={i} icon={rowIcons[i]}>
            {row}
          </WelcomeRow>
        ))}
      </ul>
      <NextBar label={copy.welkom.begin} onClick={continueFrom} />
    </div>
  );
}

function WelcomeRow({ index, icon, children }: { index: number; icon: ReactNode; children: ReactNode }) {
  const stagger = useStagger(index + 4);
  return (
    <motion.li {...stagger} className="flex min-h-[3.4rem] items-center gap-3 py-2">
      <IconBadge selected={false} size="sm">
        {icon}
      </IconBadge>
      <span className="text-[0.95rem] font-medium leading-snug text-wine">{children}</span>
    </motion.li>
  );
}

function Statement({ children }: { children: ReactNode }) {
  const stagger = useStagger(3);
  return (
    <motion.p
      {...stagger}
      className="mx-auto mt-9 max-w-[21rem] text-center font-serif text-[1.85rem] font-medium leading-[1.12] tracking-tight text-wine text-balance"
    >
      {children}
    </motion.p>
  );
}

export function StopScreen() {
  const { copy, locale, step, answers, cityCounts, testimonials, continueFrom } = useQuiz();
  usePrimaryAction(continueFrom);
  const photo = STOP_PHOTOS[step] ?? "/girls-only/table-group.jpg";

  if (step === "stop-reviews") {
    return (
      <div className="pb-28 pt-4">
        <OvalPhoto photo={photo} priority className="aspect-[2/1] max-h-[24svh]" />
        <p className={`${smallCaps} mt-8 text-center !text-gold`}>{copy.stopReviews.eyebrow}</p>
        <h1 tabIndex={-1} className="mt-1.5 text-center font-serif text-[1.95rem] font-medium leading-tight text-wine outline-none">
          {copy.stopReviews.title}
        </h1>
        <ReviewCarousel testimonials={testimonials} locale={locale} />
        <NextBar label={copy.next} onClick={continueFrom} />
      </div>
    );
  }

  let lines: ReactNode = null;
  let stat: { n: number; label: string } | null = null;
  const city = answers.city ?? "";
  switch (step) {
    case "stop-stad": {
      const known = supportedCity(city);
      const shown = known ? displayCity(known, locale) : city;
      const key = cityMatchKey(known ?? city);
      const count = Object.entries(cityCounts).find(([c]) => cityMatchKey(c) === key)?.[1];
      lines = count ? copy.stopStad.count(count, shown) : copy.stopStad.few(shown);
      if (count) stat = { n: count, label: copy.stopStad.statLabel(shown) };
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
    <div className="flex min-h-[calc(100svh-11rem)] flex-col justify-center pb-28 pt-4">
      <OvalPhoto photo={photo} priority />
      <Statement>{lines}</Statement>
      {stat ? <StatCard n={stat.n} label={stat.label} /> : null}
      <NextBar label={copy.next} onClick={continueFrom} />
    </div>
  );
}

function StatCard({ n, label }: { n: number; label: string }) {
  const stagger = useStagger(6);
  return (
    <motion.div
      {...stagger}
      className="mx-auto mt-7 flex w-fit min-w-[14rem] items-center gap-3.5 rounded-3xl border border-wine/[0.07] bg-white/80 py-3.5 pl-3.5 pr-6 shadow-[0_6px_20px_rgba(43,13,18,0.05)]"
    >
      <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-burgundy text-cream">
        <TwoPeopleIcon className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-[1.45rem] font-bold leading-none tracking-tight text-wine">{n}+</span>
        <span className="mt-1 block text-[0.85rem] leading-tight text-wine/60">{label}</span>
      </span>
    </motion.div>
  );
}

function ReviewCarousel({ testimonials, locale }: { testimonials: QuizTestimonial[]; locale: Locale }) {
  const scroller = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  function onScroll() {
    const el = scroller.current;
    if (!el || !el.firstElementChild) return;
    const card = (el.firstElementChild as HTMLElement).offsetWidth + 12;
    setActive(Math.min(testimonials.length - 1, Math.max(0, Math.round(el.scrollLeft / card))));
  }
  if (testimonials.length === 0) return null;
  return (
    <div className="mt-6">
      <ul
        ref={scroller}
        onScroll={onScroll}
        className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {testimonials.map((t) => (
          <li
            key={t.name}
            className="flex w-[82%] shrink-0 snap-start flex-col rounded-3xl border border-wine/[0.07] bg-white p-5 shadow-[0_1px_2px_rgba(43,13,18,0.04),0_8px_22px_rgba(43,13,18,0.06)]"
          >
            <QuoteIcon className="h-6 w-6 text-gold" />
            <p className="mt-2 flex-1 font-serif text-[1.2rem] leading-snug text-wine">{t.quote}</p>
            <p className="mt-4 flex items-center gap-2.5 text-sm">
              <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5ebe6] font-serif text-[1rem] font-semibold text-burgundy">
                {t.name.charAt(0)}
              </span>
              <span>
                <span className="block font-semibold leading-tight text-wine">{t.name}</span>
                <span className="block leading-tight text-wine/55">{displayCity(t.city, locale)}</span>
              </span>
            </p>
          </li>
        ))}
      </ul>
      {testimonials.length > 1 ? (
        <div aria-hidden className="mt-2 flex justify-center gap-1.5">
          {testimonials.map((t, i) => (
            <span
              key={t.name}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? "w-5 bg-burgundy" : "w-1.5 bg-wine/15"}`}
            />
          ))}
        </div>
      ) : null}
    </div>
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
  photos,
}: {
  title: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: T | undefined;
  toPatch: (value: T) => Partial<QuizAnswers>;
  /** Real photos per answer: shown as photo tiles instead of rows. */
  photos?: Record<T, string>;
}) {
  const { answerAndNext, step } = useQuiz();
  const [picked, setPicked] = useState<T | undefined>(value);
  usePrimaryAction(picked ? () => answerAndNext(toPatch(picked)) : null);
  const choose = (id: T) => {
    setPicked(id);
    answerAndNext(toPatch(id), { delay: AUTO_ADVANCE_MS });
  };
  return (
    <>
      <QuestionHead title={title} />
      {photos ? (
        <div role="radiogroup" className={`${answersGap} grid grid-cols-2 gap-3 pb-24`}>
          {options.map((id, i) => (
            <PhotoChoice
              key={id}
              index={i}
              selected={picked === id}
              label={labels[id]}
              photo={photos[id]}
              onClick={() => choose(id)}
            />
          ))}
        </div>
      ) : (
        <div role="radiogroup" className={`${answersGap} space-y-3 pb-24`}>
          {options.map((id, i) => (
            <ChoiceButton
              key={id}
              index={i}
              selected={picked === id}
              label={labels[id]}
              icon={optionIcon(step, id)}
              onClick={() => choose(id)}
            />
          ))}
        </div>
      )}
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
      <QuestionHead title={copy.naam.title} sub={copy.naam.hint} />
      <label htmlFor="jt-quiz-name" className={`${smallCaps} ${answersGap} block text-center`}>
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
        className={`${inputClass} mt-2 min-h-16 text-center !text-[1.3rem] font-medium ${error ? inputBad : inputOk}`}
      />
      {error ? <FieldError message={copy.naam.error} attempt={attempt} /> : null}
      <NextBar label={copy.next} onClick={submit} disabled={!value.trim()} />
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
    <label htmlFor={id} className={`${max === 4 ? "flex-[1.5]" : "flex-1"} text-center`}>
      <span className={smallCaps}>{label}</span>
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
        className={`${inputClass} mt-2 min-h-16 px-2 text-center !text-[1.3rem] font-medium tabular-nums ${invalid ? inputBad : inputOk}`}
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
  const valid = parseBirthDate(day, month, year).ok;

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submit();
        }
      }}
    >
      <QuestionHead title={c.title} sub={c.hint} />
      <div className={`${answersGap} flex gap-3`}>
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
      <NextBar label={copy.next} onClick={submit} disabled={!valid} />
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
      <QuestionHead title={copy.stad.title} />
      <div role="radiogroup" className={`${answersGap} space-y-3`}>
        {QUIZ_CITIES.map((city, i) => (
          <div key={city}>
            {prefilledFromGeo && city === geoCity ? (
              <p className="mb-1.5 flex items-center gap-1.5 pl-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                <PinIcon className="h-3.5 w-3.5" />
                {copy.stad.geoHint}
              </p>
            ) : null}
            <ChoiceButton
              index={i}
              selected={choice === city}
              label={displayCity(city, locale)}
              icon={optionIcon("stad", city)}
              onClick={() => {
                setChoice(city);
                answerAndNext({ city }, { delay: AUTO_ADVANCE_MS });
              }}
            />
          </div>
        ))}
        <ChoiceButton
          index={QUIZ_CITIES.length}
          selected={choice === "other"}
          label={copy.stad.other}
          icon={optionIcon("stad", "other")}
          onClick={() => {
            setChoice("other");
            requestAnimationFrame(() => otherRef.current?.focus());
          }}
        />
      </div>
      {choice === "other" ? (
        <div className="mt-5">
          <label htmlFor="jt-quiz-city" className={`${smallCaps} block text-center`}>
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
            className={`${inputClass} mt-2 text-center ${error ? inputBad : inputOk}`}
          />
          {error ? <FieldError message={copy.stad.otherError} attempt={attempt} /> : null}
        </div>
      ) : null}
      <div className="h-28" />
      {choice ? (
        <NextBar label={copy.next} onClick={confirm} disabled={choice === "other" && !other.trim()} />
      ) : null}
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
      <QuestionHead title={copy.zoekt.title} sub={copy.chooseMax(WHY_MAX)} />
      <div role="group" className={`${answersGap} space-y-3 pb-28`}>
        {WHY_OPTIONS.map((id, i) => {
          const selected = picked.includes(id);
          return (
            <ChoiceButton
              key={id}
              index={i}
              multi
              selected={selected}
              disabled={!selected && picked.length >= WHY_MAX}
              label={copy.zoekt.options[id]}
              icon={optionIcon("zoekt", id)}
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
  const tiles = DIETARY_OPTIONS.filter((id) => id !== "none");
  return (
    <>
      <QuestionHead title={copy.dieet.title} sub={copy.dieet.note} />
      <div role="group" className={`${answersGap} grid grid-cols-2 gap-3`}>
        {tiles.map((id, i) => (
          <ChoiceTile
            key={id}
            index={i}
            selected={picked.includes(id)}
            label={copy.dieet.options[id]}
            icon={optionIcon("dieet", id)}
            onClick={() => toggle(id)}
          />
        ))}
        <div className="col-span-2">
          <ChoiceButton
            index={tiles.length}
            multi
            selected={picked.includes("none")}
            label={copy.dieet.options.none}
            icon={optionIcon("dieet", "none")}
            onClick={() => toggle("none")}
          />
        </div>
      </div>
      {picked.includes("other") ? (
        <div className="mt-5">
          <label htmlFor="jt-quiz-diet" className={`${smallCaps} block text-center`}>
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
            className={`${inputClass} mt-2 text-center ${inputOk}`}
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
      <QuestionHead title={copy.formats.title} sub={copy.formats.note} />
      <div role="group" className={`${answersGap} space-y-3 pb-28`}>
        {FORMAT_OPTIONS.map((id, i) => (
          <ChoiceButton
            key={id}
            index={i}
            multi
            selected={picked.includes(id)}
            label={copy.formats.options[id].title}
            description={copy.formats.options[id].body}
            icon={optionIcon("formats", id)}
            onClick={() => toggle(id)}
          />
        ))}
      </div>
      <NextBar label={picked.length ? copy.next : copy.skip} onClick={submit} />
    </>
  );
}

// ---------------------------------------------------------------- search

const RING_R = 52;

export function SearchScreen() {
  const { copy, reduceMotion } = useQuiz();
  const total = (reduceMotion ? 600 : SEARCH_MS) / 1000;
  // Each row is ticked off a third of the way further along the ring.
  const tickAt = (i: number) => (reduceMotion ? 0 : total * ((i + 1) / 3.4));
  return (
    <div className="flex min-h-[70svh] flex-col items-center justify-center pb-10">
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
          <circle cx="60" cy="60" r={RING_R} fill="none" stroke="currentColor" strokeWidth="4" className="text-wine/[0.07]" />
          <motion.circle
            cx="60"
            cy="60"
            r={RING_R}
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            className="text-burgundy"
            initial={{ pathLength: reduceMotion ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: reduceMotion ? 0 : total - 0.1, ease: [0.45, 0, 0.25, 1] }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-burgundy shadow-[0_8px_24px_rgba(43,13,18,0.08)]">
            <WineGlassIcon className="h-9 w-9" fill="#7a1a2a" />
          </span>
        </span>
      </div>
      <h1 tabIndex={-1} className={`${questionTitle} mt-8`}>
        {copy.zoeken.title}
      </h1>
      <ul
        className="mt-7 w-full max-w-[18rem] divide-y divide-wine/[0.06] rounded-2xl border border-wine/[0.08] bg-white px-4 shadow-[0_6px_18px_rgba(43,13,18,0.05)]"
        aria-live="polite"
      >
        {copy.zoeken.items.map((item, i) => (
          <motion.li
            key={item}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.1 + i * 0.25, duration: 0.25 }}
            className="flex min-h-[3.2rem] items-center justify-between gap-3 text-[1rem] font-medium text-wine"
          >
            {item}
            <span className="relative flex h-6 w-6 items-center justify-center">
              <span className="absolute inset-0 rounded-full border-[1.5px] border-wine/15" />
              <motion.span
                initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: tickAt(i), type: "spring", stiffness: 480, damping: 24 }}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-burgundy text-cream"
              >
                <CheckIcon className="h-3.5 w-3.5" />
              </motion.span>
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
