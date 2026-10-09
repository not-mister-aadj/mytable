"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
import { signInWithGoogle } from "@/features/auth/oauth";
import { syncMemberCustomerClient } from "@/features/auth/sync-customer-client";
import { trackMetaCompleteRegistration } from "@/lib/analytics/metaTracking";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getBrowserMemberAuthCallbackUrl } from "@/lib/member-url";
import { trackJouwTafelAuthEvent } from "@/lib/posthog/analytics";
import { PostHogEvents } from "@/lib/posthog/events";
import { getLandingCopy } from "@/lib/jouw-tafel/copy";
import {
  AUTH_CODE_LENGTH,
  AUTH_EMAIL_STORAGE_KEY,
  CODE_STEP_PARAM,
  CODE_STEP_VALUE,
  RESEND_COOLDOWN_SECONDS,
  classifySendCodeError,
  classifyVerifyCodeError,
  isNewAuthUser,
  normalizeAuthEmail,
  sanitizeAuthCode,
  validateAuthEmail,
  type EmailFieldError,
} from "@/lib/jouw-tafel/auth-logic";

export type AuthScreen = "signup" | "login";

type FormError = "unknown_email" | "rate_limited" | "generic" | "google" | null;
type CodeError = "wrong" | "incomplete" | "rate_limited" | "generic" | null;

const primaryButton =
  "cta-lift cta-lift-burgundy inline-flex min-h-[3.25rem] w-full items-center justify-center rounded-full bg-burgundy px-8 text-xs font-semibold uppercase tracking-[0.16em] text-cream shadow-[0_14px_34px_rgba(90,15,27,0.28)] transition hover:bg-wine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-wait disabled:opacity-70";
const textLink =
  "font-semibold text-burgundy underline decoration-burgundy/30 underline-offset-4 transition hover:decoration-burgundy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/60 rounded-sm";
const inputBase =
  "mt-1.5 w-full rounded-2xl border px-4 py-3.5 text-base text-wine outline-none transition focus:ring-2";
const inputOk = "border-wine/12 bg-white focus:border-burgundy/40 focus:ring-burgundy/15";
const inputBad =
  "border-red-600 bg-red-50 ring-2 ring-red-600/25 focus:border-red-600 focus:ring-red-600/30";

