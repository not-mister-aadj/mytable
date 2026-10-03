"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { JouwTafelLogoutButton } from "@/components/jouw-tafel/JouwTafelLogoutButton";
import { ArrowLeftIcon } from "@/components/jouw-tafel/icons";
import { QuizChoose, type ChooseHandlers } from "@/components/jouw-tafel/quiz/QuizChoose";
import { PhotoPreload } from "@/components/jouw-tafel/quiz/quiz-ui";
import {
  BirthDateScreen,
  CityScreen,
  DietScreen,
  FormatsScreen,
  NameScreen,
  QuizScreenContext,
  STOP_PHOTOS,
  COMPANION_PHOTOS,
  SEARCH_MS,
  SearchScreen,
  SingleChoiceScreen,
  StopScreen,
  WelcomeScreen,
  WhyScreen,
  type QuizTestimonial,
} from "@/components/jouw-tafel/quiz/quiz-screens";
import { switchLocalePath, type Locale } from "@/i18n/config";
import { saveMemberLocalePreference } from "@/features/auth/save-onboarding";
import { getMetaBrowserCookies, getMetaEventSourceUrl } from "@/lib/analytics/metaCookies";
import { trackLanguageChanged, trackQuizEvent, trackQuizStepLeft } from "@/lib/posthog/analytics";
import { PostHogEvents } from "@/lib/posthog/events";
import type { QuizCity, QuizEvent } from "@/lib/jouw-tafel/logic";
import { getQuizCopy, type QuizCopy } from "@/lib/jouw-tafel/quiz-copy";
import {
  AGE_MATTERS_OPTIONS,
  COMPANION_OPTIONS,
  COMPANION_WHO_OPTIONS,
  CONVERSATION_OPTIONS,
  HEARD_FROM_OPTIONS,
  LANGUAGE_OPTIONS,
  QUIZ_CHAPTERS,
  QUIZ_STEPS,
  QUIZ_VERSION,
  READY_OPTIONS,
  WINE_OPTIONS,
  ageBracket,
  analyticsAnswer,
  answerCities,
  chapterOf,
  hasAnyAnswer,
  isQuizComplete,
  nextStep,
  parseBirthDate,
  previousStep,
  quizSteps,
  resolveStep,
  sanitizeQuizState,
  stepKind,
  stepPosition,
  type QuizAnswers,
  type QuizState,
  type QuizStepId,
} from "@/lib/jouw-tafel/quiz-logic";

export type { QuizTestimonial };

const SAVE_URL = "/api/auth/member/quiz";

type SaveJob = { state: QuizState; waitlist: boolean };

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function readLocal(key: string): QuizState | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? sanitizeQuizState(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function writeLocal(key: string, state: QuizState) {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    /* private mode: the account copy is enough */
  }
}

function postSave(job: SaveJob, locale: Locale, extra?: Record<string, unknown>, keepalive = false) {
  return fetch(SAVE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Only on page exit: keepalive bodies are capped at 64 KB and some
    // in-app browsers handle them poorly.
    keepalive,
    body: JSON.stringify({
      state: job.state,
      locale,
      waitlist: job.waitlist,
      meta: job.waitlist ? { ...getMetaBrowserCookies(), eventSourceUrl: getMetaEventSourceUrl() } : undefined,
      ...extra,
    }),
  });
}

/**
 * Saves in the background: one request at a time, the newest state wins,
 * three tries with backoff. Never blocks the screen. A save that still
 * fails is kept and goes along with the next one (or on page exit).
 */
class QuizSaver {
  private pending: SaveJob | null = null;
  private inFlight: Promise<boolean> | null = null;

  constructor(private readonly locale: Locale) {}

  save(state: QuizState, waitlist = false) {
    this.pending = { state, waitlist: waitlist || Boolean(this.pending?.waitlist) };
    void this.flush();
  }

  /** Sends what is waiting; resolves to false when it could not be saved. */
  private flush(): Promise<boolean> {
    if (this.inFlight) return this.inFlight;
    const job = this.pending;
    if (!job) return Promise.resolve(true);
    this.pending = null;
    this.inFlight = (async () => {
      let ok = false;
      for (let attempt = 0; attempt < 3 && !ok; attempt += 1) {
        try {
          const res = await postSave(job, this.locale);
          // 4xx other than rate limiting will not get better on a retry.
          ok = res.ok || (res.status >= 400 && res.status < 500 && res.status !== 429);
        } catch {
          ok = false;
        }
        if (!ok && attempt < 2) await sleep(700 * 2 ** attempt);
      }
      const newer = this.pending as SaveJob | null;
      if (!ok) {
        this.pending = newer ? { state: newer.state, waitlist: newer.waitlist || job.waitlist } : job;
      }
      this.inFlight = null;
      // Something newer came in while this was on its way: send it too.
      if (ok && newer) void this.flush();
      return ok;
    })();
    return this.inFlight;
  }

