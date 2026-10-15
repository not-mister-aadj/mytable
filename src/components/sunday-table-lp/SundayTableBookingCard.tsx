"use client";

import { useEffect, useState } from "react";
import { jouwTafelKiesPath, jouwTafelLogInPath, jouwTafelSettingsPath, type Locale } from "@/i18n/config";
import { Button } from "@/components/ui/Button";
import {
  DEFAULT_TABLE_LANGUAGE_PREFERENCE,
  isEnglishOpenForSundayTable,
  type TableLanguagePreference,
} from "@/lib/booking-table-language";
import { getStoredUtm } from "@/lib/analytics/utm";
import { trackSundaySocialTicketChosen, trackSundayTableEnglishRequested } from "@/lib/posthog/analytics";
import { isAtLeastMinAge, latestLegalBirthDate } from "@/lib/member-onboarding";
import {
  MEMBERSHIP_AT_BOOKING,
  MEMBERSHIP_AT_BOOKING_PLAN,
  getMembershipPlan,
} from "@/lib/membership/plans";

/** Date of birth: only a check that the booker is 18 or older. */
const BIRTH_COPY = {
  nl: { label: "Geboortedatum", underAge: "Om te boeken moet je 18 jaar of ouder zijn." },
  en: { label: "Date of birth", underAge: "You need to be 18 or older to book." },
} as const;

/** "Aan tafel met": asked for every Sunday Social, so the tables can be
 * set by age. Required. */
const AGE_PREFERENCE_COPY = {
  nl: { label: "Aan tafel met", similar: "Mensen rond mijn leeftijd", any: "Maakt niet uit", missing: "Kies met wie je aan tafel wilt." },
  en: { label: "At the table with", similar: "People around my age", any: "Doesn't matter", missing: "Choose who you'd like at your table." },
} as const;
type AgePreference = "similar" | "any";

/** "Alleen deze zondag" or "Elke zondag": nothing is chosen at first. */
const PLAN_COPY = {
  nl: {
    label: "Kies je ticket",
    singleTitle: "Alleen deze zondag",
    singleBody: "Eenmalig. Je wijn bestel je zelf.",
    monthlyTitle: "Elke zondag",
    perMonth: "per maand",
    perMonthShort: "maand",
    monthlyBody: "Deze zondag, en daarna elke Sunday Social in alle steden. Die boek je zelf in je account. Maandelijks opzegbaar.",
    missing: "Kies of je alleen deze zondag of elke zondag wilt.",
    monthlyCta: "Word lid en reserveer",
    guestFree: "gast gratis",
    singleShort: "eenmalig",
    monthlyShort: "alle steden, maandelijks opzegbaar",
    next: "Verder",
    back: "Wijzig",
    monthlyNote: "Volgende zondagen boek je zelf in je account. Maandelijks opzegbaar.",
  },
  en: {
    label: "Choose your ticket",
    singleTitle: "Just this Sunday",
    singleBody: "One time. You order your own wine.",
    monthlyTitle: "Every Sunday",
    perMonth: "per month",
    perMonthShort: "month",
    monthlyBody: "This Sunday, then every Sunday Social in every city. You book those yourself in your account. Cancel monthly.",
    missing: "Choose just this Sunday or every Sunday.",
    monthlyCta: "Become a member and reserve",
    guestFree: "guest free",
    singleShort: "one time",
    monthlyShort: "every city, cancel monthly",
    next: "Continue",
    back: "Change",
    monthlyNote: "You book next Sundays yourself in your account. Cancel monthly.",
  },
} as const;
type TicketPlan = "single" | "monthly";
const MONTHLY_CENTS = getMembershipPlan(MEMBERSHIP_AT_BOOKING_PLAN).monthlyCents;


/** A signed-in member books here too: their own seat is included. */
const MEMBER_COPY = {
  nl: {
    included: "Inbegrepen in je lidmaatschap",
    reserve: "Reserveer mijn plek",
    guestFree: "Je gast komt deze keer gratis mee",
    guestPaid: (price: string) => `Je gast betaalt ${price}`,
    free: "gratis",
    login: "Al lid? Log in",
    loginCta: "Log in als lid",
  },
  en: {
    included: "Included in your membership",
    reserve: "Reserve my seat",
    guestFree: "Your guest comes along for free this time",
    guestPaid: (price: string) => `Your guest pays ${price}`,
    free: "free",
    login: "Already a member? Log in",
    loginCta: "Log in as a member",
  },
} as const;

/** What the card knows about a signed-in member (from /api/jouw-tafel/guest/me). */
export type CardMember = { guestCents: number; freeGuest: boolean; endsAt: string | null };

function isoDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export interface EnglishComingSoonLabels {
  title: string;
  body: string;
  cta: string;
  success: string;
  error: string;
}

interface SundayTableBookingCardProps {
  eventId: string;
  locale: Locale;
  /** City of this table, used for the "notify me" sign-up. */
  cityName: string;
  englishComingSoon: EnglishComingSoonLabels;
  pricePerSeatEuros: number;
  spotsLeft: number;
  emailLabel: string;
  nameLabel: string;
  seatsLabel: string;
  seatOneLabel: string;
  seatTwoLabel: string;
  languageLabel: string;
  languageDutchLabel: string;
  languageEnglishLabel: string;
  languageBothLabel: string;
  ctaLabel: string;
  ctaLabelPlural: string;
  soldOutLabel: string;
  guarantees: string[];
  /** "Wat je krijgt voor €10", shown under the buy button. */
  included?: { title: string; items: string[]; note: string } | null;
  genericErrorLabel: string;
  /** When this Sunday starts (ISO): a membership that ends before it does
   * not cover the seat. */
  startsAt?: string | null;
}

export function SundayTableBookingCard({
  eventId,
  locale,
  cityName,
  englishComingSoon,
  pricePerSeatEuros,
  spotsLeft,
  emailLabel,
  nameLabel,
  seatsLabel,
  seatOneLabel,
  seatTwoLabel,
  languageLabel,
  languageDutchLabel,
  languageEnglishLabel,
  languageBothLabel,
  ctaLabel,
  ctaLabelPlural,
  soldOutLabel,
  guarantees,
  included = null,
  genericErrorLabel,
  startsAt = null,
}: SundayTableBookingCardProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const birthCopy = BIRTH_COPY[locale === "en" ? "en" : "nl"];
  const ageCopy = AGE_PREFERENCE_COPY[locale === "en" ? "en" : "nl"];
  const [agePreference, setAgePreference] = useState<AgePreference | null>(null);
  const [seats, setSeats] = useState<1 | 2>(1);
  /** Came through the quiz ("Kies je zondag"): the card is filled in with
   * what they gave there, and a link goes back to their Sundays. */
  const [fromQuiz, setFromQuiz] = useState(false);
  /** A signed-in member: own seat included, the guest free or at the member price. */
  const [member, setMember] = useState<CardMember | null>(null);
  /** Nobody is signed in: a member can log in from here. */
  const [signedOut, setSignedOut] = useState(false);
  const memberCopy = MEMBER_COPY[locale === "en" ? "en" : "nl"];
  const planCopy = PLAN_COPY[locale === "en" ? "en" : "nl"];
  const [ticketPlan, setTicketPlan] = useState<TicketPlan | null>(null);
  /** Two steps for someone who is not a member: 1. which ticket and how
   * many, 2. their details. A member goes straight to 2. */
  const [step, setStep] = useState<1 | 2>(1);
  /** The typed address is a member's, but nobody is signed in as them. */
  const [needsLogin, setNeedsLogin] = useState(false);
  /** Back to this Sunday after logging in. */
  const logInHref = () =>
    `${jouwTafelLogInPath(locale)}?naar=${encodeURIComponent(typeof window === "undefined" ? "" : window.location.pathname)}`;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/jouw-tafel/guest/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((me: { known?: boolean; member?: CardMember | null; email?: string; name?: string | null; birthDate?: string | null } | null) => {
        if (cancelled) return;
        if (!me?.known) {
          setSignedOut(Boolean(me));
          return;
        }
        // A membership that ends before this Sunday does not cover it.
        const covers = !me.member?.endsAt || !startsAt || Date.parse(startsAt) <= Date.parse(me.member.endsAt);
        if (me.member && covers) setMember(me.member);
        else setFromQuiz(true);
        if (me.email) setEmail((current) => current || me.email!);
        if (me.name) setName((current) => current || me.name!);
        if (me.birthDate) setBirthDate((current) => current || me.birthDate!);
      })
      .catch(() => {
        /* the card simply stays empty */
      });
    return () => {
      cancelled = true;
    };
  }, [startsAt]);
  const [tableLanguagePreference, setTableLanguagePreference] =
    useState<TableLanguagePreference>(DEFAULT_TABLE_LANGUAGE_PREFERENCE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [englishNotified, setEnglishNotified] = useState(false);

  const soldOut = spotsLeft <= 0;
  const maxSeats = Math.min(2, spotsLeft);
  const guestFree = Boolean(member?.freeGuest);
  const memberGuestEuros = member ? member.guestCents / 100 : 0;
  // The choice is only for someone who is not a member yet.
  const offersPlan = MEMBERSHIP_AT_BOOKING && !member;
  const monthly = offersPlan && ticketPlan === "monthly";
  const twoSteps = offersPlan;
  const showDetails = !twoSteps || step === 2;
  const total = member
    ? seats === 2 && !guestFree ? memberGuestEuros : 0
    : monthly
      ? MONTHLY_CENTS / 100
      : pricePerSeatEuros * seats;
  const euroLabel = (value: number) =>
    Number.isInteger(value) ? `€${value}` : `€${value.toFixed(2).replace(".", locale === "en" ? "." : ",")}`;
  // Most tables are Dutch-speaking: there "English" stays selectable, but it
  // swaps the ticket button for a sign-up for the first English table.
  const englishOpen = isEnglishOpenForSundayTable(eventId);
  const englishOnlyWaiting =
    !englishOpen && tableLanguagePreference === "prefer_english";

  function selectLanguage(value: TableLanguagePreference) {
    setTableLanguagePreference(value);
    setError(null);
    if (value === "prefer_english" && !englishOpen) {
      trackSundayTableEnglishRequested({ step: "selected", city: cityName, locale });
    }
  }

  async function notifyEnglish() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          cities: [cityName],
          // They asked for English, so any mail they get from us (starting
          // with the waitlist welcome) should be in English too.
          locale: "en",
          source: "waitlist",
          preferences: { language: ["english"] },
        }),
      });
      if (!res.ok) {
        setError(englishComingSoon.error);
        return;
      }
      trackSundayTableEnglishRequested({ step: "notify", city: cityName, locale });
      setEnglishNotified(true);
    } catch {
      setError(englishComingSoon.error);
    } finally {
      setLoading(false);
    }
  }

  function goToDetails() {
    if (!ticketPlan) {
      setError(planCopy.missing);
      return;
    }
    setError(null);
    trackSundaySocialTicketChosen({ plan: ticketPlan, seats, city: cityName, locale });
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (soldOut || loading) return;
    if (!showDetails) {
      goToDetails();
      return;
    }
    if (englishOnlyWaiting) {
      if (!englishNotified) await notifyEnglish();
      return;
    }
    if (!isAtLeastMinAge(birthDate)) {
      setError(birthCopy.underAge);
      return;
    }
    if (!agePreference) {
      setError(ageCopy.missing);
      return;
    }
    if (offersPlan && !ticketPlan) {
      setError(planCopy.missing);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          email,
          name,
          seats,
          locale,
          tableLanguagePreference,
          birthDate,
          agePreference,
          ...(offersPlan && ticketPlan ? { plan: ticketPlan } : {}),
          returnPath: window.location.pathname,
          utm: getStoredUtm(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNeedsLogin(data.code === "member_login");
        setError(data.error ?? genericErrorLabel);
        setLoading(false);
        return;
      }
      // A member's included seat (and a free guest) is booked straight away.
      if (data.booked) {
        window.location.href = `${jouwTafelSettingsPath(locale)}?geboekt=1`;
        return;
      }
      window.location.href = data.url;
    } catch {
      setError(genericErrorLabel);
      setLoading(false);
    }
  }

  if (soldOut) {
    return (
      <div className="mt-6 rounded-full bg-wine/10 px-4 py-3 text-center text-sm font-medium text-wine/70">
        {soldOutLabel}
      </div>
    );
  }

  const chipClass = (on: boolean) =>
    `rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
      on ? "border-burgundy bg-burgundy text-cream" : "border-wine/15 bg-white text-wine/70 hover:border-wine/30"
    }`;
  const inputClass =
    "mt-1.5 w-full rounded-xl border border-wine/15 bg-white px-3.5 py-2.5 shadow-sm transition focus:border-burgundy/40 focus:outline-none focus:ring-2 focus:ring-burgundy/10";

  const seatsPicker = (
    <div>
      <span className="block text-sm font-medium text-wine">{seatsLabel}</span>
      <div className="mt-1.5 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setSeats(1)} className={chipClass(seats === 1)}>
          {seatOneLabel}
        </button>
        <button
          type="button"
          onClick={() => setSeats(2)}
          disabled={maxSeats < 2}
          className={`${chipClass(seats === 2)} disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {seatTwoLabel}
        </button>
      </div>
      {member && seats === 2 ? (
        <p className="mt-2 text-sm text-wine/70">
          {guestFree ? memberCopy.guestFree : memberCopy.guestPaid(euroLabel(memberGuestEuros))}
        </p>
      ) : null}
    </div>
  );

  const includedBox = englishOnlyWaiting || !included || member ? null : (
    <div className="rounded-2xl border border-wine/10 bg-white/60 px-4 py-3.5">
      <p className="text-sm font-semibold text-wine">{included.title}</p>
      <ul className="mt-2 space-y-1.5">
        {included.items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-snug text-wine/75">
            <span aria-hidden className="shrink-0 text-emerald-700">
              ✓
            </span>
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-2.5 border-t border-wine/10 pt-2 text-xs leading-snug text-wine/55">{included.note}</p>
    </div>
  );

  const guaranteesLine = englishOnlyWaiting ? null : (
    <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-xs text-wine/50">
      {guarantees.map((item) => (
        <span key={item} className="inline-flex items-center gap-1">
          <span aria-hidden className="text-wine/40">
            ✓
          </span>
          {item}
        </span>
      ))}
    </p>
  );

  const errorBlock =
    needsLogin && error ? (
      <div className="rounded-2xl border border-gold/50 bg-gold/10 px-4 py-4">
        <p className="text-sm font-semibold leading-snug text-wine">{error}</p>
        <a
          href={logInHref()}
          className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-burgundy px-6 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-cream transition hover:bg-wine"
        >
          {memberCopy.loginCta}
        </a>
      </div>
    ) : error ? (
      <p className="text-sm text-red-800">{error}</p>
    ) : null;

  const submitClass =
    "w-full justify-center bg-burgundy px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.1em] text-cream hover:bg-wine";

  // Step 1: which ticket, and how many.
  if (!showDetails) {
    return (
      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        {fromQuiz ? (
          <a
            href={jouwTafelKiesPath(locale)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-burgundy underline decoration-burgundy/30 underline-offset-4 hover:decoration-burgundy"
          >
            <span aria-hidden>&larr;</span>
            {locale === "en" ? "Choose another Sunday" : "Kies een andere zondag"}
          </a>
        ) : null}
        <div>
          <span className="block text-sm font-medium text-wine">{planCopy.label}</span>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {(
              [
                ["single", planCopy.singleTitle, euroLabel(pricePerSeatEuros), null, planCopy.singleShort],
                ["monthly", planCopy.monthlyTitle, euroLabel(MONTHLY_CENTS / 100), planCopy.perMonth, planCopy.monthlyShort],
              ] as const
            ).map(([value, title, price, unit, short]) => {
              const chosen = ticketPlan === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={chosen}
                  onClick={() => {
                    setTicketPlan(value);
                    setError(null);
                  }}
                  className={`flex flex-col items-center rounded-2xl border px-3 py-3.5 text-center transition ${
                    chosen ? "border-burgundy bg-burgundy/[0.06] ring-1 ring-burgundy" : "border-wine/15 bg-white hover:border-wine/30"
                  }`}
                >
                  <span className="text-sm font-semibold text-wine">{title}</span>
                  <span className="mt-1 font-serif text-2xl leading-none text-wine">
                    {price}
                    {unit ? <span className="ml-1 font-sans text-xs font-medium text-wine/60">{unit}</span> : null}
                  </span>
                  <span className="mt-1.5 text-xs leading-snug text-wine/60">{short}</span>
                </button>
              );
            })}
          </div>
        </div>
        {seatsPicker}
        {errorBlock}
        <Button type="submit" className={`${submitClass} ${ticketPlan ? "" : "opacity-60"}`}>
          {`${planCopy.next}${ticketPlan ? ` · ${euroLabel(total)}${monthly ? `/${planCopy.perMonthShort}` : ""}${monthly && seats === 2 ? ` · ${planCopy.guestFree}` : ""}` : ""}`}
        </Button>
        {signedOut ? (
          <p className="text-center text-sm">
            <a
              href={logInHref()}
              className="font-medium text-burgundy underline decoration-burgundy/30 underline-offset-4 hover:decoration-burgundy"
            >
              {memberCopy.login}
            </a>
          </p>
        ) : null}
        {includedBox}
        {guaranteesLine}
      </form>
    );
  }

  // Step 2: their details (a member starts here).
  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3">
      {twoSteps && ticketPlan ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-wine/10 bg-white/70 px-3.5 py-2.5 text-sm text-wine">
          <span className="font-semibold">
            {ticketPlan === "monthly"
              ? `${planCopy.monthlyTitle} · ${euroLabel(MONTHLY_CENTS / 100)} ${planCopy.perMonth}`
              : `${planCopy.singleTitle} · ${euroLabel(pricePerSeatEuros)}`}
            <span className="font-normal text-wine/60"> · {seats === 2 ? seatTwoLabel : seatOneLabel}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setStep(1);
              setError(null);
            }}
            className="shrink-0 font-medium text-burgundy underline decoration-burgundy/30 underline-offset-4 hover:decoration-burgundy"
          >
            {planCopy.back}
          </button>
        </div>
      ) : null}
      {!twoSteps && fromQuiz ? (
        <a
          href={jouwTafelKiesPath(locale)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-burgundy underline decoration-burgundy/30 underline-offset-4 hover:decoration-burgundy"
        >
          <span aria-hidden>&larr;</span>
          {locale === "en" ? "Choose another Sunday" : "Kies een andere zondag"}
        </a>
      ) : null}
      {member ? (
        <p className="flex items-center gap-2 rounded-xl border border-gold/50 bg-gold/10 px-3.5 py-2.5 text-sm font-semibold text-wine">
          <span aria-hidden className="text-emerald-700">
            ✓
          </span>
          {memberCopy.included}
        </p>
      ) : null}
      <label className="block text-sm font-medium text-wine">
        {emailLabel}
        <input
          type="email"
          required
          value={email}
          readOnly={Boolean(member)}
          onChange={(e) => {
            setEmail(e.target.value);
            if (needsLogin) {
              setNeedsLogin(false);
              setError(null);
            }
          }}
          className={inputClass}
        />
      </label>
      <label className="block text-sm font-medium text-wine">
        {nameLabel}
        <input
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </label>
      {englishOnlyWaiting ? null : (
        <label className="block text-sm font-medium text-wine">
          {birthCopy.label}
          <input
            id="sunday-social-birth-date"
            type="date"
            required
            autoComplete="bday"
            min="1920-01-01"
            max={isoDay(latestLegalBirthDate())}
            value={birthDate}
            onChange={(e) => {
              setBirthDate(e.target.value);
              setError(null);
            }}
            className={inputClass}
          />
        </label>
      )}
      {englishOnlyWaiting ? null : (
        <div>
          <span className="block text-sm font-medium text-wine">{ageCopy.label}</span>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {(["similar", "any"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={agePreference === value}
                onClick={() => {
                  setAgePreference(value);
                  setError(null);
                }}
                className={chipClass(agePreference === value)}
              >
                {ageCopy[value]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <span className="block text-sm font-medium text-wine">{languageLabel}</span>
        <div className="mt-1.5 grid grid-cols-3 gap-2">
          {(
            [
              ["prefer_dutch", languageDutchLabel],
              ["both_fine", languageBothLabel],
              ["prefer_english", languageEnglishLabel],
            ] as const
          ).map(([value, label]) => (
            <button key={value} type="button" onClick={() => selectLanguage(value)} className={`${chipClass(tableLanguagePreference === value)} px-2`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {englishOnlyWaiting ? (
        <div className="rounded-2xl border border-gold/40 bg-gold/10 px-4 py-4">
          <p className="font-serif text-lg leading-snug text-wine">{englishComingSoon.title}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-wine/70">{englishComingSoon.body}</p>
          {englishNotified ? <p className="mt-3 text-sm font-semibold text-wine">✓ {englishComingSoon.success}</p> : null}
        </div>
      ) : null}

      {!twoSteps && !englishOnlyWaiting ? seatsPicker : null}

      {errorBlock}

      {(englishOnlyWaiting && englishNotified) || needsLogin ? null : (
        <Button type="submit" className={submitClass}>
          {loading
            ? "…"
            : englishOnlyWaiting
              ? englishComingSoon.cta
              : member
                ? `${memberCopy.reserve} · ${total > 0 ? euroLabel(total) : memberCopy.free}`
                : monthly
                  ? `${planCopy.monthlyCta} · ${euroLabel(total)}${seats === 2 ? ` · ${planCopy.guestFree}` : ""}`
                  : `${seats > 1 ? ctaLabelPlural : ctaLabel} · €${total}`}
        </Button>
      )}
      {monthly && !englishOnlyWaiting ? (
        <p className="text-center text-xs leading-snug text-wine/60">{planCopy.monthlyNote}</p>
      ) : null}
      {!twoSteps && signedOut && !member ? (
        <p className="text-center text-sm">
          <a
            href={logInHref()}
            className="font-medium text-burgundy underline decoration-burgundy/30 underline-offset-4 hover:decoration-burgundy"
          >
            {memberCopy.login}
          </a>
        </p>
      ) : null}
      {twoSteps ? null : includedBox}
      {guaranteesLine}
    </form>
  );
}
