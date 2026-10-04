"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeftIcon } from "@/components/jouw-tafel/icons";
import { JouwTafelLogoutButton } from "@/components/jouw-tafel/JouwTafelLogoutButton";
import { BottomSheet } from "@/components/jouw-tafel/quiz/BottomSheet";
import { QuizQuestion, QuizScreenContext, SHEET_TITLE_ID } from "@/components/jouw-tafel/quiz/quiz-screens";
import { primaryButton, secondaryButton } from "@/components/jouw-tafel/quiz/quiz-ui";
import { saveMemberLocalePreference } from "@/features/auth/save-onboarding";
import {
  jouwTafelPath,
  jouwTafelStartPath,
  privacyPath,
  switchLocalePath,
  termsPath,
  type Locale,
} from "@/i18n/config";
import { companyLegal } from "@/lib/company-legal";
import { displayCity, supportedCity } from "@/lib/jouw-tafel/logic";
import { getQuizCopy, type QuizCopy } from "@/lib/jouw-tafel/quiz-copy";
import {
  SETTINGS_GROUPS,
  answerCities,
  sanitizeQuizState,
  settingsRowVisible,
  type QuizAnswers,
  type QuizState,
  type QuizStepId,
} from "@/lib/jouw-tafel/quiz-logic";
import { getSettingsCopy, type SettingsCopy } from "@/lib/jouw-tafel/settings-copy";
import { trackLanguageChanged, trackMembershipEvent, trackSettingsEvent } from "@/lib/posthog/analytics";
import { getMembershipSettingsCopy } from "@/lib/membership/page-copy";
import { planName } from "@/lib/membership/mail-copy";
import { formatPlanEuros, lowestMonthlyCents, type MembershipPlanId } from "@/lib/membership/plans";
import { jouwTafelMembershipPath } from "@/i18n/config";
import { PostHogEvents } from "@/lib/posthog/events";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type SettingsBooking = {
  id: string;
  code: string;
  city: string;
  startsAt: string;
  seats: number;
  name: { nl: string; en: string } | null;
  isMemberSeat: boolean;
  withPaidGuest: boolean;
  cancellable: boolean;
};

/** The membership group at the top (null: not a member, "Word lid"). */
export type SettingsMembership = {
  plan: MembershipPlanId;
  summary:
    | { kind: "renews"; date: string; cents: number }
    | { kind: "ends"; date: string }
    | { kind: "past_due" }
    | { kind: "none" };
  blockedUntil: string | null;
} | null;

const AMSTERDAM = "Europe/Amsterdam";
const SAVE_URL = "/api/auth/member/quiz";

type Sheet =
  | { kind: "question"; step: QuizStepId }
  | { kind: "booking"; booking: SettingsBooking }
  | { kind: "delete" };

// ---------------------------------------------------------------- formatting

function longDate(iso: string, locale: Locale, capital = true): string {
  const text = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", {
    timeZone: AMSTERDAM,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
  return capital ? text.charAt(0).toLocaleUpperCase() + text.slice(1) : text;
}

function shortDate(iso: string, locale: Locale): string {
  const text = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", {
    timeZone: AMSTERDAM,
    weekday: "short",
    day: "numeric",
    month: "short",
  })
    .format(new Date(iso))
    .replace(/\./g, "");
  return text.charAt(0).toLocaleUpperCase() + text.slice(1);
}

function clockTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", {
    timeZone: AMSTERDAM,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** "4 februari 2027" / "4 February 2027" (membership dates). */
function fullDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", {
    timeZone: AMSTERDAM,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function birthDateText(iso: string | undefined, locale: Locale): string | null {
  if (!iso) return null;
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${iso}T12:00:00Z`));
}

/** The value shown on a row: the answer in the quiz's own words. */
function rowValue(step: QuizStepId, a: QuizAnswers, q: QuizCopy, locale: Locale): string | null {
  switch (step) {
    case "stad": {
      const cities = answerCities(a).map((c) => displayCity(supportedCity(c) ?? c, locale));
      return cities.length ? q.joinCities(cities) : null;
    }
    case "leeftijd":
      return a.ageMatters ? q.leeftijd.options[a.ageMatters] : null;
    case "gender":
      return a.gender ? q.gender.options[a.gender] : null;
    case "tafeltype":
      return a.tableType ? q.tafeltype.options[a.tableType] : null;
    case "taal":
      return a.language ? q.taal.options[a.language] : null;
    case "gezelschap":
      return a.companion ? q.gezelschap.options[a.companion] : null;
    case "wie":
      return a.companionWho ? q.wie.options[a.companionWho] : null;
    case "zoekt":
      return a.why?.length ? a.why.map((w) => q.zoekt.options[w]).join(", ") : null;
    case "wijn":
      return a.wine ? q.wijn.options[a.wine] : null;
    case "gesprek":
      return a.conversation ? q.gesprek.options[a.conversation] : null;
    case "dieet": {
      if (!a.dietary) return null;
      const list = a.dietary.filter((d) => d !== "none");
      if (list.length === 0) return q.dieet.options.none;
      return list.map((d) => (d === "other" && a.dietaryOther ? a.dietaryOther : q.dieet.options[d])).join(", ");
    }
    case "formats":
      return a.formats?.length ? a.formats.map((f) => q.formats.options[f].title).join(", ") : null;
    case "naam":
      return a.name ?? null;
    default:
      return null;
  }
}

/** Puts our email address on the clipboard. Falls back to a hidden textarea
 * for in-app browsers without the async clipboard API. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------- pieces

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-wine/30" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-wine/35" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden>
      <rect x="5.5" y="10.5" width="13" height="9.5" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </svg>
  );
}

function Group({ title, children, note }: { title: string; children: ReactNode; note?: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-burgundy/80">{title}</h2>
      <div className="mt-2.5 overflow-hidden rounded-2xl border border-wine/[0.07] bg-white shadow-[0_1px_2px_rgba(43,13,18,0.04),0_6px_18px_rgba(43,13,18,0.04)]">
        <ul className="divide-y divide-wine/[0.07]">{children}</ul>
      </div>
      {note ? <p className="mt-2 px-1 text-[0.82rem] leading-snug text-wine/55">{note}</p> : null}
    </section>
  );
}

const rowBase =
  "flex min-h-[3.4rem] w-full items-center gap-3 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-burgundy/40";

function RowContent({ label, value, trailing }: { label: string; value?: string | null; trailing?: ReactNode }) {
  return (
    <>
      <span className="min-w-0 shrink-0 text-[0.98rem] font-medium text-wine">{label}</span>
      <span className="ml-auto min-w-0 truncate text-right text-[0.92rem] text-wine/50">{value}</span>
      {trailing ?? <ChevronIcon />}
    </>
  );
}

function ButtonRow({ label, value, onClick }: { label: string; value?: string | null; onClick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onClick} className={`${rowBase} active:bg-cream/70`}>
        <RowContent label={label} value={value} />
      </button>
    </li>
  );
}

function LinkRow({ label, href, external, value }: { label: string; href: string; external?: boolean; value?: string | null }) {
  const content = <RowContent label={label} value={value} />;
  return (
    <li>
      {external ? (
        <a href={href} className={`${rowBase} active:bg-cream/70`}>
          {content}
        </a>
      ) : (
        <Link href={href} className={`${rowBase} active:bg-cream/70`}>
          {content}
        </Link>
      )}
    </li>
  );
}

function Switch({ on, label, onChange, busy }: { on: boolean; label: string; onChange: (on: boolean) => void; busy: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={busy}
      onClick={() => onChange(!on)}
      className={`relative h-[1.9rem] w-[3.2rem] shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/50 focus-visible:ring-offset-2 disabled:opacity-60 ${
        on ? "bg-burgundy" : "bg-wine/15"
      }`}
    >
      <span
        aria-hidden
        className={`absolute top-[0.2rem] h-[1.5rem] w-[1.5rem] rounded-full bg-white shadow-[0_2px_6px_rgba(43,13,18,0.25)] transition-[left] duration-200 ${
          on ? "left-[1.5rem]" : "left-[0.2rem]"
        }`}
      />
    </button>
  );
}

// ---------------------------------------------------------------- page

export function JouwTafelSettings({
  locale,
  userId,
  email,
  accountFirstName,
  initialState,
  bookings,
  mailsOn: initialMailsOn,
  backHref,
  terug,
  membership = null,
  bookedNotice = false,
}: {
  locale: Locale;
  userId: string;
  email: string;
  accountFirstName: string;
  initialState: QuizState;
  bookings: { upcoming: SettingsBooking[]; past: SettingsBooking[] };
  mailsOn: boolean;
  backHref: string;
  terug: QuizStepId | null;
  membership?: SettingsMembership;
  /** Back from paying for a guest seat: "Je plek staat vast". */
  bookedNotice?: boolean;
}) {
  const s = getSettingsCopy(locale);
  const ms = getMembershipSettingsCopy(locale);
  const q = getQuizCopy(locale);
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [quiz, setQuiz] = useState<QuizState>(initialState);
  const quizRef = useRef(quiz);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [toast, setToast] = useState<string | null>(bookedNotice ? ms.bookedToast : null);

  async function copyEmail() {
    const ok = await copyText(companyLegal.email);
    setToast(ok ? s.emailCopied : s.emailCopyFailed(companyLegal.email));
  }
  const [mailsOn, setMailsOn] = useState(initialMailsOn);
  const [mailsBusy, setMailsBusy] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const primaryActionRef = useRef<(() => void) | null>(null);
  const answers = quiz.answers;
  const name = answers.name ?? accountFirstName;
  const storageKey = `mytable_jt_quiz_${userId}`;

  useEffect(() => {
    trackSettingsEvent(PostHogEvents.settingsOpened, { locale, from_step: terug ?? "none" });
  }, [locale, terug]);

  const [portalBusy, setPortalBusy] = useState(false);
  async function openPortal() {
    if (portalBusy) return;
    setPortalBusy(true);
    trackMembershipEvent(PostHogEvents.membershipCancelClicked, { locale });
    try {
      const res = await fetch("/api/membership/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const data = (await res.json().catch(() => null)) as { url?: string } | null;
      if (!res.ok || !data?.url) throw new Error(String(res.status));
      window.location.assign(data.url);
    } catch {
      setToast(ms.portalFailed);
      setPortalBusy(false);
    }
  }

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  async function cancelSeat(booking: SettingsBooking) {
    if (cancelling) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/membership/cancel-seat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setSheet(null);
      setConfirmCancel(false);
      setToast(ms.cancelSeatDone);
      router.refresh();
    } catch {
      setToast(ms.cancelSeatFailed);
    } finally {
      setCancelling(false);
    }
  }

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  /** Same save as the quiz (user metadata and waitlist rows); "settings"
   * also removes the waitlist rows of cities taken out, and never sends a
   * Meta Lead. */
  const save = useCallback(
    async (patch: Partial<QuizAnswers>, field: QuizStepId) => {
      const current = quizRef.current;
      const merged: QuizAnswers = { ...current.answers, ...patch };
      const next = sanitizeQuizState({ ...current, answers: merged, updatedAt: Date.now() });
      quizRef.current = next;
      setQuiz(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* the account copy is enough */
      }
      trackSettingsEvent(PostHogEvents.settingChanged, { field, locale });
      try {
        const res = await fetch(SAVE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: next, locale, waitlist: true, origin: "settings" }),
        });
        setToast(res.ok ? s.saved : s.saveFailed);
      } catch {
        setToast(s.saveFailed);
      }
    },
    [locale, s, storageKey],
  );

  const closeTimer = useRef<number | null>(null);
  useEffect(() => () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  }, []);

  const screenContext = useMemo(() => {
    const step = sheet?.kind === "question" ? sheet.step : "naam";
    return {
      locale,
      copy: q,
      step,
      answers,
      accountFirstName,
      geoCity: null,
      cityCounts: {},
      subsetCounts: {},
      testimonials: [],
      reduceMotion: Boolean(reduceMotion),
      variant: "sheet" as const,
      submitLabel: s.save,
      primaryActionRef,
      continueFrom: () => {},
      answerAndNext: (patch: Partial<QuizAnswers>, options?: { delay?: number }) => {
        void save(patch, step);
        // Choosing "met iemand" asks who next, like the quiz.
        const followUp: QuizStepId | null =
          step === "gezelschap" && patch.companion === "with" && !answers.companionWho
            ? "wie"
            : step === "gender" && patch.gender === "female" && !answers.tableType
              ? "tafeltype"
              : null;
        const close = () => setSheet(followUp ? { kind: "question", step: followUp } : null);
        if (options?.delay) closeTimer.current = window.setTimeout(close, reduceMotion ? 0 : options.delay);
        else close();
      },
    };
  }, [sheet, locale, q, answers, accountFirstName, reduceMotion, s.save, save, setSheet]);

  async function toggleMails(on: boolean) {
    setMailsOn(on);
    setMailsBusy(true);
    trackSettingsEvent(PostHogEvents.notificationsToggled, { on, locale });
    try {
      const res = await fetch("/api/auth/member/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ on, locale }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setToast(s.saved);
    } catch {
      setMailsOn(!on);
      setToast(s.saveFailed);
    } finally {
      setMailsBusy(false);
    }
  }

  async function deleteAccount() {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(false);
    try {
      const res = await fetch("/api/auth/member/delete", { method: "POST" });
      if (!res.ok) throw new Error(String(res.status));
      trackSettingsEvent(PostHogEvents.accountDeleted, { locale });
      try {
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith("mytable_jt_quiz_")) localStorage.removeItem(key);
        }
      } catch {
        /* nothing stored */
      }
      await createSupabaseBrowserClient()
        .auth.signOut({ scope: "local" })
        .catch(() => undefined);
      router.replace(`${jouwTafelPath(locale)}?verwijderd=1`);
      router.refresh();
    } catch {
      setDeleteError(true);
      setDeleting(false);
    }
  }

  const otherLocale: Locale = locale === "nl" ? "en" : "nl";
  const langHref = `${switchLocalePath(pathname, locale)}${terug ? `?terug=${terug}` : ""}`;
  const openQuestion = (step: QuizStepId) => setSheet({ kind: "question", step });
  const firstUpcoming = bookings.upcoming[0];

  function bookingRow(b: SettingsBooking) {
    return (
      <li key={b.id}>
        <button
          type="button"
          onClick={() => {
            trackSettingsEvent(PostHogEvents.bookingOpened, { upcoming: new Date(b.startsAt).getTime() > Date.now() });
            setConfirmCancel(false);
            setSheet({ kind: "booking", booking: b });
          }}
          className={`${rowBase} active:bg-cream/70`}
        >
          <span aria-hidden className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-[#f5ebe6] text-burgundy">
            <span className="text-[0.55rem] font-bold uppercase leading-none tracking-[0.12em] opacity-80">
              {new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", { timeZone: AMSTERDAM, month: "short" })
                .format(new Date(b.startsAt))
                .replace(".", "")}
            </span>
            <span className="mt-0.5 text-[1.05rem] font-bold leading-none tabular-nums">
              {new Intl.DateTimeFormat("nl-NL", { timeZone: AMSTERDAM, day: "numeric" }).format(new Date(b.startsAt))}
            </span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.98rem] font-semibold leading-tight text-wine">
              {b.name ? b.name[locale] : s.reservations.tableName}
            </span>
            <span className="mt-1 block truncate text-[0.85rem] leading-tight text-wine/55">
              {shortDate(b.startsAt, locale)} · {clockTime(b.startsAt, locale)} · {displayCity(b.city, locale)}
            </span>
            <span className="mt-1 block truncate text-[0.8rem] leading-tight text-wine/45">
              {s.reservations.seats(b.seats)} · {b.code}
              {b.isMemberSeat ? <span className="text-gold"> · {ms.memberSeatShort}</span> : null}
            </span>
          </span>
          <ChevronIcon />
        </button>
      </li>
    );
  }

  const groupRows = (steps: readonly QuizStepId[]) =>
    steps
      .filter((step) => settingsRowVisible(step, answers))
      .map((step) => (
        <ButtonRow
          key={step}
          label={s.rows[step as keyof SettingsCopy["rows"]]}
          value={rowValue(step, answers, q, locale) ?? s.notSet}
          onClick={() => openQuestion(step)}
        />
      ));

  return (
    <div className="min-h-[100svh] bg-cream text-wine">
      <header className="sticky top-0 z-30 bg-cream/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-cream/80">
        <div className="mx-auto grid h-14 w-full max-w-md grid-cols-[3rem_1fr_3rem] items-center px-2">
          <Link
            href={backHref}
            aria-label={s.back}
            className="flex h-11 w-11 items-center justify-center rounded-full text-wine transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/50 active:scale-95 active:bg-wine/5"
          >
            <ArrowLeftIcon className="h-[1.35rem] w-[1.35rem]" />
          </Link>
          <p className="text-center text-[0.9rem] font-semibold text-wine">{s.title}</p>
          <span />
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-5 pb-16 pt-4">
        <div className="text-center">
          <span
            aria-hidden
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-burgundy/[0.1] font-serif text-[1.8rem] text-burgundy ring-1 ring-burgundy/15"
          >
            {name.trim().charAt(0).toLocaleUpperCase() || "·"}
          </span>
          <h1 className="mt-4 font-serif text-[2rem] font-medium leading-tight text-wine">{name || email}</h1>
          <p className="mt-1 truncate text-[0.92rem] text-wine/55">{email}</p>
        </div>

        <Group title={ms.group} note={membership ? ms.note : undefined}>
          {membership ? (
            <>
              <LinkRow
                label={ms.plan}
                value={planName(membership.plan, locale)}
                href={jouwTafelMembershipPath(locale)}
              />
              <li className={`${rowBase} cursor-default`}>
                <span
                  className={`text-[0.92rem] leading-snug ${membership.summary.kind === "past_due" ? "font-semibold text-red-700" : "text-wine/70"}`}
                >
                  {membership.summary.kind === "renews"
                    ? ms.renews(fullDate(membership.summary.date, locale), `€${formatPlanEuros(membership.summary.cents, locale)}`)
                    : membership.summary.kind === "ends"
                      ? ms.ends(fullDate(membership.summary.date, locale))
                      : membership.summary.kind === "past_due"
                        ? ms.pastDue
                        : null}
                  {membership.blockedUntil ? (
                    <span className="mt-1 block text-wine/70">{ms.blocked(fullDate(membership.blockedUntil, locale))}</span>
                  ) : null}
                </span>
              </li>
              <ButtonRow label={portalBusy ? ms.portalBusy : ms.portal} onClick={() => void openPortal()} />
            </>
          ) : (
            <LinkRow
              label={ms.join}
              value={ms.joinValue(`€${formatPlanEuros(lowestMonthlyCents(), locale)}`)}
              href={jouwTafelMembershipPath(locale)}
            />
          )}
        </Group>

        <Group title={s.reservations.title}>
          {bookings.upcoming.length ? (
            bookings.upcoming.map(bookingRow)
          ) : (
            <li className="px-4 py-5 text-center">
              <p className="text-[0.95rem] text-wine/65">{s.reservations.none}</p>
              <Link href={`${jouwTafelStartPath(locale)}?stap=kies`} className={`${primaryButton} mt-4 !min-h-12`}>
                {s.reservations.choose}
              </Link>
            </li>
          )}
          {bookings.past.length ? (
            <li>
              <button
                type="button"
                aria-expanded={showPast}
                onClick={() => setShowPast((v) => !v)}
                className={`${rowBase} active:bg-cream/70`}
              >
                <span className="text-[0.92rem] font-medium text-wine/65">{s.reservations.earlier(bookings.past.length)}</span>
                <span className={`ml-auto transition-transform duration-200 ${showPast ? "rotate-90" : ""}`}>
                  <ChevronIcon />
                </span>
              </button>
              {showPast ? <ul className="divide-y divide-wine/[0.07] border-t border-wine/[0.07] bg-cream/30">{bookings.past.map(bookingRow)}</ul> : null}
            </li>
          ) : null}
        </Group>

        <Group title={s.groups.tafel}>{groupRows(SETTINGS_GROUPS.tafel)}</Group>
        <Group title={s.groups.zondag}>{groupRows(SETTINGS_GROUPS.zondag)}</Group>

        <Group title={s.groups.notifications} note={s.notifications.note}>
          <li className={`${rowBase} cursor-default`}>
            <span id="jt-settings-mails" className="min-w-0 flex-1 text-[0.98rem] font-medium leading-snug text-wine">
              {s.notifications.label}
            </span>
            <Switch on={mailsOn} busy={mailsBusy} label={s.notifications.label} onChange={(on) => void toggleMails(on)} />
          </li>
        </Group>

        <Group
          title={s.groups.account}
          note={
            <>
              {s.account.lockedNote}{" "}
              <button
                type="button"
                onClick={() => void copyEmail()}
                aria-label={s.account.lockedLink}
                className="font-semibold text-burgundy underline decoration-burgundy/30 underline-offset-2"
              >
                {companyLegal.email}
              </button>
            </>
          }
        >
          <ButtonRow label={s.account.name} value={name || s.notSet} onClick={() => openQuestion("naam")} />
          <li className={`${rowBase} cursor-default`} aria-label={`${s.account.email}: ${email}. ${s.account.locked}`}>
            <RowContent label={s.account.email} value={email} trailing={<LockIcon />} />
          </li>
          <li className={`${rowBase} cursor-default`}>
            <RowContent
              label={s.account.birthDate}
              value={birthDateText(answers.birthDate, locale) ?? s.notSet}
              trailing={<LockIcon />}
            />
          </li>
          <li className={`${rowBase} cursor-default`}>
            <RowContent
              label={s.account.gender}
              value={rowValue("gender", answers, q, locale) ?? s.notSet}
              trailing={<LockIcon />}
            />
          </li>
          <li className={`${rowBase} cursor-default`}>
            <span className="text-[0.98rem] font-medium text-wine">{s.account.siteLanguage}</span>
            <div role="radiogroup" aria-label={s.account.siteLanguage} className="ml-auto flex rounded-full bg-cream p-1">
              {(["nl", "en"] as const).map((l) => {
                const active = l === locale;
                return active ? (
                  <span
                    key={l}
                    role="radio"
                    aria-checked
                    className="min-h-9 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-burgundy shadow-[0_2px_8px_rgba(43,13,18,0.12)]"
                  >
                    {l}
                  </span>
                ) : (
                  <a
                    key={l}
                    role="radio"
                    aria-checked={false}
                    href={langHref}
                    hrefLang={l}
                    onClick={(event) => {
                      event.preventDefault();
                      trackLanguageChanged({ from_language: locale, to_language: otherLocale, page_path: pathname });
                      void saveMemberLocalePreference(otherLocale);
                      router.push(langHref);
                    }}
                    className="min-h-9 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-wine/55"
                  >
                    {l}
                  </a>
                );
              })}
            </div>
          </li>
        </Group>

        <Group title={s.groups.binnenkort}>{groupRows(SETTINGS_GROUPS.binnenkort)}</Group>

        <Group title={s.groups.help}>
          <LinkRow label={s.help.faq} href={`${jouwTafelPath(locale)}#faq`} />
          <ButtonRow label={s.help.contact} value={companyLegal.email} onClick={() => void copyEmail()} />
          <LinkRow label={s.help.terms} href={termsPath(locale)} />
          <LinkRow label={s.help.privacy} href={privacyPath(locale)} />
        </Group>

        <div className="mt-10">
          <JouwTafelLogoutButton
            label={s.logOut}
            busyLabel={s.loggingOut}
            redirectTo={jouwTafelPath(locale)}
            locale={locale}
            className={secondaryButton}
          />
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={() => {
                setDeleteError(false);
                setSheet({ kind: "delete" });
              }}
              className="min-h-11 rounded-full px-4 text-[0.92rem] font-semibold text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/40"
            >
              {s.deleteAccount}
            </button>
          </div>
        </div>
      </main>

      {sheet?.kind === "question" ? (
        <BottomSheet key={sheet.step} labelledBy={SHEET_TITLE_ID} closeLabel={s.close} onClose={() => setSheet(null)} tone="cream">
          <QuizScreenContext.Provider value={screenContext}>
            <div className="pb-2">
              <QuizQuestion step={sheet.step} />
            </div>
          </QuizScreenContext.Provider>
        </BottomSheet>
      ) : null}

      {sheet?.kind === "booking" ? (
        <BottomSheet
          labelledBy="jt-settings-booking"
          title={sheet.booking.name ? sheet.booking.name[locale] : s.reservations.detailTitle} closeLabel={s.close} onClose={() => setSheet(null)}>
          <dl className="mt-4 divide-y divide-wine/[0.07] rounded-2xl bg-cream/60 px-4">
            {[
              [s.reservations.date, longDate(sheet.booking.startsAt, locale)],
              [s.reservations.time, clockTime(sheet.booking.startsAt, locale)],
              [s.reservations.city, displayCity(sheet.booking.city, locale)],
              [s.reservations.seatsLabel, s.reservations.seats(sheet.booking.seats)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 py-3">
                <dt className="text-[0.9rem] text-wine/55">{label}</dt>
                <dd className="text-right text-[0.95rem] font-semibold text-wine">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-burgundy/80">{s.reservations.code}</p>
            <p className="mx-auto mt-2 w-fit rounded-full bg-[#f5ebe6] px-6 py-2.5 text-[0.95rem] font-bold tracking-[0.06em] text-burgundy">
              {sheet.booking.code}
            </p>
          </div>
          {sheet.booking.isMemberSeat ? (
            <p className="mt-4 flex items-center justify-center gap-1.5 text-[0.9rem] font-semibold text-burgundy">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gold" />
              {ms.memberSeat}
            </p>
          ) : null}
          <p className="mt-5 text-[0.92rem] leading-relaxed text-wine/70">{s.reservations.whereNote}</p>
          {sheet.booking.isMemberSeat ? (
            sheet.booking.cancellable ? (
              confirmCancel ? (
                <div className="mt-5 rounded-2xl bg-cream/70 p-4">
                  <p className="font-serif text-[1.25rem] text-wine">{ms.cancelSeatTitle}</p>
                  <p className="mt-1 text-[0.9rem] leading-relaxed text-wine/70">{ms.cancelSeatRule}</p>
                  {sheet.booking.withPaidGuest ? (
                    <p className="mt-2 text-[0.9rem] font-semibold leading-relaxed text-wine">{ms.cancelSeatGuestNote}</p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void cancelSeat(sheet.booking)}
                    disabled={cancelling}
                    className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-red-700 px-6 text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-white transition active:scale-[0.98] disabled:opacity-60"
                  >
                    {cancelling ? ms.cancelSeatBusy : ms.cancelSeatConfirm(sheet.booking.withPaidGuest)}
                  </button>
                  <button type="button" onClick={() => setConfirmCancel(false)} className={`${secondaryButton} mt-2 !min-h-12`}>
                    {ms.cancelSeatKeep}
                  </button>
                </div>
              ) : (
                <>
                  <p className="mt-2 text-[0.92rem] leading-relaxed text-wine/70">{ms.cancelSeatRule}</p>
                  <button type="button" onClick={() => setConfirmCancel(true)} className={`${secondaryButton} mt-5`}>
                    {ms.cancelSeat}
                  </button>
                </>
              )
            ) : (
              <p className="mt-2 text-[0.92rem] leading-relaxed text-wine/70">{ms.cancelSeatTooLate}</p>
            )
          ) : (
            <>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-wine/70">{s.reservations.change}</p>
              <button type="button" onClick={() => void copyEmail()} className={`${secondaryButton} mt-5`}>
                {s.reservations.changeLink}
              </button>
            </>
          )}
        </BottomSheet>
      ) : null}

      {sheet?.kind === "delete" ? (
        <BottomSheet labelledBy="jt-settings-delete" title={s.delete.title} closeLabel={s.close} onClose={() => setSheet(null)}>
          <div className="mt-3 space-y-3 text-[0.95rem] leading-relaxed text-wine/75">
            <p>{s.delete.body}</p>
            {firstUpcoming ? <p>{s.delete.booking(longDate(firstUpcoming.startsAt, locale, locale === "en"))}</p> : null}
            {membership ? <p>{ms.deleteMember}</p> : null}
            <p className="text-wine/55">{s.delete.legal}</p>
          </div>
          {deleteError ? (
            <p role="alert" className="mt-4 text-[0.9rem] font-semibold text-red-700">
              {s.delete.failed}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => void deleteAccount()}
            disabled={deleting}
            className="mt-6 inline-flex min-h-14 w-full items-center justify-center rounded-full bg-red-700 px-8 text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_14px_34px_rgba(185,28,28,0.25)] transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {deleting ? s.delete.busy : s.delete.confirm}
          </button>
          <button type="button" onClick={() => setSheet(null)} className={`${secondaryButton} mt-3`}>
            {s.delete.cancel}
          </button>
        </BottomSheet>
      ) : null}

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
