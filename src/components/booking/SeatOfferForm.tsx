"use client";

import Link from "next/link";
import { useState } from "react";

const COPY = {
  nl: {
    name: "Voornaam",
    birthDate: "Geboortedatum",
    email: "E-mailadres",
    reserve: (price: string) => `Reserveer voor ${price}`,
    reserveMember: "Reserveer je plek",
    booked: "Je plek staat. Je bevestiging komt in je mail. Tot zondag.",
    busy: "Bezig…",
    terms: ["Met je reservering ga je akkoord met de ", "algemene voorwaarden", "."],
    nameMissing: "Vul je voornaam in.",
    birthMissing: "Vul je geboortedatum in.",
    gone: "Deze plek is net vergeven. Je blijft op de wachtlijst staan.",
    failed: "Reserveren lukte niet. Probeer het opnieuw.",
  },
  en: {
    name: "First name",
    birthDate: "Date of birth",
    email: "Email address",
    reserve: (price: string) => `Reserve for ${price}`,
    reserveMember: "Reserve your seat",
    booked: "Your seat is booked. The confirmation is on its way to your inbox. See you Sunday.",
    busy: "One moment…",
    terms: ["By reserving you agree to the ", "terms", "."],
    nameMissing: "Fill in your first name.",
    birthMissing: "Fill in your date of birth.",
    gone: "This seat has just been taken. You stay on the waitlist.",
    failed: "Reserving didn't work. Please try again.",
  },
} as const;

/** The form on "Er is een plek vrij": one seat, for the person the mail went to. On to Stripe. */
export function SeatOfferForm({
  locale,
  token,
  eventId,
  email,
  firstName,
  birthDate,
  price,
  termsHref,
}: {
  locale: "nl" | "en";
  token: string;
  eventId: string;
  email: string;
  firstName: string;
  birthDate: string | null;
  /** Null for a member: the seat is in the membership. */
  price: string | null;
  termsHref: string;
}) {
  const t = COPY[locale];
  const [name, setName] = useState(firstName);
  const [born, setBorn] = useState(birthDate ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);

  async function reserve() {
    if (busy) return;
    if (!name.trim()) return setError(t.nameMissing);
    if (!born) return setError(t.birthMissing);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, email, name: name.trim(), locale, seats: 1, birthDate: born, seatOffer: token }),
      });
      const data = (await res.json().catch(() => null)) as { url?: string; booked?: boolean; code?: string; error?: string } | null;
      if (res.ok && data?.url) {
        window.location.assign(data.url);
        return;
      }
      // A member: booked at once, nothing to pay.
      if (res.ok && data?.booked) {
        setBooked(true);
        return;
      }
      setError(data?.code === "offer_gone" ? t.gone : (data?.error ?? t.failed));
    } catch {
      setError(t.failed);
    }
    setBusy(false);
  }

  if (booked) {
    return (
      <p className="mt-6 rounded-2xl bg-white px-4 py-4 text-center text-[1rem] font-medium leading-snug text-wine ring-1 ring-burgundy/30">
        {t.booked}
      </p>
    );
  }

  const field =
    "mt-1.5 w-full rounded-xl border border-wine/15 bg-white px-3.5 py-3 text-[1rem] text-wine shadow-sm focus:border-burgundy/40 focus:outline-none focus:ring-2 focus:ring-burgundy/10";
  return (
    <form
      className="mt-6 space-y-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void reserve();
      }}
    >
      <label className="block text-sm font-medium text-wine/70">
        {t.name}
        <input className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
      </label>
      <label className="block text-sm font-medium text-wine/70">
        {t.birthDate}
        <input className={field} type="date" value={born} onChange={(e) => setBorn(e.target.value)} autoComplete="bday" />
      </label>
      <p className="text-sm text-wine/60">
        {t.email}: <span className="font-medium text-wine">{email}</span>
      </p>
      <button
        type="submit"
        disabled={busy}
        className="block w-full rounded-full bg-burgundy px-5 py-3.5 text-center text-sm font-semibold uppercase tracking-[0.08em] text-cream transition hover:bg-wine disabled:opacity-60"
      >
        {busy ? t.busy : price ? t.reserve(price) : t.reserveMember}
      </button>
      {error ? <p className="text-sm text-red-800">{error}</p> : null}
      <p className="text-center text-xs text-wine/50">
        {t.terms[0]}
        <Link href={termsHref} className="underline underline-offset-2">
          {t.terms[1]}
        </Link>
        {t.terms[2]}
      </p>
    </form>
  );
}
