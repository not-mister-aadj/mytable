"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
import { getLandingCopy } from "@/lib/jouw-tafel/copy";
import {
  AUTH_EMAIL_STORAGE_KEY,
  normalizeAuthEmail,
  validateAuthEmail,
  type EmailFieldError,
} from "@/lib/jouw-tafel/auth-logic";
import { trackEmailStartEvent } from "@/lib/posthog/analytics";
import { PostHogEvents } from "@/lib/posthog/events";

const primaryButton =
  "cta-lift cta-lift-burgundy inline-flex min-h-[3.25rem] w-full items-center justify-center rounded-full bg-burgundy px-8 text-xs font-semibold uppercase tracking-[0.16em] text-cream shadow-[0_14px_34px_rgba(90,15,27,0.28)] transition hover:bg-wine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-wait disabled:opacity-70";
const textLink =
  "font-semibold text-burgundy underline decoration-burgundy/30 underline-offset-4 transition hover:decoration-burgundy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/60 rounded-sm";
const inputBase =
  "mt-1.5 w-full rounded-2xl border px-4 py-3.5 text-base text-wine outline-none transition focus:ring-2";
const inputOk = "border-wine/12 bg-white focus:border-burgundy/40 focus:ring-burgundy/15";
const inputBad =
  "border-red-600 bg-red-50 ring-2 ring-red-600/25 focus:border-red-600 focus:ring-red-600/30";

/**
 * "Wat is je e-mail?": the first step after "Aanmelden". Only the address,
 * no code (that comes when they reserve), then straight into the quiz. An
 * address with an account already goes to log in, prefilled.
 */
export function JouwTafelEmailStart({
  locale,
  quizPath,
  logInPath,
  termsHref,
  privacyHref,
  proofText,
}: {
  locale: Locale;
  quizPath: string;
  logInPath: string;
  termsHref: string;
  privacyHref: string;
  proofText: string | null;
}) {
  const router = useRouter();
  const copy = getLandingCopy(locale).auth;
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<EmailFieldError | null>(null);
  const [failed, setFailed] = useState(false);
  const [sending, setSending] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackEmailStartEvent(PostHogEvents.emailStartViewed, { locale });
  }, [locale]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (sending) return;
    const problem = validateAuthEmail(email);
    if (problem) {
      setFieldError(problem);
      setAttempt((n) => n + 1);
      inputRef.current?.focus();
      return;
    }
    const target = normalizeAuthEmail(email);
    setSending(true);
    setFailed(false);
    try {
      const response = await fetch("/api/jouw-tafel/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: target, locale }),
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; account?: boolean; error?: string };
      if (data.account) {
        trackEmailStartEvent(PostHogEvents.emailStartSubmitted, { locale, outcome: "account" });
        try {
          sessionStorage.setItem(AUTH_EMAIL_STORAGE_KEY, target);
        } catch {
          /* private mode: they type it once more */
        }
        router.push(logInPath);
        return;
      }
      if (data.error === "invalid_email") {
        setFieldError("invalid");
        setAttempt((n) => n + 1);
        setSending(false);
        return;
      }
      if (!response.ok || !data.ok) throw new Error(data.error ?? "failed");
      trackEmailStartEvent(PostHogEvents.emailStartSubmitted, { locale, outcome: "guest" });
      router.push(quizPath);
    } catch {
      setFailed(true);
      setAttempt((n) => n + 1);
      setSending(false);
    }
  }

  const fieldMessage =
    fieldError === "empty" ? copy.errors.emailEmpty : fieldError === "invalid" ? copy.errors.emailInvalid : null;

  return (
    <div>
      <h1 className="font-serif text-[2rem] font-medium leading-[1.1] tracking-tight text-wine text-balance">
        {copy.emailStart.title}
      </h1>
      <p className="mt-3 text-[1.02rem] leading-relaxed text-wine/70">{copy.emailStart.sub}</p>

      <form method="post" className="mt-7" noValidate onSubmit={onSubmit}>
        <label htmlFor="jt-start-email" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-burgundy">
          {copy.emailLabel}
        </label>
        <input
          ref={inputRef}
          id="jt-start-email"
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
            if (failed) setFailed(false);
          }}
          placeholder={copy.emailPlaceholder}
          disabled={sending}
          aria-invalid={fieldMessage ? true : undefined}
          aria-describedby={fieldMessage ? "jt-start-email-error" : undefined}
          className={`${inputBase} ${fieldMessage ? inputBad : inputOk}`}
        />
        {fieldMessage ? (
          <p
            key={attempt}
            id="jt-start-email-error"
            role="alert"
            className="animate-field-error-bounce mt-2 text-sm font-semibold text-red-600"
          >
            {fieldMessage}
          </p>
        ) : null}
        <button type="submit" className={`${primaryButton} mt-5`} disabled={sending}>
          {sending ? copy.emailStart.sending : copy.emailStart.button}
        </button>
        {failed ? (
          <p key={attempt} role="alert" className="animate-field-error-bounce mt-2 text-sm font-semibold text-red-600">
            {copy.errors.generic}
          </p>
        ) : null}
      </form>

      {proofText ? (
        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs font-medium text-wine/65">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gold" />
          {proofText}
        </p>
      ) : null}

      <p className="mt-3 text-center text-xs leading-relaxed text-wine/55">
        {copy.legal.before}
        <Link href={termsHref} className="underline underline-offset-2 hover:text-wine">
          {copy.legal.terms}
        </Link>
        {copy.legal.between}
        <Link href={privacyHref} className="underline underline-offset-2 hover:text-wine">
          {copy.legal.privacy}
        </Link>
        {copy.legal.after}
      </p>

      <p className="mt-7 border-t border-wine/8 pt-6 text-sm text-wine/70">
        {copy.signUp.switchPrompt}{" "}
        <Link href={logInPath} className={textLink}>
          {copy.signUp.switchLink}
        </Link>
      </p>
    </div>
  );
}
