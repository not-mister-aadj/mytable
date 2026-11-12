"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { AMBASSADOR_CITIES, AMBASSADOR_ROLES, ambassadorCopy } from "@/lib/ambassadors/copy";
import { ambassadorsPath, type Locale } from "@/i18n/config";
import { captureClientEvent, captureClientEventBeacon } from "@/lib/posthog/client";
import { PostHogEvents } from "@/lib/posthog/events";

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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-5 rounded-2xl border border-wine/10 bg-white px-5 py-6 sm:px-6">
      <legend className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-burgundy/80">{title}</legend>
      {children}
    </fieldset>
  );
}

/**
 * The application form (/ambassadors/aanmelden). Posts multipart to
 * /api/ambassadors. PostHog gets: viewed, started (first field), submitted,
 * failed (error key) and abandoned (left after starting, with the last field
 * touched). Never any of what they typed.
 */
export function AmbassadorForm({ locale }: { locale: Locale }) {
  const copy = ambassadorCopy(locale);
  const t = copy.form;
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const finished = useRef(false);
  const lastField = useRef<string | null>(null);

  useEffect(() => {
    captureClientEvent(PostHogEvents.ambassadorFormViewed, { locale });
    const leave = () => {
      if (started.current && !finished.current) {
        finished.current = true;
        captureClientEventBeacon(PostHogEvents.ambassadorFormAbandoned, { locale, last_field: lastField.current });
      }
    };
    window.addEventListener("pagehide", leave);
    return () => {
      window.removeEventListener("pagehide", leave);
      leave();
    };
  }, [locale]);

  function touched(e: { target: EventTarget | null }) {
    const name = (e.target as HTMLInputElement | null)?.name;
    if (!name || name === "website") return;
    lastField.current = name;
    if (!started.current) {
      started.current = true;
      captureClientEvent(PostHogEvents.ambassadorFormStarted, { locale, first_field: name });
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const file = data.get("motivationFile");
    const hasFile = file instanceof File && file.size > 0;
    if (!hasFile) data.delete("motivationFile");
    if (data.getAll("roles").length === 0) {
      setError(t.errors.roles);
      captureClientEvent(PostHogEvents.ambassadorFormFailed, { locale, error: "roles" });
      return;
    }
    if (!hasFile && !String(data.get("motivationText") ?? "").trim()) {
      setError(t.errors.motivation);
      captureClientEvent(PostHogEvents.ambassadorFormFailed, { locale, error: "motivation" });
      return;
    }
    setError(null);
    setState("sending");
    try {
      const res = await fetch("/api/ambassadors", { method: "POST", body: data });
      if (res.ok) {
        finished.current = true;
        captureClientEvent(PostHogEvents.ambassadorFormSubmitted, {
          locale,
          city: String(data.get("city") ?? ""),
          motivation: hasFile ? "file" : "text",
          roles: data.getAll("roles").join(","),
        });
        setState("done");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const body = (await res.json().catch(() => null)) as { error?: keyof typeof t.errors } | null;
      const key = body?.error && body.error in t.errors ? body.error : "generic";
      captureClientEvent(PostHogEvents.ambassadorFormFailed, { locale, error: key });
      setError(t.errors[key]);
    } catch {
      captureClientEvent(PostHogEvents.ambassadorFormFailed, { locale, error: "network" });
      setError(t.errors.generic);
    }
    setState("idle");
  }

  if (state === "done") {
    return (
      <div className="mt-8 rounded-2xl border border-wine/10 bg-beige/50 px-6 py-8" role="status">
        <div className="font-serif text-2xl text-wine">{t.doneTitle}</div>
        <p className="mt-2 leading-relaxed text-wine/70">{t.doneBody}</p>
        <Link href={ambassadorsPath(locale)} className="mt-5 inline-block font-semibold text-burgundy hover:underline">
          {t.doneBack}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} onFocus={touched} onChange={touched} className="mt-8 space-y-6">
      <input type="hidden" name="locale" value={locale} />
      {/* Honeypot, hidden from people. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <Section title={t.sectionYou}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t.name}>
            <input name="name" required autoComplete="name" className={input} />
          </Field>
          <Field label={t.email}>
            <input name="email" type="email" required autoComplete="email" className={input} />
          </Field>
          <Field label={t.phone}>
            <input name="phone" type="tel" required autoComplete="tel" placeholder="06 12345678" className={input} />
            <span className="mt-1 block text-[0.8rem] text-wine/45">{t.phoneHelp}</span>
          </Field>
          {AMBASSADOR_CITIES.length === 1 ? (
            <input type="hidden" name="city" value={AMBASSADOR_CITIES[0]} />
          ) : (
            <Field label={t.city}>
              <select name="city" required defaultValue="" className={input}>
                <option value="" disabled>
                  {t.cityPlaceholder}
                </option>
                {AMBASSADOR_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label={t.instagram} optional={t.optional}>
            <input name="instagram" placeholder="@" className={input} />
          </Field>
          <Field label={t.linkedin} optional={t.optional}>
            <input name="linkedin" type="url" placeholder="https://www.linkedin.com/in/" className={input} />
          </Field>
        </div>
      </Section>

      <Section title={t.sectionStudy}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t.study}>
            <input name="study" required className={input} />
          </Field>
          <Field label={t.institution}>
            <input name="institution" required className={input} />
          </Field>
          <Field label={t.studyYear}>
            <input name="studyYear" required className={input} />
          </Field>
        </div>
      </Section>

      <Section title={t.sectionWhy}>
        <fieldset>
          <legend className="text-[0.9rem] font-medium text-wine">{t.roles}</legend>
          <p className="mt-0.5 text-[0.85rem] text-wine/55">{t.rolesHelp}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {AMBASSADOR_ROLES.map((id) => (
              <label
                key={id}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-wine/15 bg-white px-4 py-3 text-wine transition has-[:checked]:border-burgundy has-[:checked]:bg-burgundy/5"
              >
                <input type="checkbox" name="roles" value={id} className="mt-1 accent-burgundy" />
                <span>
                  <span className="block font-semibold">{copy.roles[id].title}</span>
                  <span className="mt-0.5 block text-[0.85rem] leading-snug text-wine/60">{copy.roles[id].body}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <div className="text-[0.9rem] font-medium text-wine">{t.motivation}</div>
          <p className="mt-0.5 text-[0.85rem] text-wine/55">{t.motivationHelp}</p>
          <label className="mt-3 block">
            <span className="text-[0.88rem] text-wine/80">{t.motivationFile}</span>
            <input
              name="motivationFile"
              type="file"
              accept=".pdf,application/pdf"
              className="mt-1.5 block w-full text-[0.9rem] text-wine file:mr-3 file:rounded-full file:border-0 file:bg-burgundy/10 file:px-4 file:py-2 file:font-semibold file:text-burgundy"
            />
            <span className="mt-1 block text-[0.8rem] text-wine/45">{t.motivationFileHelp}</span>
          </label>
          <label className="mt-4 block">
            <span className="text-[0.88rem] text-wine/80">{t.motivationText}</span>
            <textarea name="motivationText" rows={5} maxLength={5000} placeholder={t.motivationTextPlaceholder} className={input} />
          </label>
        </div>
        <Field label={t.heardFrom} optional={t.optional}>
          <input name="heardFrom" className={input} />
        </Field>
      </Section>

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
          className="cta-lift inline-flex min-h-12 w-full items-center justify-center rounded-full bg-burgundy px-7 text-[0.98rem] font-semibold text-white transition hover:bg-burgundy/90 disabled:opacity-60 sm:w-auto"
        >
          {state === "sending" ? t.sending : t.submit}
        </button>
        <p className="mt-3 text-[0.8rem] text-wine/45">{t.privacy}</p>
      </div>
    </form>
  );
}
