"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";

export function SundayTableNotifyMeForm({
  eventId,
  locale,
  title,
  body,
  emailLabel,
  submitLabel,
  successLabel,
  errorLabel,
}: {
  eventId: string;
  locale: Locale;
  title: string;
  body: string;
  emailLabel: string;
  submitLabel: string;
  successLabel: string;
  errorLabel: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "done" | "error"
  >("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || status === "submitting") return;
    setStatus("submitting");
    try {
      const response = await fetch(`/api/events/${eventId}/notify-me`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
      if (!response.ok) throw new Error("request failed");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-wine/10 bg-cream/70 px-5 py-6 text-center">
      <p className="font-serif text-lg font-medium text-wine">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-wine/65">{body}</p>

      {status === "done" ? (
        <p className="mt-4 text-sm font-medium text-wine">{successLabel}</p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={emailLabel}
            className="min-h-11 flex-1 rounded-full border border-wine/15 bg-white px-4 text-sm text-wine placeholder:text-wine/40 sm:max-w-xs"
          />
          <button
            type="submit"
            disabled={status === "submitting"}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-burgundy px-6 text-xs font-semibold uppercase tracking-[0.14em] text-cream transition hover:bg-wine disabled:opacity-50"
          >
            {submitLabel}
          </button>
        </form>
      )}

      {status === "error" ? (
        <p className="mt-3 text-xs text-red-700">{errorLabel}</p>
      ) : null}
    </div>
  );
}
