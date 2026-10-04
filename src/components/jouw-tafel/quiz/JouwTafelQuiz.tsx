"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeftIcon } from "@/components/jouw-tafel/icons";
import { QuizChoose, type ChooseHandlers } from "@/components/jouw-tafel/quiz/QuizChoose";
import { PhotoPreload } from "@/components/jouw-tafel/quiz/quiz-ui";
import {
  QuizQuestion,
  QuizScreenContext,
  STOP_PHOTOS,
  SEARCH_MS,
  SearchScreen,
  StopScreen,
  WelcomeScreen,
  type QuizTestimonial,
} from "@/components/jouw-tafel/quiz/quiz-screens";
import { jouwTafelSettingsPath, jouwTafelTablePath, type Locale } from "@/i18n/config";
import { getMetaBrowserCookies, getMetaEventSourceUrl } from "@/lib/analytics/metaCookies";
import { trackMetaQuizLead } from "@/lib/analytics/metaTracking";
import { trackQuizEvent, trackQuizStepLeft, trackTableEvent } from "@/lib/posthog/analytics";
import { PostHogEvents } from "@/lib/posthog/events";
import type { QuizCity, QuizEvent } from "@/lib/jouw-tafel/logic";
import type { ClientMembership } from "@/lib/membership/logic";
import { getQuizCopy, type QuizCopy } from "@/lib/jouw-tafel/quiz-copy";
import {
  QUIZ_CHAPTERS,
  QUIZ_STEPS,
  QUIZ_VERSION,
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

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="8.5" r="3.4" />
      <path d="M5.5 19.5c.7-3.6 3.3-5.6 6.5-5.6s5.8 2 6.5 5.6" />
    </svg>
  );
}

/** Round avatar with the first initial (a person when there is no name):
 * opens the settings page. */
export function AvatarButton({
  name,
  label,
  href,
  onOpen,
}: {
  name: string;
  label: string;
  href: string;
  onOpen: () => void;
}) {
  const initial = name.trim().charAt(0).toLocaleUpperCase("nl-NL");
  return (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onOpen();
      }}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/50"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-burgundy/[0.1] text-[0.95rem] font-semibold text-burgundy ring-1 ring-burgundy/15 transition active:scale-95">
        {initial || <PersonIcon />}
      </span>
    </a>
  );
}

