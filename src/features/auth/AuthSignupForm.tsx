"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { signInWithApple, signInWithGoogle } from "@/features/auth/oauth";
import { privacyPath, termsPath, type Locale } from "@/i18n/config";
import type { AccountAuthLabels } from "@/i18n/account.types";

const RESEND_COOLDOWN_SECONDS = 30;
const OTP_LENGTH = 8;

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c3.4-3.133 3.684-7.749 1.04-11.616z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
      />
    </svg>
  );
}

export interface AuthSignupFormProps {
  locale: Locale;
  labels: AccountAuthLabels;
  /** Where OAuth should return after auth */
  nextPath: string;
  onAuthenticated: () => void;
  /** Optional heading override (join funnel uses signupEnd.title) */
  title?: string;
  subtitle?: string;
  className?: string;
}

export function AuthSignupForm({
  locale,
  labels,
  nextPath,
  onAuthenticated,
  title,
  subtitle,
  className = "",
}: AuthSignupFormProps) {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(
    Array(OTP_LENGTH).fill(""),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCountdown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCountdown]);

  const disabled = submitting;

  const sendOtp = useCallback(async () => {
    setError(null);
    setSubmitting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      });
      if (otpError) throw otpError;
      setOtpSent(true);
      setResendCountdown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      if (!aliveRef.current) return;
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "";
      const waitMatch = message.match(/after (\d+) seconds/i);
      if (waitMatch) {
        const seconds = Number(waitMatch[1]);
        setResendCountdown(seconds);
        setError(
          labels.errors.otpRateLimit.replace("{seconds}", String(seconds)),
        );
        return;
      }
      setError(
        process.env.NODE_ENV === "development" && message
          ? `${labels.errors.otpSend} (${message})`
          : labels.errors.otpSend,
      );
    } finally {
      if (aliveRef.current) setSubmitting(false);
    }
  }, [email, labels.errors.otpRateLimit, labels.errors.otpSend]);

  const verifyOtp = useCallback(
    async (token: string) => {
      setError(null);
      setSubmitting(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const { error: verifyError } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: token.trim(),
          type: "email",
        });
        if (verifyError) throw verifyError;
        window.requestAnimationFrame(() => {
          if (aliveRef.current) onAuthenticated();
        });
      } catch {
        if (!aliveRef.current) return;
        setError(labels.errors.otpVerify);
        setOtpDigits(Array(OTP_LENGTH).fill(""));
        otpRefs.current[0]?.focus();
      } finally {
        if (aliveRef.current) setSubmitting(false);
      }
    },
    [email, labels.errors.otpVerify, onAuthenticated],
  );

  const handleGoogle = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle(nextPath);
    } catch {
      if (!aliveRef.current) return;
      setError(labels.errors.google);
      setSubmitting(false);
    }
  };

  const handleApple = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithApple(nextPath);
    } catch {
      if (!aliveRef.current) return;
      setError(labels.errors.apple);
      setSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
    if (next.every((d) => d !== "") && !disabled) {
      void verifyOtp(next.join(""));
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setOtpDigits(next);
    otpRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
    if (pasted.length === OTP_LENGTH && !disabled) {
      void verifyOtp(pasted);
    }
  };

  const oauthBtn =
    "flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl border border-wine/12 bg-white px-4 py-3 text-sm font-medium text-wine transition hover:bg-beige disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className={className}>
      {(title || subtitle) && (
        <div className="mb-6 text-center">
          {title ? (
            <h1 className="font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
              {title}
            </h1>
          ) : null}
          {subtitle ? (
            <p className="mt-2 text-sm leading-relaxed text-wine/60 sm:text-base">
              {subtitle}
            </p>
          ) : null}
        </div>
      )}

      {!otpSent ? (
        <>
          <div className="space-y-2.5">
            <button
              type="button"
              className={oauthBtn}
              disabled={disabled}
              onClick={() => void handleGoogle()}
            >
              <GoogleLogo />
              {labels.oauth.google}
            </button>
            <button
              type="button"
              className={`${oauthBtn} !border-wine !bg-wine !text-cream hover:!bg-burgundy`}
              disabled={disabled}
              onClick={() => void handleApple()}
            >
              <AppleLogo />
              {labels.oauth.apple}
            </button>
          </div>

          <div className="my-5 flex items-center gap-3">
            <hr className="flex-1 border-wine/10" />
            <span className="text-xs uppercase tracking-[0.14em] text-wine/40">
              {labels.orEmail}
            </span>
            <hr className="flex-1 border-wine/10" />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendOtp();
            }}
          >
            <label
              htmlFor="signup-email"
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-burgundy"
            >
              {labels.email.label}
            </label>
            <input
              id="signup-email"
              type="email"
              required
              autoComplete="email"
              placeholder={labels.email.placeholder}
              className="w-full rounded-2xl border border-wine/12 bg-white px-4 py-3 text-sm text-wine outline-none transition placeholder:text-wine/35 focus:border-burgundy/40 focus:ring-2 focus:ring-burgundy/15 disabled:opacity-50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={disabled}
            />
            {error ? (
              <p className="mt-2 text-xs text-red-700">{error}</p>
            ) : null}
            <button
              type="submit"
              className="mt-3 flex w-full items-center justify-center rounded-full bg-wine py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-cream transition hover:bg-burgundy disabled:opacity-50"
              disabled={disabled}
            >
              {submitting ? labels.email.sending : labels.email.cta}
            </button>
          </form>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-wine/45">
            {labels.legalBeforeTerms}{" "}
            <Link
              href={termsPath(locale)}
              className="text-burgundy underline-offset-2 hover:underline"
            >
              {labels.legalTerms}
            </Link>{" "}
            {labels.legalAnd}{" "}
            <Link
              href={privacyPath(locale)}
              className="text-burgundy underline-offset-2 hover:underline"
            >
              {labels.legalPrivacy}
            </Link>
            .
          </p>
        </>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-burgundy text-xs text-cream">
              ✓
            </div>
            <h3 className="font-serif text-xl font-medium text-wine">
              {labels.otp.sentTitle}
            </h3>
            <p className="mt-1 text-sm text-wine/60">
              {labels.otp.hint.replace("{email}", email)}
            </p>
          </div>

          <div
            className="flex justify-center gap-1.5 sm:gap-2"
            role="group"
            aria-label={labels.otp.label}
            onPaste={handleOtpPaste}
          >
            {otpDigits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  otpRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={1}
                value={digit}
                disabled={disabled}
                className="h-11 w-9 rounded-xl border border-wine/12 bg-white text-center font-serif text-base text-wine outline-none focus:border-burgundy focus:ring-2 focus:ring-burgundy/20 disabled:opacity-50 sm:h-12 sm:w-10 sm:text-lg"
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
              />
            ))}
          </div>
          {error ? (
            <p className="text-center text-xs text-red-700">{error}</p>
          ) : null}
          <div className="text-center text-sm text-wine/55">
            <p>{labels.otp.noCode}</p>
            {resendCountdown > 0 ? (
              <p className="mt-1">
                {labels.otp.resendCountdown.replace(
                  "{seconds}",
                  String(resendCountdown),
                )}
              </p>
            ) : (
              <button
                type="button"
                className="mt-1 font-medium text-burgundy underline-offset-2 hover:underline"
                disabled={disabled}
                onClick={() => void sendOtp()}
              >
                {labels.otp.resend}
              </button>
            )}
            <button
              type="button"
              className="mt-3 block w-full text-wine/45 underline-offset-2 hover:underline"
              onClick={() => {
                setOtpSent(false);
                setOtpDigits(Array(OTP_LENGTH).fill(""));
                setError(null);
              }}
            >
              {labels.otp.back}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
