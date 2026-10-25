"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cancelLateAction, savePlusOneAction, shareTableIntroAction } from "@/app/[locale]/aan-tafel/[token]/actions";
import { SundayTableIntroForm } from "@/components/booking/SundayTableIntroForm";
import type { Locale } from "@/i18n/config";
import type { IntroWine, SundayTableIntro } from "@/lib/sunday-table-intro";
import type { PlusOneAnswers } from "@/lib/table-page";

/** Not filled in yet: the intro form first, the table right after saving. */
export function TableIntroGate({
  locale,
  city,
  introToken,
  bookingCode,
  seats,
  lead,
}: {
  locale: Locale;
  city: string;
  introToken: string;
  bookingCode: string;
  seats: number;
  lead: string;
}) {
  const router = useRouter();
  return (
    <section>
      <p className="mb-3 px-1 text-sm text-wine/70">{lead}</p>
      <SundayTableIntroForm
        locale={locale}
        city={city}
        auth={{ token: introToken }}
        bookingCode={bookingCode}
        seats={seats}
        initial={null}
        onSaved={() => router.refresh()}
      />
    </section>
  );
}

/** Filled in but not shared: one button, then the table shows. */
export function TableShareGate({
  token,
  copy,
}: {
  token: string;
  copy: { lead: string; note: string; button: string; error: string };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState(false);
  return (
    <div className="mt-5 rounded-2xl border border-wine/10 bg-white/60 p-5 text-center">
      <p className="text-sm text-wine">{copy.lead}</p>
      <p className="mt-1 text-xs text-wine/55">{copy.note}</p>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await shareTableIntroAction(token);
            if (result.ok) router.refresh();
            else setError(true);
          })
        }
        className="mt-4 rounded-full bg-burgundy px-6 py-3 text-sm font-semibold text-cream transition hover:bg-burgundy/90 disabled:opacity-60"
      >
        {copy.button}
      </button>
      {error ? <p className="mt-3 text-sm text-red-800">{copy.error}</p> : null}
    </div>
  );
}

const link = "text-sm font-medium text-burgundy underline-offset-4 hover:underline";

/** "Pas je antwoorden aan": the intro form with what they gave, on the page. */
export function EditOwnIntro({
  locale,
  city,
  introToken,
  bookingCode,
  seats,
  intro,
  label,
  closeLabel,
}: {
  locale: Locale;
  city: string;
  introToken: string;
  bookingCode: string;
  seats: number;
  intro: SundayTableIntro;
  label: string;
  closeLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`mt-3 ${link}`}>
        {label}
      </button>
    );
  }
  return (
    <div className="relative -mx-4 mt-4 sm:-mx-6">
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label={closeLabel}
        className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl leading-none text-wine/60 shadow-sm ring-1 ring-wine/10 transition hover:text-burgundy"
      >
        ×
      </button>
      <SundayTableIntroForm
        locale={locale}
        city={city}
        auth={{ token: introToken }}
        bookingCode={bookingCode}
        seats={seats}
        initial={intro}
        onSaved={() => {
          setOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}

const field =
  "mt-1 w-full rounded-xl border border-wine/15 bg-white px-3.5 py-2.5 text-sm text-wine shadow-sm transition placeholder:text-wine/35 focus:border-burgundy/40 focus:outline-none focus:ring-2 focus:ring-burgundy/10";

/** A few words about the visitor's +1, only for this page. */
export function PlusOneEditor({
  token,
  answers,
  copy,
}: {
  token: string;
  answers: PlusOneAnswers;
  copy: {
    open: string;
    edit: string;
    note: string;
    askMeAbout: string;
    favoriteSpot: string;
    intoNow: string;
    wine: string;
    wines: Record<IntroWine, string>;
    save: string;
    cancel: string;
    error: string;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<PlusOneAnswers>(answers);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();
  const filled = Boolean(answers.askMeAbout || answers.favoriteSpot || answers.intoNow || answers.wine);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`mt-3 ${link}`}>
        {filled ? copy.edit : copy.open}
      </button>
    );
  }
  const text = (key: "askMeAbout" | "favoriteSpot" | "intoNow", label: string) => (
    <label className="block text-sm font-medium text-wine">
      {label}
      <input className={field} value={value[key] ?? ""} maxLength={140} onChange={(e) => setValue((v) => ({ ...v, [key]: e.target.value }))} />
    </label>
  );
  return (
    <div className="mt-4 space-y-3">
      <p className="text-xs text-wine/55">{copy.note}</p>
      {text("askMeAbout", copy.askMeAbout)}
      {text("favoriteSpot", copy.favoriteSpot)}
      {text("intoNow", copy.intoNow)}
      <div>
        <span className="block text-sm font-medium text-wine">{copy.wine}</span>
        <div className="mt-1.5 grid grid-cols-3 gap-2">
          {(["red", "white", "bubbles"] as const).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setValue((v) => ({ ...v, wine: v.wine === w ? undefined : w }))}
              className={`rounded-xl border px-2 py-2 text-sm font-medium transition ${
                value.wine === w ? "border-burgundy bg-burgundy text-cream" : "border-wine/15 bg-white text-wine hover:border-wine/30"
              }`}
            >
              {copy.wines[w]}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const result = await savePlusOneAction(token, value);
              if (result.ok) {
                setOpen(false);
                router.refresh();
              } else setError(true);
            })
          }
          className="rounded-full bg-burgundy px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-burgundy/90 disabled:opacity-60"
        >
          {copy.save}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-wine/60 hover:text-wine">
          {copy.cancel}
        </button>
      </div>
      {error ? <p className="text-sm text-red-800">{copy.error}</p> : null}
    </div>
  );
}

/** "Kun je toch niet?": a small link; the explanation and the choice in a pop-up. */
export function CancelLate({
  token,
  copy,
}: {
  token: string;
  copy: { open: string; title: string; body: string; confirm: string; keep: string; error: string };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();
  return (
    <>
      <p className="px-1">
        <button type="button" onClick={() => setOpen(true)} className="text-xs text-wine/50 underline underline-offset-4 hover:text-burgundy">
          {copy.open}
        </button>
      </p>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={copy.title}
          className="fixed inset-0 z-50 flex items-end justify-center bg-wine/40 p-4 sm:items-center"
          onClick={() => !pending && setOpen(false)}
        >
          <div className="w-full max-w-md rounded-3xl bg-cream px-6 py-6 shadow-xl sm:px-8" onClick={(e) => e.stopPropagation()}>
            <p className="font-serif text-2xl text-wine">{copy.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-wine/70">{copy.body}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const result = await cancelLateAction(token);
                    if (result.ok) router.refresh();
                    else setError(true);
                  })
                }
                className="rounded-full bg-burgundy px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-burgundy/90 disabled:opacity-60"
              >
                {copy.confirm}
              </button>
              <button type="button" disabled={pending} onClick={() => setOpen(false)} className="text-sm text-wine/60 hover:text-wine">
                {copy.keep}
              </button>
            </div>
            {error ? <p className="mt-3 text-sm text-red-800">{copy.error}</p> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
