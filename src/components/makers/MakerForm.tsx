"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { privacyPath, type Locale } from "@/i18n/config";
import { MAKER_WORK_STYLES } from "@/lib/makers/shared";
import { makerCopy } from "@/lib/makers/copy";

const input =
  "mt-1.5 block w-full rounded-lg border border-wine/15 bg-white px-3.5 py-2.5 text-[0.98rem] text-wine placeholder:text-wine/35 focus:border-burgundy/50 focus:outline-none focus:ring-2 focus:ring-burgundy/15";

function Field({ label, optional, children }: { label: string; optional?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[0.9rem] font-medium text-wine">
        {label}
        {optional ? <span className="font-normal text-wine/45"> ({optional})</span> : null}
      </span>
      {children}
    </label>
  );
}

/** The application on /makers. Posts JSON to /api/makers. */
export function MakerForm({ locale }: { locale: Locale }) {
  const t = makerCopy(locale).form;
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    const data = new FormData(e.currentTarget);
    const get = (k: string) => {
      const v = data.get(k);
      return typeof v === "string" ? v : "";
    };
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/makers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: get("name"),
          email: get("email"),
          city: get("city"),
          instagram: get("instagram"),
          tiktok: get("tiktok"),
          portfolioUrl: get("portfolioUrl"),
          workStyle: get("workStyle"),
          note: get("note"),
          privacy: data.get("privacy") === "on",
          website: get("website"),
          locale,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: keyof typeof t.errors };
      if (!res.ok) {
        setError(t.errors[json.error ?? "generic"] ?? t.errors.generic);
        setSending(false);
        return;
      }
      setDone(true);
    } catch {
      setError(t.errors.generic);
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="mt-6 rounded-2xl border border-wine/10 bg-beige/50 px-6 py-8" role="status">
        <p className="font-serif text-2xl text-wine">{t.doneTitle}</p>
        <p className="mt-2 leading-relaxed text-wine/70">{t.doneBody}</p>
      </div>
    );
  }

  const [before, linkText, after] = t.privacy;
  return (
    <form onSubmit={submit} className="mt-6 space-y-5 rounded-2xl border border-wine/10 bg-white px-5 py-6 sm:px-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t.name}>
          <input name="name" required autoComplete="name" className={input} />
        </Field>
        <Field label={t.email}>
          <input name="email" type="email" required autoComplete="email" className={input} />
        </Field>
        <Field label={t.city}>
          <input name="city" required autoComplete="address-level2" className={input} />
        </Field>
        <Field label={t.portfolio} optional={t.optional}>
          <input name="portfolioUrl" placeholder="https://" className={input} />
        </Field>
        <Field label={t.instagram}>
          <input name="instagram" placeholder="@" className={input} />
        </Field>
        <Field label={t.tiktok}>
          <input name="tiktok" placeholder="@" className={input} />
        </Field>
      </div>
      <p className="-mt-2 text-[0.82rem] text-wine/50">{t.handleHelp}</p>

      <fieldset>
        <legend className="text-[0.9rem] font-medium text-wine">{t.workStyle}</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {MAKER_WORK_STYLES.map((id) => (
            <label
              key={id}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-wine/15 bg-white px-4 py-3 text-[0.95rem] text-wine transition has-[:checked]:border-burgundy has-[:checked]:bg-burgundy/5"
            >
              <input type="radio" name="workStyle" value={id} defaultChecked={id === "either"} className="accent-burgundy" />
              {t.styles[id]}
            </label>
          ))}
        </div>
      </fieldset>

      <Field label={t.note} optional={t.optional}>
        <textarea name="note" rows={3} maxLength={2000} className={input} />
      </Field>

      {/* Honeypot: hidden from people. */}
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <label className="flex items-start gap-3 text-[0.92rem] text-wine">
        <input type="checkbox" name="privacy" required className="mt-1 accent-burgundy" />
        <span>
          {before}
          <Link href={privacyPath(locale)} className="underline underline-offset-2">
            {linkText}
          </Link>
          {after}
        </span>
      </label>

      {error ? (
        <p role="alert" className="rounded-lg bg-burgundy/5 px-4 py-3 text-[0.92rem] text-burgundy">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={sending}
        className="cta-lift inline-flex min-h-12 items-center rounded-full bg-burgundy px-7 text-[0.98rem] font-semibold text-white transition hover:bg-burgundy/90 disabled:opacity-60"
      >
        {sending ? t.sending : t.submit}
      </button>
    </form>
  );
}
