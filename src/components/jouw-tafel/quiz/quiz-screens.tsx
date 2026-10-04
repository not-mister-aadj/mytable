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
import { QUIZ_CITIES, displayCity, supportedCity, type QuizCity } from "@/lib/jouw-tafel/logic";
import { buildPlaceIndex, searchPlaces, type Place, type PlaceIndex, type RawPlace } from "@/lib/jouw-tafel/places";
import type { QuizCopy } from "@/lib/jouw-tafel/quiz-copy";
import {
  AGE_MATTERS_OPTIONS,
  CITIES_MAX,
  COMPANION_OPTIONS,
  COMPANION_WHO_OPTIONS,
  CONVERSATION_OPTIONS,
  DIETARY_OPTIONS,
  GENDER_OPTIONS,
  HEARD_FROM_OPTIONS,
  LANGUAGE_OPTIONS,
  READY_OPTIONS,
  TABLE_TYPE_OPTIONS,
  WINE_OPTIONS,
  FORMAT_OPTIONS,
  WHY_MAX,
  WHY_OPTIONS,
  answerCities,
  cityStepAnswer,
  parseBirthDate,
  stopStadContent,
  stopZoektAnswer,
  type BirthDateError,
  type DietaryAnswer,
  type HeardFromAnswer,
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
  "stop-wijn": "/girls-only/chefs-table-toast.jpg",
  "stop-alleen": "/girls-only/laughing-bar.jpg",
  "stop-twijfel": "/girls-only/hero-poster-light.jpg",
  "stop-wie": "/girls-only/duo-table.jpg",
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
  subsetCounts: Record<string, number>;
  testimonials: QuizTestimonial[];
  reduceMotion: boolean;
  answerAndNext: (patch: Partial<QuizAnswers>, options?: { delay?: number }) => void;
  continueFrom: () => void;
  primaryActionRef: RefObject<(() => void) | null>;
  /** "sheet": a question inside the settings page's bottom sheet (compact
   * title, the button inside the sheet labelled `submitLabel`, no room
   * kept for the sticky bar). */
  variant?: "quiz" | "sheet";
  submitLabel?: string;
};

/** Id of a question's title inside a sheet (for aria-labelledby). */
export const SHEET_TITLE_ID = "jt-sheet-question-title";

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
  const { variant, submitLabel } = useQuiz();
  if (variant === "sheet") {
    return (
      <div className="sticky bottom-[calc(-1*max(1.5rem,env(safe-area-inset-bottom)))] -mx-5 -mb-[max(1.5rem,env(safe-area-inset-bottom))] mt-6 bg-gradient-to-t from-cream from-75% to-cream/0 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5">
        <button type="button" className={primaryButton} onClick={onClick} disabled={disabled}>
          {submitLabel ?? label}
        </button>
      </div>
    );
  }
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
  const { variant } = useQuiz();
  if (variant === "sheet") {
    return (
      <div className="pt-1">
        <h2 id={SHEET_TITLE_ID} className="pr-14 pt-1 font-sans text-[1.3rem] font-semibold leading-snug tracking-[-0.01em] text-wine text-balance">
          {title}
        </h2>
        {sub ? <p className="mt-1.5 text-[0.92rem] leading-snug text-wine/55">{sub}</p> : null}
      </div>
    );
  }
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
            {/* The photos are landscape in a portrait frame, so object-cover
                draws them about twice the frame's width: size for that. */}
            <Image src={f.photo} alt="" fill sizes="340px" quality={100} className="object-cover" priority />
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

function StatementSub({ children }: { children: ReactNode }) {
  const stagger = useStagger(4);
  return (
    <motion.p
      {...stagger}
      className="mx-auto mt-4 max-w-[21rem] text-center text-[1rem] leading-relaxed text-wine/75 text-balance"
    >
      {children}
    </motion.p>
  );
}