  /** Wait for saves to land (at most `timeoutMs`), e.g. before leaving. */
  async settle(timeoutMs = 1500) {
    const deadline = Date.now() + timeoutMs;
    const drain = async () => {
      while ((this.pending || this.inFlight) && Date.now() < deadline) {
        if (!(await this.flush())) return;
      }
    };
    await Promise.race([drain(), sleep(timeoutMs)]);
  }

  /** On page exit: send what is still waiting with keepalive. */
  flushOnExit() {
    const job = this.pending;
    if (!job) return;
    this.pending = null;
    void postSave(job, this.locale, undefined, true).catch(() => {});
  }
}

// ------------------------------------------------------------------- chrome

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <circle cx="5.5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="18.5" cy="12" r="1.6" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[1.1rem] w-[1.1rem]"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.3 2.4 3.4 5.2 3.4 8.5s-1.1 6.1-3.4 8.5c-2.3-2.4-3.4-5.2-3.4-8.5S9.7 5.9 12 3.5Z" />
    </svg>
  );
}

function QuizHeader({
  locale,
  copy,
  step,
  chapterFill,
  progress,
  canGoBack,
  onBack,
  langHref,
  onLanguage,
  logout,
}: {
  locale: Locale;
  copy: QuizCopy;
  step: QuizStepId;
  /** How far along each chapter is, 0 to 1. */
  chapterFill: number[];
  progress: number;
  canGoBack: boolean;
  onBack: () => void;
  langHref: string;
  onLanguage: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  /** The "Uitloggen" menu item. */
  logout: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const chapter = chapterOf(step);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-30 bg-cream/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-cream/80">
      <div className="mx-auto grid h-14 w-full max-w-md grid-cols-[3rem_1fr_3rem] items-center px-2">
        <button
          type="button"
          onClick={onBack}
          aria-label={copy.back}
          tabIndex={canGoBack ? 0 : -1}
          aria-hidden={!canGoBack}
          className={`flex h-11 w-11 items-center justify-center rounded-full text-wine transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/50 active:scale-95 active:bg-wine/5 ${
            canGoBack ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <ArrowLeftIcon className="h-[1.35rem] w-[1.35rem]" />
        </button>
        <p className="relative h-5 overflow-hidden text-center text-[0.9rem] font-semibold leading-5 text-wine">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={chapter}
              initial={reduceMotion ? false : { y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { y: -14, opacity: 0 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="block"
            >
              {copy.chapters[chapter]}
            </motion.span>
          </AnimatePresence>
        </p>
        <div ref={menuRef} className="relative justify-self-end">
          <button
            type="button"
            aria-label={copy.menu}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-11 w-11 items-center justify-center rounded-full text-wine transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/50 active:scale-95 active:bg-wine/5"
          >
            <MoreIcon />
          </button>
          <AnimatePresence>
            {menuOpen ? (
              <motion.div
                role="menu"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -4 }}
                transition={{ duration: 0.16 }}
                className="absolute right-1 top-12 z-40 min-w-52 origin-top-right overflow-hidden rounded-2xl border border-wine/10 bg-white py-1 shadow-[0_18px_48px_rgba(43,13,18,0.16)]"
              >
                <Link
                  href={langHref}
                  onClick={onLanguage}
                  role="menuitem"
                  hrefLang={locale === "nl" ? "en" : "nl"}
                  aria-label={locale === "nl" ? "Switch to English" : "Schakel naar Nederlands"}
                  className="flex min-h-12 w-full items-center gap-3 px-4 text-[0.95rem] font-medium text-wine active:bg-cream"
                >
                  <GlobeIcon />
                  <span className="flex-1">{locale === "nl" ? "English" : "Nederlands"}</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-wine/40">
                    {locale === "nl" ? "EN" : "NL"}
                  </span>
                </Link>
                <div className="mx-4 h-px bg-wine/[0.07]" />
                {logout}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
      <div
        className="mx-auto flex w-full max-w-md gap-1.5 px-5 pb-2.5"
        role="progressbar"
        aria-label={copy.chapters[chapter]}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        {QUIZ_CHAPTERS.map((c, i) => (
          <div key={c} className="h-[3px] flex-1 overflow-hidden rounded-full bg-wine/[0.09]">
            <motion.div
              className="h-full origin-left rounded-full bg-burgundy"
              initial={false}
              animate={{ scaleX: chapterFill[i] ?? 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        ))}
      </div>
    </header>
  );
}

// ------------------------------------------------------------------- the quiz

export function JouwTafelQuiz({
  locale,
  email,
  storageKey,
  initialState,
  initialStep,
  requestedStep,
  accountFirstName,
  geoCity,
  events,
  now,
  cityCounts,
  subsetCounts,
  testimonials,
  landingPath,
}: {
  locale: Locale;
  email: string;
  /** localStorage key for this account's copy of the answers. */
  storageKey: string;
  initialState: QuizState;
  initialStep: QuizStepId;
  requestedStep: string | null;
  accountFirstName: string;
  geoCity: QuizCity | null;
  events: QuizEvent[];
  now: number;
  /** Sign-ups per city, rounded down to tens, SIGNUP_COUNT_MIN and up only. */
  cityCounts: Record<string, number>;
  /** Distinct sign-ups per combination of our cities (keyed by cityMask),
   * rounded down to tens, SIGNUP_COUNT_MIN and up only. */
  subsetCounts: Record<string, number>;
  testimonials: QuizTestimonial[];
  landingPath: string;
}) {
  const copy = getQuizCopy(locale);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const [saver] = useState(() => new QuizSaver(locale));
  const save = useCallback((state: QuizState, waitlist = false) => saver.save(state, waitlist), [saver]);
  const settle = useCallback(() => saver.settle(), [saver]);
  const flushOnExit = useCallback(() => saver.flushOnExit(), [saver]);

  const [quiz, setQuiz] = useState<QuizState>(initialState);
  const answers = quiz.answers;
  const quizRef = useRef(quiz);
  useEffect(() => {
    quizRef.current = quiz;
  }, [quiz]);
  const urlStep = searchParams.get("stap");
  // Before the first effect the URL may still lack ?stap: use the server's.
  const step: QuizStepId = urlStep ? resolveStep(urlStep, answers) : initialStep;
  const steps = useMemo(() => quizSteps(answers), [answers]);
  const position = stepPosition(step, answers);
  const progress = position.total > 1 ? position.index / (position.total - 1) : 0;
  // One bar per chapter: full behind you, filling where you are.
  const chapterFill = useMemo(() => {
    const current = QUIZ_CHAPTERS.indexOf(chapterOf(step));
    return QUIZ_CHAPTERS.map((c, i) => {
      if (i < current) return 1;
      if (i > current) return 0;
      const inChapter = steps.filter((s) => chapterOf(s) === c);
      const at = inChapter.indexOf(step);
      return inChapter.length ? Math.max(0.06, (at + 1) / inChapter.length) : 0;
    });
  }, [steps, step]);

  // Slide direction: forward slides left, back slides right.
  const [view, setView] = useState<{ step: QuizStepId; dir: 1 | -1 }>({ step, dir: 1 });
  if (view.step !== step) {
    const from = QUIZ_STEPS.indexOf(view.step);
    const to = QUIZ_STEPS.indexOf(step);
    setView({ step, dir: to >= from ? 1 : -1 });
  }

  // ------------------------------------------------------------ analytics

  const common = useCallback(
    (s: QuizStepId, a: QuizAnswers) => {
      const pos = stepPosition(s, a);
      return {
        step_id: s,
        step_index: pos.index,
        chapter: chapterOf(s),
        total_steps: pos.total,
        locale,
        quiz_version: QUIZ_VERSION,
      };
    },
    [locale],
  );

  const stepStartedAt = useRef(0);
  const lastViewed = useRef<QuizStepId | null>(null);
  useEffect(() => {
    if (lastViewed.current === step) return;
    lastViewed.current = step;
    stepStartedAt.current = Date.now();
    trackQuizEvent(PostHogEvents.quizStepViewed, common(step, answers));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Abandonment: which screen people leave on, and how long they were there.
  const stepRef = useRef(step);
  const answersRef = useRef(answers);
  useEffect(() => {
    stepRef.current = step;
    answersRef.current = answers;
  }, [step, answers]);
  useEffect(() => {
    let sentForThisHide = false;
    const left = () => {
      flushOnExit();
      if (sentForThisHide) return;
      sentForThisHide = true;
      trackQuizStepLeft({
        ...common(stepRef.current, answersRef.current),
        ms_on_step: Date.now() - stepStartedAt.current,
      });
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") left();
      else sentForThisHide = false;
    };
    window.addEventListener("pagehide", left);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", left);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [common, flushOnExit]);

  // ------------------------------------------------------------ navigation

  const buildUrl = useCallback((next: QuizStepId) => {
    const params = new URLSearchParams(window.location.search);
    params.set("stap", next);
    return `${window.location.pathname}?${params.toString()}${window.location.hash}`;
  }, []);

  const go = useCallback(
    (next: QuizStepId, options?: { replace?: boolean }) => {
      const depth = Number((window.history.state as { quizDepth?: number } | null)?.quizDepth ?? 0);
      if (options?.replace) window.history.replaceState({ quizDepth: depth }, "", buildUrl(next));
      else window.history.pushState({ quizDepth: depth + 1 }, "", buildUrl(next));
      window.scrollTo({ top: 0 });
    },
    [buildUrl],
  );

  // First load: put the resolved step in the URL, pick up a newer copy of
  // the answers from this browser, and note a resume.
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    if (urlStep !== initialStep) {
      window.history.replaceState({ quizDepth: 0 }, "", buildUrl(initialStep));
    }
    // A newer copy in this browser (a save that had not landed yet).
    const local = readLocal(storageKey);
    if (local && (local.updatedAt ?? 0) > (initialState.updatedAt ?? 0)) {
      quizRef.current = local;
      requestAnimationFrame(() => setQuiz(local));
      save(local);
    }
    if (hasAnyAnswer(initialState.answers)) {
      trackQuizEvent(PostHogEvents.quizResumed, {
        ...common(initialStep, initialState.answers),
        from_step: initialStep,
        requested_step: requestedStep ?? undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goBack = useCallback(() => {
    const prev = previousStep(step, answers);
    if (!prev) return;
    trackQuizEvent(PostHogEvents.quizBackClicked, { ...common(step, answers), to_step: prev });
    const depth = Number((window.history.state as { quizDepth?: number } | null)?.quizDepth ?? 0);
    if (depth > 0) window.history.back();
    else go(prev, { replace: true });
  }, [step, answers, common, go]);

  // ------------------------------------------------------------ answering

  /** Store new answers (optimistic, saved in the background). */
  const commit = useCallback(
    (patch: Partial<QuizAnswers>, from: QuizStepId): QuizState => {
      const current = quizRef.current;
      const nextAnswers: QuizAnswers = { ...current.answers, ...patch };
      for (const key of Object.keys(nextAnswers) as Array<keyof QuizAnswers>) {
        if (nextAnswers[key] === undefined) delete nextAnswers[key];
      }
      const t = Date.now();
      const startedAt = current.startedAt ?? t;
      const justCompleted = !current.completedAt && isQuizComplete(nextAnswers);
      const next: QuizState = {
        ...current,
        answers: nextAnswers,
        startedAt,
        updatedAt: t,
        ...(justCompleted ? { completedAt: t } : {}),
      };
      quizRef.current = next;
      setQuiz(next);
      writeLocal(storageKey, next);
      save(next, justCompleted);

      const answer = analyticsAnswer(from, nextAnswers);
      trackQuizEvent(PostHogEvents.quizStepCompleted, {
        ...common(from, nextAnswers),
        ...(answer !== null ? { answer } : {}),
        ms_on_step: t - stepStartedAt.current,
        ...(from === "geboortedatum" && patch.birthDate
          ? { age_bracket: ageBracketOf(patch.birthDate) }
          : {}),
        ...(from === "stad" ? { city_count: answerCities(nextAnswers).length } : {}),
      });
      if (justCompleted) {
        trackQuizEvent(PostHogEvents.quizCompleted, {
          ...common(from, nextAnswers),
          duration_s: Math.round((t - startedAt) / 1000),
        });
      }
      return next;
    },
    [common, save, storageKey],
  );

  const advancing = useRef(false);
  useEffect(() => {
    advancing.current = false;
  }, [step]);

  /** After a question: commit and go on (single choice waits a beat so the
   * selected answer is seen). */
  const answerAndNext = useCallback(
    (patch: Partial<QuizAnswers>, options?: { delay?: number }) => {
      if (advancing.current) return;
      advancing.current = true;
      const from = step;
      const next = commit(patch, from);
      const target = nextStep(from, next.answers);
      if (!target) return;
      const delay = options?.delay ?? 0;
      if (delay) window.setTimeout(() => go(target), reduceMotion ? 0 : delay);
      else go(target);
    },
    [commit, go, step, reduceMotion],
  );

  /** Intro and stops: nothing to answer, just on. */
  const continueFrom = useCallback(() => {
    if (advancing.current) return;
    advancing.current = true;
    const t = Date.now();
    if (step === "welkom" && !quizRef.current.startedAt) {
      const next = { ...quizRef.current, startedAt: t, updatedAt: t };
      quizRef.current = next;
      setQuiz(next);
      writeLocal(storageKey, next);
      save(next);
    }
    trackQuizEvent(PostHogEvents.quizStepCompleted, {
      ...common(step, answers),
      ms_on_step: t - stepStartedAt.current,
    });
    const target = nextStep(step, answers);
    if (target) go(target);
  }, [step, answers, common, go, save, storageKey]);

  // The search screen moves on by itself; back from the list skips it.
  useEffect(() => {
    if (step !== "zoeken") return;
    const timer = window.setTimeout(() => go("kies", { replace: true }), reduceMotion ? 600 : SEARCH_MS);
    return () => window.clearTimeout(timer);
  }, [step, go, reduceMotion]);

  // Reaching the list: make sure the waitlist row has everything.
  const syncedWaitlist = useRef(false);
  useEffect(() => {
    if (step !== "kies" || syncedWaitlist.current) return;
    syncedWaitlist.current = true;
    save(quizRef.current, true);
  }, [step, save]);

  // Enter moves on from screens without a field.
  const primaryActionRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.defaultPrevented) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, button, a, select")) return;
      if (primaryActionRef.current) {
        event.preventDefault();
        primaryActionRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ------------------------------------------------------------ language, log out

  const langHref = useMemo(() => {
    const base = switchLocalePath(pathname, locale);
    return `${base}?stap=${step}`;
  }, [pathname, locale, step]);

  async function onLanguage(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const nextLocale: Locale = locale === "nl" ? "en" : "nl";
    trackLanguageChanged({ from_language: locale, to_language: nextLocale, page_path: pathname });
    void saveMemberLocalePreference(nextLocale);
    await settle();
    router.push(langHref);
  }

  const beforeLogout = useCallback(async () => {
    trackQuizEvent(PostHogEvents.quizLogoutClicked, common(step, answers));
    await settle();
  }, [common, step, answers, settle]);

  // ------------------------------------------------------------ toast

  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // ------------------------------------------------------------ kies handlers

  const notified = useMemo(() => new Set(quiz.notify ?? []), [quiz.notify]);

  const chooseHandlers: ChooseHandlers = useMemo(
    () => ({
      onViewed: (props) => trackQuizEvent(PostHogEvents.quizChooseViewed, { ...common("kies", answers), ...props }),
      onReserve: (props) => trackQuizEvent(PostHogEvents.quizReserveClicked, { ...common("kies", answers), ...props }),
      onNotify: (event) => {
        trackQuizEvent(PostHogEvents.quizNotifyClicked, {
          ...common("kies", answers),
          event_slug: event ? event.slug : null,
        });
        const key = event ? event.id : "city";
        const current = quizRef.current;
        const next: QuizState = {
          ...current,
          notify: [...new Set([...(current.notify ?? []), key])],
          updatedAt: Date.now(),
        };
        quizRef.current = next;
        setQuiz(next);
        writeLocal(storageKey, next);
        setToast(copy.kies.notified);
        // The event id goes along so the table's own "notify me" list has
        // them too; the city-wide one is the waitlist row itself.
        void postSave({ state: next, waitlist: true }, locale, event ? { notifyEventId: event.id } : undefined).catch(
          () => save(next, true),
        );
      },
      onShare: () => void share(),
      onInfo: () => trackQuizEvent(PostHogEvents.quizInfoOpened, { ...common("kies", answers), step: "kies" }),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [answers, common, copy, locale, save, storageKey],
  );

  async function share() {
    trackQuizEvent(PostHogEvents.quizShareClicked, common(step, answers));
    const params = new URLSearchParams({ utm_source: "share", utm_medium: "quiz", utm_campaign: "jouw-tafel" });
    const url = `${window.location.origin}${landingPath}?${params.toString()}`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: copy.kies.shareTitle, text: copy.kies.shareText, url });
        return;
      } catch (error) {
        // Closed the share sheet: done. Not allowed here: copy instead.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Older in-app browsers: copy through a hidden field.
      const field = document.createElement("textarea");
      field.value = url;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setToast(copy.kies.shareCopied);
  }

  // ------------------------------------------------------------ preloading

  const nextPhoto = useMemo(() => {
    const index = steps.indexOf(step);
    for (const s of steps.slice(index + 1, index + 4)) {
      if (STOP_PHOTOS[s]) return STOP_PHOTOS[s]!;
    }
    return null;
  }, [steps, step]);

  // ------------------------------------------------------------ render

  function renderScreen(): ReactNode {
    if (stepKind(step) === "stop") return <StopScreen />;
    switch (step) {
      case "welkom":
        return <WelcomeScreen />;
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
        return (
          <SingleChoiceScreen
            title={copy.bron.title}
            options={HEARD_FROM_OPTIONS}
            labels={copy.bron.options}
            value={answers.heardFrom}
            toPatch={(v) => ({ heardFrom: v })}
          />
        );
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
      case "zoeken":
        return <SearchScreen />;
      case "kies":
        return (
          <QuizChoose
            locale={locale}
            copy={copy}
            answers={answers}
            events={events}
            now={now}
            email={email}
            notified={notified}
            handlers={chooseHandlers}
          />
        );
      default:
        return null;
    }
  }

  const screenContext = {
    locale,
    copy,
    step,
    answers,
    accountFirstName,
    geoCity,
    cityCounts,
    subsetCounts,
    testimonials,
    reduceMotion: Boolean(reduceMotion),
    answerAndNext,
    continueFrom,
    primaryActionRef,
  };

  const slide = reduceMotion ? 0 : 36;

  return (
    <div className="min-h-[100svh] bg-cream text-wine">
      <QuizHeader
        locale={locale}
        copy={copy}
        step={step}
        chapterFill={chapterFill}
        progress={progress}
        canGoBack={previousStep(step, answers) !== null && step !== "zoeken"}
        onBack={goBack}
        langHref={langHref}
        onLanguage={(e) => void onLanguage(e)}
        logout={
          <JouwTafelLogoutButton
            label={copy.logOut}
            busyLabel={copy.loggingOut}
            redirectTo={landingPath}
            locale={locale}
            role="menuitem"
            onBeforeLogout={beforeLogout}
            className="flex min-h-12 w-full items-center pl-[2.85rem] pr-4 text-left text-[0.95rem] font-medium text-wine active:bg-cream disabled:opacity-60"
          />
        }
      />
      <main className="relative mx-auto w-full max-w-md overflow-x-clip px-5 pt-2">
        <AnimatePresence mode="popLayout" initial={false} custom={view.dir}>
          <motion.div
            key={step}
            custom={view.dir}
            variants={{
              enter: (dir: number) => ({ x: dir * slide, opacity: 0 }),
              center: { x: 0, opacity: 1, pointerEvents: "auto" },
              // The leaving screen can't be tapped while it fades out.
              exit: (dir: number) => ({ x: -dir * slide, opacity: 0, pointerEvents: "none" }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            <QuizScreenContext.Provider value={screenContext}>{renderScreen()}</QuizScreenContext.Provider>
          </motion.div>
        </AnimatePresence>
        {step === "kies" ? (
          <div className="flex justify-center pb-8">
            <JouwTafelLogoutButton
              label={copy.logOut}
              busyLabel={copy.loggingOut}
              redirectTo={landingPath}
              locale={locale}
              onBeforeLogout={beforeLogout}
            />
          </div>
        ) : null}
      </main>
      <PhotoPreload photo={nextPhoto} />
      <AnimatePresence>
        {toast ? (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[calc(env(safe-area-inset-top)+0.75rem)] z-50 mx-auto w-fit max-w-[calc(100%-2rem)] rounded-full bg-wine px-5 py-3 text-sm font-semibold text-cream shadow-[0_14px_34px_rgba(43,13,18,0.3)]"
          >
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ageBracketOf(iso: string): string | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return undefined;
  const result = parseBirthDate(match[3]!, match[2]!, match[1]!);
  return result.ok ? ageBracket(result.age) : undefined;
}