function QuizHeader({
  copy,
  step,
  chapterFill,
  progress,
  canGoBack,
  onBack,
  avatar,
  ladies = false,
}: {
  copy: QuizCopy;
  step: QuizStepId;
  /** How far along each chapter is, 0 to 1. */
  chapterFill: number[];
  progress: number;
  canGoBack: boolean;
  onBack: () => void;
  /** The avatar at the top right (to settings), only on the table list:
   * during the quiz nothing should pull people away from it. */
  avatar: ReactNode;
  /** "Ladies only" on the table list: the header takes the rose glow. */
  ladies?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const chapter = chapterOf(step);

  return (
    <header
      className={`sticky top-0 z-30 pt-[env(safe-area-inset-top)] backdrop-blur transition-colors duration-500 ${
        ladies ? "bg-[#f6e6e8]/90" : "bg-cream/95 supports-[backdrop-filter]:bg-cream/80"
      }`}
    >
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
        <div className="justify-self-end">{step === "kies" ? avatar : null}</div>
      </div>
      {/* No progress bar on the list of tables: the quiz is done there. */}
      {step === "kies" ? null : (
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
      )}
    </header>
  );
}

// ------------------------------------------------------------------- the quiz

export function JouwTafelQuiz({
  locale,
  userId,
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
  membership = null,
  booked = {},
}: {
  locale: Locale;
  /** localStorage key for this account's copy of the answers. */
  storageKey: string;
  /** For the quiz's Meta Lead event id (one per account). */
  userId: string;
  initialState: QuizState;
  initialStep: QuizStepId;
  requestedStep: string | null;
  accountFirstName: string;
  geoCity: QuizCity | null;
  events: QuizEvent[];
  now: number;
  /** Sign-ups per city, rounded up to hundreds, SIGNUP_COUNT_MIN and up only. */
  cityCounts: Record<string, number>;
  /** Distinct sign-ups per combination of our cities (keyed by cityMask),
   * rounded up to hundreds, SIGNUP_COUNT_MIN and up only. */
  subsetCounts: Record<string, number>;
  testimonials: QuizTestimonial[];
  landingPath: string;
  /** The person's running membership (null when not a member). */
  membership?: ClientMembership | null;
  /** Tables this person already has a seat at: event id to seats. */
  booked?: Record<string, number>;
}) {
  const copy = getQuizCopy(locale);
  const router = useRouter();
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
        // The funnel's Meta Lead, once per account; the server sends the
        // CAPI twin with the same event id on this save.
        trackMetaQuizLead({ userId, city: answerCities(nextAnswers)[0] ?? "" });
        trackQuizEvent(PostHogEvents.quizCompleted, {
          ...common(from, nextAnswers),
          duration_s: Math.round((t - startedAt) / 1000),
        });
      }
      return next;
    },
    [common, save, storageKey, userId],
  );

  const advancing = useRef(false);
  useEffect(() => {
    advancing.current = false;
  }, [step]);

  /** A change from the filters on "Kies je zondag" (cities, mixed or
   * ladies only): saved like an answer, also onto the waitlist rows. */
  const updateAnswers = useCallback(
    (patch: Partial<QuizAnswers>) => {
      const current = quizRef.current;
      const nextAnswers: QuizAnswers = { ...current.answers, ...patch };
      for (const key of Object.keys(nextAnswers) as Array<keyof QuizAnswers>) {
        if (nextAnswers[key] === undefined) delete nextAnswers[key];
      }
      const next: QuizState = { ...current, answers: nextAnswers, updatedAt: Date.now() };
      quizRef.current = next;
      setQuiz(next);
      writeLocal(storageKey, next);
      save(next, Boolean(next.completedAt));
    },
    [save, storageKey],
  );

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

  // ------------------------------------------------------------ settings

  /** Settings (language, preferences, log out). Pending saves go first;
   * `terug` brings the back arrow to this same step. */
  const settingsHref = `${jouwTafelSettingsPath(locale)}?terug=${step}`;
  const openSettings = useCallback(async () => {
    await settle();
    router.push(settingsHref);
  }, [settle, router, settingsHref]);

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
      onOpen: (props) => trackTableEvent(PostHogEvents.tableOpened, { ...common("kies", answers), ...props }),
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
    [answers, common, copy, locale, save, storageKey, openSettings],
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
    if (stepKind(step) === "question") return <QuizQuestion step={step} />;
    switch (step) {
      case "welkom":
        return <WelcomeScreen />;
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
            notified={notified}
            handlers={chooseHandlers}
            membership={membership}
            booked={booked}
            onAnswers={updateAnswers}
            tablePath={(slug) => jouwTafelTablePath(locale, slug)}
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
  // Ladies only on the table list: the whole page takes a soft rose glow.
  const ladiesGlow = step === "kies" && answers.gender === "female" && answers.tableType === "girls_only";

  return (
    <div
      className={`min-h-[100svh] text-wine transition-[background] duration-500 ${ladiesGlow ? "" : "bg-cream"}`}
      style={
        ladiesGlow
          ? {
              background:
                "radial-gradient(120% 55% at 50% 0%, rgba(214,150,166,0.38), transparent 60%), radial-gradient(90% 50% at 100% 100%, rgba(214,150,166,0.22), transparent 70%), #f8eeee",
            }
          : undefined
      }
    >
      <QuizHeader
        ladies={ladiesGlow}
        copy={copy}
        step={step}
        chapterFill={chapterFill}
        progress={progress}
        canGoBack={previousStep(step, answers) !== null && step !== "zoeken"}
        onBack={goBack}
        avatar={
          <AvatarButton
            name={answers.name ?? accountFirstName}
            label={copy.settings}
            href={settingsHref}
            onOpen={() => void openSettings()}
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