export function StopScreen() {
  const { copy, locale, step, answers, cityCounts, subsetCounts, testimonials, continueFrom } = useQuiz();
  usePrimaryAction(continueFrom);
  const photo = STOP_PHOTOS[step] ?? "/girls-only/table-group.jpg";

  if (step === "stop-reviews") {
    return (
      <div className="flex min-h-[calc(100svh-11rem)] flex-col justify-center pb-28 pt-4">
        <GuestFaces />
        <p className={`${smallCaps} mt-5 text-center !text-gold`}>{copy.stopReviews.eyebrow}</p>
        <h1 tabIndex={-1} className="mx-auto mt-1.5 max-w-[20rem] text-center font-serif text-[1.85rem] font-medium leading-tight text-wine outline-none text-balance">
          {copy.stopReviews.title}
        </h1>
        <ReviewList testimonials={testimonials} locale={locale} />
        <NextBar label={copy.next} onClick={continueFrom} />
      </div>
    );
  }

  let lines: ReactNode = null;
  let stat: { n: number; label: string } | null = null;
  let extra: ReactNode = null;
  switch (step) {
    case "stop-stad": {
      const content = stopStadContent(copy, locale, answerCities(answers), cityCounts, subsetCounts);
      lines = content.title;
      stat = content.stat;
      const parts = [content.countLine, content.perCity, content.waitlistLine].filter(Boolean);
      if (parts.length) {
        extra = parts.map((text, i) => (
          <span key={i} className={i ? "mt-1 block" : "block"}>
            {text}
          </span>
        ));
      }
      break;
    }
    case "stop-zoekt":
      lines = copy.stopZoekt[stopZoektAnswer(answers)];
      break;
    case "stop-gesprek":
      lines = answers.conversation === "both" ? copy.stopGesprek.both : copy.stopGesprek.known;
      break;
    case "stop-wijn":
      lines = copy.stopWijn[answers.wine ?? "red"];
      break;
    case "stop-alleen":
      lines = copy.stopAlleen;
      break;
    case "stop-twijfel":
      lines = copy.stopTwijfel.title;
      extra = copy.stopTwijfel.line;
      break;
    case "stop-wie":
      lines = copy.stopWie[answers.companionWho ?? "friend"];
      break;
  }
  return (
    <div className="flex min-h-[calc(100svh-11rem)] flex-col justify-center pb-28 pt-4">
      <OvalPhoto photo={photo} priority />
      <Statement>{lines}</Statement>
      {extra ? <StatementSub>{extra}</StatementSub> : null}
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

/** Real table photos for the row of faces on "Wat gasten zeggen" (none of
 * them on another quiz screen). */
const GUEST_FACES = [
  { src: "/girls-only/table-group.jpg", position: "45% 40%" },
  { src: "/girls-only/wine-moment.jpg", position: "52% 40%" },
  { src: "/girls-only/wine-tasting-presenter.jpg", position: "8% 30%" },
];

/** How far each round photo zooms in on its face: the sources are table
 * shots, so uncropped a face is only a few pixels in a 56px circle. */
const FACE_ZOOM = 2.2;

/** Three overlapping round photos with a white ring, zoomed in on a face. */
function GuestFaces() {
  const stagger = useStagger(0);
  return (
    <motion.div {...stagger} aria-hidden className="flex justify-center">
      {GUEST_FACES.map((face, i) => (
        <span
          key={face.src}
          className={`relative h-14 w-14 overflow-hidden rounded-full bg-wine/10 shadow-[0_6px_16px_rgba(43,13,18,0.16)] ring-[3px] ring-white ${i ? "-ml-3.5" : ""}`}
        >
          {/* Sized for the zoom and the landscape crop, at full quality. */}
          <Image
            src={face.src}
            alt=""
            fill
            sizes="260px"
            quality={100}
            className="object-cover"
            style={{ objectPosition: face.position, transform: `scale(${FACE_ZOOM})`, transformOrigin: face.position }}
          />
        </span>
      ))}
    </motion.div>
  );
}

/** The guests' own words, three stacked (the shortest three when there are
 * more), in their original order. */
function ReviewList({ testimonials, locale }: { testimonials: QuizTestimonial[]; locale: Locale }) {
  const shortest = new Set([...testimonials].sort((a, b) => a.quote.length - b.quote.length).slice(0, 3));
  const shown = testimonials.filter((t) => shortest.has(t));
  if (shown.length === 0) return null;
  return (
    <ul className="mt-6 space-y-3">
      {shown.map((t, i) => (
        <ReviewCard key={t.name} index={i} testimonial={t} locale={locale} />
      ))}
    </ul>
  );
}

function ReviewCard({ testimonial: t, index, locale }: { testimonial: QuizTestimonial; index: number; locale: Locale }) {
  const stagger = useStagger(index + 3);
  return (
    <motion.li
      {...stagger}
      className="relative overflow-hidden rounded-[1.5rem] border border-gold/25 bg-white px-6 pb-4 pt-5 shadow-[0_1px_2px_rgba(43,13,18,0.04),0_14px_34px_-12px_rgba(43,13,18,0.18)]"
    >
      <QuoteIcon className="h-5 w-5 text-gold/80" />
      <p className="mt-2 font-serif text-[1.1rem] leading-[1.4] text-wine">{t.quote}</p>
      <div className="mt-4 flex items-center gap-2.5 border-t border-wine/[0.06] pt-3.5">
        <span
          aria-hidden
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-burgundy/[0.08] font-serif text-[0.95rem] font-semibold text-burgundy ring-1 ring-gold/30"
        >
          {t.name.trim().charAt(0).toLocaleUpperCase("nl-NL")}
        </span>
        <p className="text-[0.82rem] leading-tight text-wine/55">
          <span className="font-semibold text-wine/85">{t.name}</span>
          <span className="px-1.5 text-gold/70">·</span>
          {displayCity(t.city, locale)}
        </p>
      </div>
    </motion.li>
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
  const { answerAndNext, step, variant } = useQuiz();
  const tail = variant === "sheet" ? "" : "pb-24";
  const gap = variant === "sheet" ? "mt-5" : answersGap;
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
        <div role="radiogroup" className={`${gap} grid grid-cols-2 gap-3 ${tail}`}>
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
        <div role="radiogroup" className={`${gap} space-y-3 ${tail}`}>
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
  const { copy, answers, accountFirstName, answerAndNext, variant } = useQuiz();
  const sheet = variant === "sheet";
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
      <label htmlFor="jt-quiz-name" className={`${smallCaps} ${sheet ? "mt-5" : answersGap} block text-center`}>
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

/** The place list, loaded once and only when the "Andere stad" field is
 * used (a separate chunk, about 28 KB gzipped). */
let placeIndexPromise: Promise<PlaceIndex> | null = null;
function loadPlaceIndex(): Promise<PlaceIndex> {
  placeIndexPromise ??= import("@/lib/jouw-tafel/nl-places.json").then((mod) =>
    buildPlaceIndex((mod.default ?? mod) as unknown as RawPlace[]),
  );
  return placeIndexPromise;
}

/**
 * "Andere stad": a combobox over the fixed place list. Only a place from the
 * list can be picked (no free text). Up to 6 suggestions, names that start
 * with what was typed first. Arrow keys move, Enter picks, Escape closes.
 */
function PlaceCombobox({
  copy,
  exclude,
  inputRef,
  query,
  onQuery,
  onPick,
  error,
  attempt,
}: {
  copy: QuizCopy;
  exclude: readonly string[];
  inputRef: RefObject<HTMLInputElement | null>;
  query: string;
  onQuery: (value: string) => void;
  onPick: (place: Place) => void;
  error: boolean;
  attempt: number;
}) {
  const [index, setIndex] = useState<PlaceIndex | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = "jt-quiz-place-list";
  const results = index && query.trim()
    ? searchPlaces(index, query, 6 + exclude.length).filter((p) => !exclude.includes(p.label)).slice(0, 6)
    : [];
  const expanded = open && results.length > 0;

  function ensureLoaded() {
    if (!index) void loadPlaceIndex().then(setIndex);
  }

  function pick(place: Place) {
    onPick(place);
    setOpen(false);
    setActive(0);
  }

  return (
    <div className="mt-5">
      <label htmlFor="jt-quiz-city" className={`${smallCaps} block text-center`}>
        {copy.stad.otherLabel}
      </label>
      <input
        ref={inputRef}
        id="jt-quiz-city"
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={expanded ? `${listId}-${active}` : undefined}
        autoComplete="off"
        enterKeyHint="done"
        maxLength={60}
        value={query}
        placeholder={copy.stad.otherPlaceholder}
        onFocus={() => {
          ensureLoaded();
          setOpen(true);
          // Room for the suggestions above the keyboard and the sticky button.
          requestAnimationFrame(() => inputRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }));
        }}
        onBlur={() => setOpen(false)}
        onChange={(e) => {
          ensureLoaded();
          onQuery(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && results.length) {
            e.preventDefault();
            setOpen(true);
            setActive((i) => (i + 1) % results.length);
          } else if (e.key === "ArrowUp" && results.length) {
            e.preventDefault();
            setOpen(true);
            setActive((i) => (i - 1 + results.length) % results.length);
          } else if (e.key === "Enter") {
            e.preventDefault();
            const place = results[active] ?? results[0];
            if (expanded && place) pick(place);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        aria-invalid={error || undefined}
        className={`${inputClass} mt-2 scroll-mt-24 text-center ${error ? inputBad : inputOk}`}
      />
      <div className={open ? "min-h-[20rem]" : ""}>
        {expanded ? (
          <ul
            id={listId}
            role="listbox"
            aria-label={copy.stad.otherLabel}
            className="mt-2 overflow-hidden rounded-2xl border border-wine/[0.08] bg-white shadow-[0_6px_18px_rgba(43,13,18,0.06)]"
          >
            {results.map((place, i) => (
              <li
                key={place.label}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(place)}
                className={`flex min-h-12 cursor-pointer items-center gap-2.5 px-4 text-[1rem] text-wine ${
                  i === active ? "bg-burgundy/[0.06]" : ""
                } ${i ? "border-t border-wine/[0.06]" : ""}`}
              >
                <PinIcon className="h-4 w-4 shrink-0 text-wine/40" />
                {place.label}
              </li>
            ))}
          </ul>
        ) : null}
        {open && index && query.trim() && results.length === 0 ? (
          <p aria-live="polite" className="mt-2 text-center text-sm text-wine/60">
            {copy.stad.noResults}
          </p>
        ) : null}
        {error ? <FieldError message={copy.stad.otherError} attempt={attempt} /> : null}
      </div>
    </div>
  );
}

export function CityScreen() {
  const { copy, locale, answers, geoCity, answerAndNext, variant } = useQuiz();
  const sheet = variant === "sheet";
  const saved = answerCities(answers);
  // In the order they were picked: our cities and place labels. The visitor's
  // own city (geo, only when it is one of ours) is ticked to start with.
  const [picked, setPicked] = useState<string[]>(() =>
    saved.length ? saved.map((c) => supportedCity(c) ?? c) : geoCity ? [geoCity] : [],
  );
  const [otherOpen, setOtherOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const otherRef = useRef<HTMLInputElement>(null);
  const prefilledFromGeo = saved.length === 0 && geoCity !== null;
  const places = picked.filter((c) => !supportedCity(c));
  const full = picked.length >= CITIES_MAX;

  function toggle(city: string) {
    setPicked((prev) => (prev.includes(city) ? prev.filter((v) => v !== city) : [...prev, city].slice(0, CITIES_MAX)));
  }

  function pickPlace(place: Place) {
    // One of our cities typed in the field ticks that city itself.
    const city = supportedCity(place.label) ?? place.label;
    setPicked((prev) => (prev.includes(city) ? prev : [...prev, city].slice(0, CITIES_MAX)));
    setQuery("");
    setError(false);
  }

  function confirm() {
    // Typed but not picked from the list: nothing is saved from free text.
    if (otherOpen && query.trim()) {
      setError(true);
      setAttempt((n) => n + 1);
      otherRef.current?.focus();
      return;
    }
    if (picked.length === 0) return;
    answerAndNext(cityStepAnswer(picked));
  }
  usePrimaryAction(picked.length > 0 ? confirm : null);

  return (
    <div>
      <QuestionHead title={copy.stad.title} sub={copy.stad.sub} />
      <div role="group" className={`${sheet ? "mt-5" : answersGap} space-y-3`}>
        {QUIZ_CITIES.map((city, i) => {
          const selected = picked.includes(city);
          return (
            <div key={city}>
              {prefilledFromGeo && city === geoCity ? (
                <p className="mb-1.5 flex items-center gap-1.5 pl-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                  <PinIcon className="h-3.5 w-3.5" />
                  {copy.stad.geoHint}
                </p>
              ) : null}
              <ChoiceButton
                index={i}
                multi
                selected={selected}
                disabled={!selected && full}
                label={displayCity(city, locale)}
                icon={optionIcon("stad", city)}
                onClick={() => toggle(city)}
              />
            </div>
          );
        })}
        {places.map((place, i) => (
          <ChoiceButton
            key={place}
            index={QUIZ_CITIES.length + i}
            multi
            selected
            label={place}
            icon={optionIcon("stad", "other")}
            onClick={() => toggle(place)}
          />
        ))}
        <ChoiceButton
          index={QUIZ_CITIES.length + places.length}
          multi
          selected={otherOpen}
          disabled={!otherOpen && full}
          label={copy.stad.other}
          icon={optionIcon("stad", "other")}
          onClick={() => {
            const next = !otherOpen;
            setOtherOpen(next);
            setError(false);
            if (next) requestAnimationFrame(() => otherRef.current?.focus());
            else setQuery("");
          }}
        />
      </div>
      {otherOpen ? (
        <PlaceCombobox
          copy={copy}
          exclude={picked}
          inputRef={otherRef}
          query={query}
          onQuery={(value) => {
            setQuery(value);
            if (error) setError(false);
          }}
          onPick={pickPlace}
          error={error}
          attempt={attempt}
        />
      ) : null}
      {sheet ? null : <div className="h-28" />}
      <NextBar label={copy.next} onClick={confirm} disabled={picked.length === 0} />
    </div>
  );
}

export function WhyScreen() {
  const { copy, answers, answerAndNext, variant } = useQuiz();
  const sheet = variant === "sheet";
  const [picked, setPicked] = useState<WhyAnswer[]>(answers.why ?? []);
  const submit = () => answerAndNext({ why: picked });
  usePrimaryAction(picked.length ? submit : null);
  return (
    <>
      <QuestionHead title={copy.zoekt.title} sub={copy.chooseMax(WHY_MAX)} />
      <div role="group" className={`${sheet ? "mt-5" : answersGap} space-y-3 ${sheet ? "" : "pb-28"}`}>
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
  const { copy, answers, answerAndNext, variant } = useQuiz();
  const sheet = variant === "sheet";
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
      <div role="group" className={`${sheet ? "mt-5" : answersGap} grid grid-cols-2 gap-3`}>
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
      {sheet ? null : <div className="h-28" />}
      <NextBar label={picked.length ? copy.next : copy.skip} onClick={submit} />
    </>
  );
}

/** "Hoe ken je ons?": one tap moves on, except "Anders", which opens a field
 * to say where (optional) and waits for "Verder". */
export function HeardFromScreen() {
  const { copy, answers, answerAndNext, variant } = useQuiz();
  const sheet = variant === "sheet";
  const [picked, setPicked] = useState<HeardFromAnswer | undefined>(answers.heardFrom);
  const [other, setOther] = useState(answers.heardFromOther ?? "");
  const otherRef = useRef<HTMLInputElement>(null);
  const submitOther = () => answerAndNext({ heardFrom: "other", heardFromOther: other.trim() || undefined });
  usePrimaryAction(
    picked === "other" ? submitOther : picked ? () => answerAndNext({ heardFrom: picked, heardFromOther: undefined }) : null,
  );
  function choose(id: HeardFromAnswer) {
    setPicked(id);
    if (id === "other") {
      // Seven answers fill the screen: bring the field up above "Verder".
      requestAnimationFrame(() => {
        otherRef.current?.focus({ preventScroll: true });
        otherRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      });
      return;
    }
    answerAndNext({ heardFrom: id, heardFromOther: undefined }, { delay: AUTO_ADVANCE_MS });
  }
  return (
    <>
      <QuestionHead title={copy.bron.title} />
      <div role="radiogroup" className={`${sheet ? "mt-5" : answersGap} space-y-3`}>
        {HEARD_FROM_OPTIONS.map((id, i) => (
          <ChoiceButton
            key={id}
            index={i}
            selected={picked === id}
            label={copy.bron.options[id]}
            icon={optionIcon("bron", id)}
            onClick={() => choose(id)}
          />
        ))}
      </div>
      {picked === "other" ? (
        <div className="mt-5">
          <label htmlFor="jt-quiz-heard-from" className={`${smallCaps} block text-center`}>
            {copy.bron.otherLabel}
          </label>
          <input
            ref={otherRef}
            id="jt-quiz-heard-from"
            type="text"
            maxLength={120}
            enterKeyHint="next"
            value={other}
            placeholder={copy.bron.otherPlaceholder}
            onChange={(e) => setOther(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitOther();
              }
            }}
            className={`${inputClass} mt-2 text-center ${inputOk}`}
          />
        </div>
      ) : null}
      {sheet ? null : <div className="h-28" />}
      {picked === "other" ? <NextBar label={copy.next} onClick={submitOther} /> : null}
    </>
  );
}

export function FormatsScreen() {
  const { copy, answers, answerAndNext, variant } = useQuiz();
  const sheet = variant === "sheet";
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
      <div role="group" className={`${sheet ? "mt-5" : answersGap} space-y-3 ${sheet ? "" : "pb-28"}`}>
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

// ---------------------------------------------------------------- one question

/** The screen for one question, as in the quiz. The settings page shows the
 * same component in a sheet (QuizScreenContext variant "sheet"). */
export function QuizQuestion({ step }: { step: QuizStepId }) {
  const { copy, answers } = useQuiz();
  switch (step) {
    case "naam":
      return <NameScreen />;
    case "geboortedatum":
      return <BirthDateScreen />;
    case "leeftijd":
      return (
        <SingleChoiceScreen
          title={copy.leeftijd.title}
          options={AGE_MATTERS_OPTIONS}
          labels={copy.leeftijd.options}
          value={answers.ageMatters}
          toPatch={(v) => ({ ageMatters: v })}
        />
      );
    case "gender":
      return (
        <SingleChoiceScreen
          title={copy.gender.title}
          options={GENDER_OPTIONS}
          labels={copy.gender.options}
          value={answers.gender}
          toPatch={(v) => ({ gender: v, ...(v !== "female" ? { tableType: undefined } : {}) })}
        />
      );
    case "tafeltype":
      return (
        <SingleChoiceScreen
          title={copy.tafeltype.title}
          options={TABLE_TYPE_OPTIONS}
          labels={copy.tafeltype.options}
          value={answers.tableType}
          toPatch={(v) => ({ tableType: v })}
        />
      );
    case "stad":
      return <CityScreen />;
    case "zoekt":
      return <WhyScreen />;
    case "gesprek":
      return (
        <SingleChoiceScreen
          title={copy.gesprek.title}
          options={CONVERSATION_OPTIONS}
          labels={copy.gesprek.options}
          value={answers.conversation}
          toPatch={(v) => ({ conversation: v })}
        />
      );
    case "wijn":
      return (
        <SingleChoiceScreen
          title={copy.wijn.title}
          options={WINE_OPTIONS}
          labels={copy.wijn.options}
          value={answers.wine}
          toPatch={(v) => ({ wine: v })}
        />
      );
    case "gezelschap":
      return (
        <SingleChoiceScreen
          title={copy.gezelschap.title}
          options={COMPANION_OPTIONS}
          labels={copy.gezelschap.options}
          value={answers.companion}
          toPatch={(v) => ({ companion: v, ...(v === "alone" ? { companionWho: undefined } : {}) })}
          photos={COMPANION_PHOTOS}
        />
      );
    case "wie":
      return (
        <SingleChoiceScreen
          title={copy.wie.title}
          options={COMPANION_WHO_OPTIONS}
          labels={copy.wie.options}
          value={answers.companionWho}
          toPatch={(v) => ({ companionWho: v })}
        />
      );
    case "taal":
      return (
        <SingleChoiceScreen
          title={copy.taal.title}
          options={LANGUAGE_OPTIONS}
          labels={copy.taal.options}
          value={answers.language}
          toPatch={(v) => ({ language: v })}
        />
      );
    case "dieet":
      return <DietScreen />;
    case "formats":
      return <FormatsScreen />;
    case "bron":
      return <HeardFromScreen />;
    case "klaar":
      return (
        <SingleChoiceScreen
          title={copy.klaar.title}
          options={READY_OPTIONS}
          labels={copy.klaar.options}
          value={answers.ready}
          toPatch={(v) => ({ ready: v })}
        />
      );
    default:
      return null;
  }
}
