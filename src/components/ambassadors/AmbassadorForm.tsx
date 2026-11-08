"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { AMBASSADOR_CITIES, AMBASSADOR_ROLES, ambassadorCopy } from "@/lib/ambassadors/copy";
import type { Locale } from "@/i18n/config";

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

/** The application form on /ambassadors: posts multipart to /api/ambassadors. */
export function AmbassadorForm({ locale }: { locale: Locale }) {
  const t = ambassadorCopy(locale).form;
  const roles = ambassadorCopy(locale).roles;
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const file = data.get("motivationFile");
    const hasFile = file instanceof File && file.size > 0;
    if (!hasFile) data.delete("motivationFile");
    if (!hasFile && !String(data.get("motivationText") ?? "").trim()) {
      setError(t.errors.motivation);
      return;
    }
    setError(null);
    setState("sending");
    try {
      const res = await fetch("/api/ambassadors", { method: "POST", body: data });
      if (res.ok) {
        setState("done");
        return;
      }
      const body = (await res.json().catch(() => null)) as { error?: keyof typeof t.errors } | null;
      setError(t.errors[body?.error ?? "generic"] ?? t.errors.generic);
    } catch {
      setError(t.errors.generic);
    }
    setState("idle");
  }

  if (state === "done") {
    return (
      <div className="mt-6 rounded-xl bg-white px-5 py-6" role="status">
        <div className="font-serif text-xl text-wine">{t.doneTitle}</div>
        <p className="mt-2 leading-relaxed text-wine/70">{t.doneBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-5" noValidate={false}>
      <input type="hidden" name="locale" value={locale} />
      {/* Honeypot, hidden from people. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t.name}>
          <input name="name" required autoComplete="name" className={input} />
        </Field>
        <Field label={t.email}>
          <input name="email" type="email" required autoComplete="email" className={input} />
        </Field>
        <Field label={t.phone} optional={t.optional}>
          <input name="phone" type="tel" autoComplete="tel" className={input} />
        </Field>
        <Field label={t.city}>
          <select name="city" required defaultValue="" className={input}>
            <option value="" disabled>
              {t.cityPlaceholder}
            </option>
            {AMBASSADOR_CITIES.map((c) => (
              <option key={c} value={c}>
                {locale === "en" && c === "Den Haag" ? "The Hague" : c}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t.study} optional={t.optional}>
          <input name="study" className={input} />
        </Field>
        <Field label={t.institution} optional={t.optional}>
          <input name="institution" className={input} />
        </Field>
        <Field label={t.studyYear} optional={t.optional}>
          <input name="studyYear" className={input} />
        </Field>
        <Field label={t.instagram} optional={t.optional}>
          <input name="instagram" placeholder="@" className={input} />
        </Field>
      </div>

      <Field label={t.linkedin} optional={t.optional}>
        <input name="linkedin" type="url" placeholder="https://www.linkedin.com/in/" className={input} />
      </Field>

      <fieldset>
        <legend className="text-[0.9rem] font-medium text-wine">
          {t.roles} <span className="font-normal text-wine/45">({t.optional})</span>
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {AMBASSADOR_ROLES.map((id) => (
            <label
              key={id}
              className="flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-wine/15 bg-white px-4 text-[0.92rem] text-wine has-[:checked]:border-burgundy has-[:checked]:bg-burgundy/5"
            >
              <input type="checkbox" name="roles" value={id} className="accent-burgundy" />
              {roles[id].title}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="rounded-xl bg-white px-4 py-4">
        <legend className="px-1 text-[0.9rem] font-medium text-wine">{t.motivation}</legend>
        <p className="text-[0.85rem] text-wine/55">{t.motivationHelp}</p>
        <label className="mt-3 block">
          <span className="text-[0.88rem] text-wine/80">{t.motivationFile}</span>
          <input
            name="motivationFile"
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="mt-1.5 block w-full text-[0.9rem] text-wine file:mr-3 file:rounded-full file:border-0 file:bg-burgundy/10 file:px-4 file:py-2 file:font-semibold file:text-burgundy"
          />
          <span className="mt-1 block text-[0.8rem] text-wine/45">{t.motivationFileHelp}</span>
        </label>
        <label className="mt-4 block">
          <span className="text-[0.88rem] text-wine/80">{t.motivationText}</span>
          <textarea name="motivationText" rows={5} maxLength={5000} placeholder={t.motivationTextPlaceholder} className={input} />
        </label>
      </fieldset>

      <Field label={t.availability} optional={t.optional}>
        <input name="availability" placeholder={t.availabilityPlaceholder} className={input} />
      </Field>
      <Field label={t.heardFrom} optional={t.optional}>
        <input name="heardFrom" className={input} />
      </Field>

      <label className="flex items-start gap-3 text-[0.92rem] text-wine">
        <input type="checkbox" name="adult" required className="mt-1 accent-burgundy" />
        {t.adult}
      </label>

      {error ? (
        <p role="alert" className="rounded-lg bg-burgundy/5 px-4 py-3 text-[0.92rem] text-burgundy">
          {error}
        </p>
      ) : null}

      <div>
        <button
          type="submit"
          disabled={state === "sending"}
          className="cta-lift inline-flex min-h-11 items-center rounded-full bg-burgundy px-6 text-[0.95rem] font-semibold text-white transition hover:bg-burgundy/90 disabled:opacity-60"
        >
          {state === "sending" ? t.sending : t.submit}
        </button>
        <p className="mt-3 text-[0.8rem] text-wine/45">{t.privacy}</p>
      </div>
    </form>
  );
}
