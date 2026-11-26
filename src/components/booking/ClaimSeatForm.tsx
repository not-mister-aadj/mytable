"use client";

import { useState, useTransition } from "react";
import { claimSeatAction } from "@/app/[locale]/plek-overnemen/[token]/actions";

type Copy = {
  name: string;
  email: string;
  birthDate: string;
  promise: string;
  submit: string;
  doneTitle: string;
  doneBody: string;
  doneLink: string;
  errors: Record<"closed" | "taken" | "invalid" | "young" | "same" | "already" | "failed", string>;
};

const field = "mt-1 w-full rounded-xl border border-gold/40 bg-white px-3 py-2.5 text-sm text-wine outline-none focus:border-burgundy";

/** The form on /plek-overnemen: their details, "Ik kom", and the seat is theirs. */
export function ClaimSeatForm({
  token,
  locale,
  copy,
  prefill,
}: {
  token: string;
  locale: "nl" | "en";
  copy: Copy;
  prefill: { name: string; email: string; birthDate: string };
}) {
  const [name, setName] = useState(prefill.name);
  const [email, setEmail] = useState(prefill.email);
  const [birthDate, setBirthDate] = useState(prefill.birthDate);
  const [promise, setPromise] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (done) {
    return (
      <div className="text-center">
        <p className="font-serif text-2xl text-wine">{copy.doneTitle}</p>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-wine/65">{copy.doneBody}</p>
        <a href={done} className="mt-5 inline-flex rounded-full bg-burgundy px-5 py-2.5 text-sm font-semibold text-cream">
          {copy.doneLink}
        </a>
      </div>
    );
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setError(null);
          const result = await claimSeatAction(token, { name, email, birthDate, locale });
          if (result.ok) setDone(result.tableUrl);
          else setError(copy.errors[result.error as keyof Copy["errors"]] ?? copy.errors.failed);
        });
      }}
      className="space-y-3"
    >
      <label className="block text-xs font-semibold text-wine/70">
        {copy.name}
        <input id="claim-name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="given-name" className={field} />
      </label>
      <label className="block text-xs font-semibold text-wine/70">
        {copy.email}
        <input id="claim-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={field} />
      </label>
      <label className="block text-xs font-semibold text-wine/70">
        {copy.birthDate}
        <input id="claim-birth" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required className={field} />
      </label>
      <label className="flex items-start gap-3 rounded-xl border border-gold/30 bg-white px-3 py-3 text-sm text-wine">
        <input id="claim-promise" type="checkbox" checked={promise} onChange={(e) => setPromise(e.target.checked)} required className="mt-0.5" />
        <span>{copy.promise}</span>
      </label>
      <button type="submit" disabled={pending || !promise} className="w-full rounded-full bg-burgundy px-5 py-3 text-sm font-semibold text-cream disabled:opacity-60">
        {copy.submit}
      </button>
      {error ? <p className="text-sm text-red-800">{error}</p> : null}
    </form>
  );
}