function readStoredEmail(): string {
  try {
    return sessionStorage.getItem(AUTH_EMAIL_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function storeEmail(email: string | null): void {
  try {
    if (email) sessionStorage.setItem(AUTH_EMAIL_STORAGE_KEY, email);
    else sessionStorage.removeItem(AUTH_EMAIL_STORAGE_KEY);
  } catch {
    /* private mode: prefill is a nicety */
  }
}

/** Current URL with the code-step marker added or removed (UTMs kept). */
function urlWithStep(onCodeStep: boolean): string {
  const url = new URL(window.location.href);
  if (onCodeStep) url.searchParams.set(CODE_STEP_PARAM, CODE_STEP_VALUE);
  else url.searchParams.delete(CODE_STEP_PARAM);
  url.searchParams.delete("fout");
  return `${url.pathname}${url.search}${url.hash}`;
}

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="mt-px shrink-0">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 5a1.25 1.25 0 0 1 1.25 1.25v4.5a1.25 1.25 0 0 1-2.5 0v-4.5A1.25 1.25 0 0 1 12 7Zm0 11a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden className="shrink-0">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5Z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7Z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44Z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5Z" />
    </svg>
  );
}

function InlineError({ id, message, attempt }: { id?: string; message: string; attempt: number }) {
  return (
    <p
      key={attempt}
      id={id}
      role="alert"
      className="animate-field-error-bounce mt-2 flex items-start gap-1.5 text-sm font-semibold text-red-600"
    >
      <ErrorIcon />
      <span>{message}</span>
    </p>
  );
}

/**
 * Email + 6-digit code, no password (works inside Instagram and Facebook,
 * where most ad visitors are), plus "Doorgaan met Google" in normal
 * browsers when enabled. Both steps live on one page; the code step adds
 * `?stap=code` to the URL so the back button returns to the email step.
 */
export function JouwTafelAuthForm({
  locale,
  screen,
  googleAllowed,
  inApp,
  googleError,
  welcomePath,
  switchPath,
  signUpPath,
  termsHref,
  privacyHref,
  proofText,
  startFresh,
  hadSession,
  confirm = false,
  initialEmail = "",
}: {
  locale: Locale;
  screen: AuthScreen;
  googleAllowed: boolean;
  inApp: boolean;
  googleError: boolean;
  welcomePath: string;
  switchPath: string;
  signUpPath: string;
  termsHref: string;
  privacyHref: string;
  /** "Al 300+ mensen hebben zich aangemeld", live and rounded up to hundreds; null when small. */
  proofText: string | null;
  /** Sign-up: always a clean start (no session, no saved quiz answers). */
  startFresh: boolean;
  /** A session existed when the page was rendered; it is ended on load. */
  hadSession: boolean;
  /** "Bevestig je e-mail": the account step before reserving or becoming a
   * member (also signs in an existing account). */
  confirm?: boolean;
  /** The address they gave before (the email screen), prefilled. */
  initialEmail?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Imported here rather than passed in: the copy holds functions, which
  // can't cross from a server component.
  const copy = getLandingCopy(locale).auth;
  const screenCopy = confirm
    ? { ...copy.signUp, ...copy.confirm }
    : screen === "signup"
      ? copy.signUp
      : copy.logIn;

  const [email, setEmail] = useState(initialEmail);
  /** The address the code went to; null until a code was sent. */
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<EmailFieldError | null>(null);
  const [formError, setFormError] = useState<FormError>(googleError ? "google" : null);
  const [errorAttempt, setErrorAttempt] = useState(0);
  const [sending, setSending] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<CodeError>(null);
  const [verifying, setVerifying] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [resent, setResent] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const pushedCodeStep = useRef(false);
  const lastTriedCode = useRef<string | null>(null);
  const trackedStep = useRef<string | null>(null);
  const trackedInApp = useRef(false);

  const onCodeStepInUrl = searchParams.get(CODE_STEP_PARAM) === CODE_STEP_VALUE;
  const step: "email" | "code" = onCodeStepInUrl && sentTo ? "code" : "email";

  // Sign-up is always a fresh start: end any session in this browser and
  // forget locally saved quiz answers, so a new account starts empty.
  useEffect(() => {
    if (!startFresh) return;
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith("mytable_jt_quiz_")) localStorage.removeItem(key);
      }
    } catch {
      /* storage unavailable: nothing to clear */
    }
    if (hadSession) void createSupabaseBrowserClient().auth.signOut({ scope: "local" });
  }, [startFresh, hadSession]);

  // Prefill from the other screen ("Maak een account") or restore the code
  // step after a reload. The address lives in sessionStorage, never the URL.
  useEffect(() => {
    // sessionStorage only exists in the browser, so this runs after
    // hydration (one frame later) rather than in the initial state.
    const frame = requestAnimationFrame(() => {
      const stored = readStoredEmail();
      if (stored) setEmail((current) => current || stored);
      // One-time hand-over: once prefilled it is forgotten, so a later visit
      // to sign-up starts empty again.
      if (stored && !onCodeStepInUrl) storeEmail(null);
      if (onCodeStepInUrl) {
        if (stored && validateAuthEmail(stored) === null) {
          setSentTo(stored);
        } else {
          window.history.replaceState(null, "", urlWithStep(false));
        }
      }
    });
    return () => cancelAnimationFrame(frame);
    // Mount only: later URL changes come from our own history entries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (trackedStep.current === step) return;
    trackedStep.current = step;
    trackJouwTafelAuthEvent(PostHogEvents.authScreenViewed, { screen, step, locale });
    if (step === "code") {
      requestAnimationFrame(() => codeRef.current?.focus());
    }
  }, [step, screen, locale]);

  useEffect(() => {
    if (!inApp || trackedInApp.current) return;
    trackedInApp.current = true;
    trackJouwTafelAuthEvent(PostHogEvents.authGoogleHiddenInApp, {
      screen,
      locale,
      google_enabled: process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true",
    });
  }, [inApp, screen, locale]);

  // Countdown for "Stuur opnieuw".
  useEffect(() => {
    if (step !== "code" || resendAt <= Date.now()) return;
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= resendAt) window.clearInterval(id);
    }, 1000);
    return () => window.clearInterval(id);
  }, [step, resendAt]);

  const secondsLeft = Math.max(0, Math.ceil((resendAt - now) / 1000));

  const sendCode = useCallback(
    async (target: string): Promise<"ok" | "unknown_email" | "rate_limited" | "invalid_email" | "other"> => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: target,
        options: {
          // Log in never creates an account; sign up with an existing
          // address simply signs that person in.
          shouldCreateUser: screen === "signup",
          // Only used if a template still carries the magic link.
          emailRedirectTo: `${getBrowserMemberAuthCallbackUrl()}?next=${encodeURIComponent(welcomePath)}`,
          data: screen === "signup" ? { signup_source: "jouw_tafel", signup_locale: locale } : undefined,
        },
      });
      if (!error) return "ok";
      return classifySendCodeError({
        code: (error as { code?: string }).code,
        status: error.status,
        message: error.message,
      });
    },
    [screen, welcomePath, locale],
  );

  async function onSubmitEmail(event: FormEvent) {
    event.preventDefault();
    if (sending) return;
    const problem = validateAuthEmail(email);
    if (problem) {
      setFieldError(problem);
      setFormError(null);
      setErrorAttempt((n) => n + 1);
      emailRef.current?.focus();
      return;
    }
    const target = normalizeAuthEmail(email);
    setSending(true);
    setFieldError(null);
    setFormError(null);
    const result = await sendCode(target);
    setSending(false);
    if (result !== "ok") {
      trackJouwTafelAuthEvent(PostHogEvents.authCodeFailed, { screen, reason: `send_${result}`, locale });
      if (result === "invalid_email") setFieldError("invalid");
      else setFormError(result === "other" ? "generic" : result);
      setErrorAttempt((n) => n + 1);
      if (result === "unknown_email") storeEmail(target);
      return;
    }
    trackJouwTafelAuthEvent(PostHogEvents.authCodeRequested, { screen, resend: false, locale });
    storeEmail(target);
    setSentTo(target);
    setCode("");
    setCodeError(null);
    setResent(false);
    lastTriedCode.current = null;
    const until = Date.now() + RESEND_COOLDOWN_SECONDS * 1000;
    setResendAt(until);
    setNow(Date.now());
    window.history.pushState(null, "", urlWithStep(true));
    pushedCodeStep.current = true;
  }

  async function verify(token: string) {
    if (!sentTo || verifying) return;
    if (token.length !== AUTH_CODE_LENGTH) {
      setCodeError("incomplete");
      setErrorAttempt((n) => n + 1);
      return;
    }
    lastTriedCode.current = token;
    setVerifying(true);
    setCodeError(null);
    setResent(false);
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.verifyOtp({ email: sentTo, token, type: "email" });
    if (error || !data.user) {
      const reason = error
        ? classifyVerifyCodeError({
            code: (error as { code?: string }).code,
            status: error.status,
            message: error.message,
          })
        : "other";
      trackJouwTafelAuthEvent(PostHogEvents.authCodeFailed, { screen, reason, locale });
      setVerifying(false);
      setCodeError(reason === "wrong_or_expired" ? "wrong" : reason === "rate_limited" ? "rate_limited" : "generic");
      setErrorAttempt((n) => n + 1);
      requestAnimationFrame(() => codeRef.current?.select());
      return;
    }
    const isNew = isNewAuthUser(data.user.created_at);
    trackJouwTafelAuthEvent(PostHogEvents.authCodeVerified, { screen, is_new_user: isNew, locale });
    // Meta CompleteRegistration for new code accounts, like Google sign-ups
    // get in /auth/callback. Same event id per user, so it is never doubled.
    if (isNew) trackMetaCompleteRegistration(data.user);
    storeEmail(null);
    // Link the account to the CRM customer row (by email). Never blocks
    // the welcome page for more than a moment.
    await Promise.race([
      syncMemberCustomerClient(locale),
      new Promise((resolve) => window.setTimeout(resolve, 2500)),
    ]);
    router.replace(welcomePath);
  }

  function onCodeChange(value: string) {
    const next = sanitizeAuthCode(value);
    setCode(next);
    if (codeError) setCodeError(null);
    if (next.length === AUTH_CODE_LENGTH && next !== lastTriedCode.current) {
      void verify(next);
    }
  }

  async function onResend() {
    if (!sentTo || secondsLeft > 0 || sending) return;
    setSending(true);
    setCodeError(null);
    setResent(false);
    const result = await sendCode(sentTo);
    setSending(false);
    const t = Date.now();
    setNow(t);
    if (result !== "ok") {
      trackJouwTafelAuthEvent(PostHogEvents.authCodeFailed, { screen, reason: `resend_${result}`, locale });
      setCodeError(result === "rate_limited" ? "rate_limited" : "generic");
      setErrorAttempt((n) => n + 1);
      if (result === "rate_limited") setResendAt(t + RESEND_COOLDOWN_SECONDS * 1000);
      return;
    }
    trackJouwTafelAuthEvent(PostHogEvents.authCodeRequested, { screen, resend: true, locale });
    setResendAt(t + RESEND_COOLDOWN_SECONDS * 1000);
    setCode("");
    lastTriedCode.current = null;
    setResent(true);
    codeRef.current?.focus();
  }

  function onOtherEmail() {
    setCode("");
    setCodeError(null);
    setResent(false);
    if (pushedCodeStep.current) {
      window.history.back();
    } else {
      window.history.replaceState(null, "", urlWithStep(false));
    }
    requestAnimationFrame(() => emailRef.current?.focus());
  }

  async function onGoogle() {
    if (googleLoading) return;
    trackJouwTafelAuthEvent(PostHogEvents.authGoogleClicked, { screen, locale });
    setGoogleLoading(true);
    setFormError(null);
    try {
      await signInWithGoogle(welcomePath);
      // The browser now leaves for Google; keep the button busy.
    } catch {
      setGoogleLoading(false);
      setFormError("google");
      setErrorAttempt((n) => n + 1);
    }
  }

  function goToSignUpWithEmail() {
    storeEmail(normalizeAuthEmail(email));
  }

  if (step === "code" && sentTo) {
    const codeMessage =
      codeError === "wrong"
        ? copy.code.wrong
        : codeError === "incomplete"
          ? copy.code.incomplete
          : codeError === "rate_limited"
            ? copy.errors.rateLimited
            : codeError === "generic"
              ? copy.errors.generic
              : null;
    return (
      <div>
        <h1 className="font-serif text-[2rem] font-medium leading-[1.1] tracking-tight text-wine text-balance">
          {copy.code.title}
        </h1>
        <p className="mt-3 text-[1.02rem] leading-relaxed text-wine/70">
          {copy.code.body(sentTo)}
        </p>
        <form
          method="post"
          className="mt-7"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void verify(code);
          }}
        >
          <label htmlFor="jt-auth-code" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-burgundy">
            {copy.code.label}
          </label>
          <input
            ref={codeRef}
            id="jt-auth-code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={AUTH_CODE_LENGTH}
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            onPaste={(e) => {
              e.preventDefault();
              onCodeChange(e.clipboardData.getData("text"));
            }}
            disabled={verifying}
            aria-invalid={codeMessage ? true : undefined}
            aria-describedby={codeMessage ? "jt-auth-code-error" : undefined}
            className={`${inputBase} text-center font-semibold tracking-[0.5em] tabular-nums text-[1.6rem] ${codeMessage ? inputBad : inputOk}`}
          />
          {codeMessage ? <InlineError id="jt-auth-code-error" message={codeMessage} attempt={errorAttempt} /> : null}
          {resent && !codeMessage ? (
            <p role="status" className="mt-2 text-sm font-medium text-wine/70">
              {copy.code.resent}
            </p>
          ) : null}
          <button type="submit" className={`${primaryButton} mt-5`} disabled={verifying}>
            {verifying ? copy.code.verifying : copy.code.confirm}
          </button>
        </form>
        <p className="mt-7 text-sm leading-relaxed text-wine/65">{copy.code.noCode}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
          <button
            type="button"
            onClick={() => void onResend()}
            disabled={secondsLeft > 0 || sending}
            className={`${textLink} disabled:cursor-not-allowed disabled:text-wine/45 disabled:no-underline`}
          >
            {secondsLeft > 0 ? copy.code.resendIn(secondsLeft) : copy.code.resend}
          </button>
          <button type="button" onClick={onOtherEmail} className={textLink}>
            {copy.code.otherEmail}
          </button>
        </div>
      </div>
    );
  }

  const fieldMessage =
    fieldError === "empty" ? copy.errors.emailEmpty : fieldError === "invalid" ? copy.errors.emailInvalid : null;
  const formMessage =
    formError === "rate_limited"
      ? copy.errors.rateLimited
      : formError === "generic"
        ? copy.errors.generic
        : formError === "google"
          ? copy.googleFailed
          : null;

  return (
    <div>
      <h1 className="font-serif text-[2rem] font-medium leading-[1.1] tracking-tight text-wine text-balance">
        {screenCopy.title}
      </h1>
      {screenCopy.sub ? (
        <p className="mt-3 text-[1.02rem] leading-relaxed text-wine/70">{screenCopy.sub}</p>
      ) : null}

      {googleAllowed ? (
        <>
          <button
            type="button"
            onClick={() => void onGoogle()}
            disabled={googleLoading}
            className="mt-7 inline-flex min-h-[3.25rem] w-full items-center justify-center gap-3 rounded-full border border-wine/15 bg-white px-6 text-[0.95rem] font-semibold text-wine shadow-[0_6px_18px_rgba(43,13,18,0.06)] transition hover:border-wine/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/60 disabled:cursor-wait disabled:opacity-70"
          >
            <GoogleIcon />
            {copy.google}
          </button>
          <div className="mt-6 flex items-center gap-4" aria-hidden>
            <span className="h-px flex-1 bg-wine/10" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-wine/45">{copy.or}</span>
            <span className="h-px flex-1 bg-wine/10" />
          </div>
        </>
      ) : null}

      <form method="post" className={googleAllowed ? "mt-5" : "mt-7"} noValidate onSubmit={onSubmitEmail}>
        <label htmlFor="jt-auth-email" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-burgundy">
          {copy.emailLabel}
        </label>
        <input
          ref={emailRef}
          id="jt-auth-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldError) setFieldError(null);
            if (formError) setFormError(null);
          }}
          placeholder={copy.emailPlaceholder}
          disabled={sending}
          aria-invalid={fieldMessage || formError === "unknown_email" ? true : undefined}
          aria-describedby={fieldMessage || formError === "unknown_email" ? "jt-auth-email-error" : undefined}
          className={`${inputBase} ${fieldMessage || formError === "unknown_email" ? inputBad : inputOk}`}
        />
        {fieldMessage ? <InlineError id="jt-auth-email-error" message={fieldMessage} attempt={errorAttempt} /> : null}
        {formError === "unknown_email" ? (
          <p
            key={errorAttempt}
            id="jt-auth-email-error"
            role="alert"
            className="animate-field-error-bounce mt-2 flex items-start gap-1.5 text-sm font-semibold text-red-600"
          >
            <ErrorIcon />
            <span>
              {copy.errors.unknownEmail}{" "}
              <Link href={signUpPath} onClick={goToSignUpWithEmail} className={textLink}>
                {copy.errors.createAccount}
              </Link>
            </span>
          </p>
        ) : null}
        <button type="submit" className={`${primaryButton} mt-5`} disabled={sending}>
          {sending ? copy.sending : copy.sendCode}
        </button>
        {formMessage ? <InlineError message={formMessage} attempt={errorAttempt} /> : null}
      </form>

      {proofText ? (
        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs font-medium text-wine/65">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gold" />
          {proofText}
        </p>
      ) : null}

      {/* Groupvibe/Timeleft style: the legal line on both screens. */}
      <p className="mt-3 text-center text-xs leading-relaxed text-wine/55">
        {screen === "signup" ? copy.legal.before : copy.legal.beforeLogIn}
        <Link href={termsHref} className="underline underline-offset-2 hover:text-wine">
          {copy.legal.terms}
        </Link>
        {copy.legal.between}
        <Link href={privacyHref} className="underline underline-offset-2 hover:text-wine">
          {copy.legal.privacy}
        </Link>
        {copy.legal.after}
      </p>

      {confirm ? null : (
        <p className="mt-7 border-t border-wine/8 pt-6 text-sm text-wine/70">
          {screenCopy.switchPrompt}{" "}
          <Link href={switchPath} onClick={goToSignUpWithEmail} className={textLink}>
            {screenCopy.switchLink}
          </Link>
        </p>
      )}
    </div>
  );
}
