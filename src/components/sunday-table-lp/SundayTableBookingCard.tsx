"use client";

import { TELL_FRIENDS_COPY } from "@/lib/tafelvrienden/tell-friends-copy";
import { useEffect, useState } from "react";
import { jouwTafelKiesPath, jouwTafelLogInPath, jouwTafelSettingsPath, type Locale } from "@/i18n/config";
import { Button } from "@/components/ui/Button";
import {
  DEFAULT_TABLE_LANGUAGE_PREFERENCE,
  isEnglishOpenForSundayTable,
  type TableLanguagePreference,
} from "@/lib/booking-table-language";
import { getStoredUtm } from "@/lib/analytics/utm";
import { trackSundaySocialBookingStep, trackSundaySocialTicketChosen, trackSundayTableEnglishRequested } from "@/lib/posthog/analytics";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { syncMemberCustomerClient } from "@/features/auth/sync-customer-client";
import { AUTH_CODE_LENGTH, classifyVerifyCodeError, normalizeAuthEmail, sanitizeAuthCode, validateAuthEmail } from "@/lib/jouw-tafel/auth-logic";
import { isAtLeastMinAge, latestLegalBirthDate } from "@/lib/member-onboarding";
import type { ReservedVenue } from "@/lib/partner-venues";
import {
  MEMBERSHIP_AT_BOOKING,
  MEMBERSHIP_AT_BOOKING_PLAN,
  getMembershipPlan,
} from "@/lib/membership/plans";

/** Right above the buy button: the promise the booker ticks. A seat from a
 * membership follows the membership's own rule (cancel until 48 hours before). */
const COMMIT_COPY = {
  nl: {
    lead: "Ik kom.",
    seat: "Mijn tafel wordt op mij ingedeeld. Kan ik toch niet, dan verzet ik uiterlijk 7 dagen vooraf.",
    member: "Mijn tafel wordt op mij ingedeeld. Kan ik toch niet, dan meld ik me uiterlijk 48 uur vooraf af.",
  },
  en: {
    lead: "I'll be there.",
    seat: "My table is made around me. If I can't make it after all, I move my seat at least 7 days before.",
    member: "My table is made around me. If I can't make it after all, I cancel at least 48 hours before.",
  },
} as const;

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
    monthlyCta: "Word club member en reserveer",
    guestFree: "gast gratis",
    singleShort: "alleen deze datum",
    monthlyShort: "elke maand een plek, in alle steden",
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
    monthlyCta: "Become a club member and reserve",
    guestFree: "guest free",
    singleShort: "just this date",
    monthlyShort: "a seat every month, in every city",
    next: "Continue",
    back: "Change",
    monthlyNote: "You book next Sundays yourself in your account. Cancel monthly.",
  },
} as const;
type TicketPlan = "single" | "monthly";

/** Step 1 (the email) and the login code for an address we know. */
const STEP_COPY = {
  nl: {
    step: (n: number, of: number) => `Stap ${n} van ${of}`,
    emailTitle: "Waar mogen we je bevestiging naartoe sturen?",
    next: "Verder",
    invalidEmail: "Vul een geldig e-mailadres in.",
    knownTitle: "Welkom terug!",
    knownBody: (email: string) => `We sturen een code naar ${email}. Daarmee vullen we je gegevens voor je in.`,
    memberTitle: "Je bent club member",
    memberBody: (email: string) => `We sturen een code naar ${email}. Daarmee reserveer je je plek met je club membership.`,
    sendCode: "Stuur code",
    skip: "Liever zelf invullen",
    codeLabel: (email: string) => `Vul de code in die we naar ${email} stuurden`,
    resend: "Stuur opnieuw",
    otherEmail: "Ander e-mailadres",
    codeWrong: "Die code klopt niet of is verlopen.",
    codeFailed: "Dat lukte niet. Probeer het zo nog eens.",
    change: "Wijzig",
    detailsKnown: (name: string, born: string) => `${name} · geboren ${born}`,
  },
  en: {
    step: (n: number, of: number) => `Step ${n} of ${of}`,
    emailTitle: "Where should we send your confirmation?",
    next: "Continue",
    invalidEmail: "Fill in a valid email address.",
    knownTitle: "Welcome back!",
    knownBody: (email: string) => `We'll send a code to ${email}. With it we fill in your details for you.`,
    memberTitle: "You're a club member",
    memberBody: (email: string) => `We'll send a code to ${email}. With it you reserve your seat with your club membership.`,
    sendCode: "Send code",
    skip: "Rather fill it in myself",
    codeLabel: (email: string) => `Fill in the code we sent to ${email}`,
    resend: "Send again",
    otherEmail: "Other email address",
    codeWrong: "That code is wrong or has expired.",
    codeFailed: "That didn't work. Please try again in a moment.",
    change: "Change",
    detailsKnown: (name: string, born: string) => `${name} · born ${born}`,
  },
} as const;
type Stage = "email" | "code" | "details";

/** "Elke zondag" as an offer just above the buy button, once they decided to come. */
const UPSELL_COPY = {
  nl: {
    title: "Voor hetzelfde bedrag elke zondag?",
    lead: (price: string) => `Word club member voor ${price} per maand:`,
    items: [
      "Je plek bij elke Sunday Social inbegrepen, in alle steden",
      "Kies zelf je bar uit onze reserveringen",
      "Boek 48 uur eerder dan iedereen",
      "Eens per 3 maanden een gast gratis mee",
      "Maandelijks opzegbaar",
    ],
    yes: "Ja, maak er Elke zondag van",
  },
  en: {
    title: "Every Sunday for the same price?",
    lead: (price: string) => `Become a club member for ${price} per month:`,
    items: [
      "Your seat at every Sunday Social included, in every city",
      "Pick your own bar from our reservations",
      "Book 48 hours before everyone else",
      "A guest free once every 3 months",
      "Cancel monthly",
    ],
    yes: "Yes, make it Every Sunday",
  },
} as const;
const MONTHLY_CENTS = getMembershipPlan(MEMBERSHIP_AT_BOOKING_PLAN).monthlyCents;


/** A signed-in member books here too: their own seat is included. */
const MEMBER_COPY = {
  nl: {
    included: "Inbegrepen in je club membership",
    reserve: "Reserveer mijn plek",
    guestFree: "Je gast komt deze keer gratis mee",
    guestPaid: (price: string) => `Je gast betaalt ${price}`,
    free: "gratis",
    login: "Al club member? Log in",
    loginCta: "Log in als club member",
    reservedTitle: "Hier hebben we gereserveerd",
    reservedPending: "Waar we reserveren, zie je hier zodra het vastligt.",
    seatsLeft: (n: number) => (n === 1 ? "1 plek" : `${n} plekken`),
    full: "vol",
    pickVenue: "Kies je bar.",
  },
  en: {
    included: "Included in your club membership",
    reserve: "Reserve my seat",
    guestFree: "Your guest comes along for free this time",
    guestPaid: (price: string) => `Your guest pays ${price}`,
    free: "free",
    login: "Already a club member? Log in",
    loginCta: "Log in as a club member",
    reservedTitle: "Where we reserved",
    reservedPending: "You'll see where we reserve here once it's set.",
    seatsLeft: (n: number) => (n === 1 ? "1 seat" : `${n} seats`),
    full: "full",
    pickVenue: "Pick your bar.",
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
  included?: { title: string; items: string[]; note: string; summary?: string } | null;
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
  const [tableLanguagePreference, setTableLanguagePreference] =
    useState<TableLanguagePreference>(DEFAULT_TABLE_LANGUAGE_PREFERENCE);
  /** Came through the quiz ("Kies je zondag"): the card is filled in with
   * what they gave there, and a link goes back to their Sundays. */
  const [fromQuiz, setFromQuiz] = useState(false);
  /** A signed-in member: own seat included, the guest free or at the member price. */
  const [member, setMember] = useState<CardMember | null>(null);
  /** For a member: the bars we reserved this Sunday, and the one they pick. */
  const [reserved, setReserved] = useState<ReservedVenue[] | null>(null);
  const [venueId, setVenueId] = useState<string | null>(null);
  const memberCopy = MEMBER_COPY[locale === "en" ? "en" : "nl"];
  const planCopy = PLAN_COPY[locale === "en" ? "en" : "nl"];
  // "Alleen deze zondag" is chosen from the start: "Verder" works at once,
  // and "Elke zondag" is one tap away.
  const [ticketPlan, setTicketPlan] = useState<TicketPlan | null>("single");
  // From the feedback page: "?ticket=elke-zondag" or "?ticket=deze-zondag"
  // comes with that ticket already chosen, "&plekken=2" with a +1.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wanted = params.get("ticket");
    const plan: TicketPlan | null = wanted === "elke-zondag" ? "monthly" : wanted === "deze-zondag" ? "single" : null;
    if (plan) queueMicrotask(() => setTicketPlan(plan));
    if (params.get("plekken") === "2" && spotsLeft >= 2) queueMicrotask(() => setSeats(2));
  }, [spotsLeft]);
  /** The steps: 1. the email (an address we know gets a login code), 2. which
   * ticket and how many, 3. their details and pay. Someone signed in starts
   * at the ticket; a member goes straight to the details. */
  const [stage, setStage] = useState<Stage>("email");
  const stepCopy = STEP_COPY[locale === "en" ? "en" : "nl"];
  const upsellCopy = UPSELL_COPY[locale === "en" ? "en" : "nl"];
  /** What step 1 found: a member's address, or one with an account. */
  const [lookupKind, setLookupKind] = useState<"member" | "known" | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  /** Signed in (from the start, or with the code): their details are shown in one line. */
  const [signedIn, setSignedIn] = useState(false);
  const [editDetails, setEditDetails] = useState(false);
  /** The typed address is a member's, but nobody is signed in as them. */
  const [needsLogin, setNeedsLogin] = useState(false);
  /** The signed-in (or quiz) address that has a mutual like; the checkbox shows only while that address is the one typed. */
  const [friendEmail, setFriendEmail] = useState<string | null>(null);
  const [tellFriends, setTellFriends] = useState(true);
  /** Back to this Sunday after logging in. */
  const logInHref = () =>
    `${jouwTafelLogInPath(locale)}?naar=${encodeURIComponent(typeof window === "undefined" ? "" : window.location.pathname)}`;

  /** Who is signed in on this device (or came through the quiz): fills in the card. */
  function loadMe(isCancelled: () => boolean = () => false): Promise<void> {
    return fetch("/api/jouw-tafel/guest/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((me: { known?: boolean; member?: CardMember | null; email?: string; name?: string | null; birthDate?: string | null; ageMatters?: "yes" | "no" | null; language?: "dutch" | "english" | "both" | null; hasTableFriend?: boolean } | null) => {
        if (isCancelled()) return;
        if (me?.hasTableFriend && me.email) setFriendEmail(me.email.trim().toLowerCase());
        if (!me?.known) {
          return;
        }
        setSignedIn(true);
        // A membership that ends before this Sunday does not cover it.
        const covers = !me.member?.endsAt || !startsAt || Date.parse(startsAt) <= Date.parse(me.member.endsAt);
        if (me.member && covers) {
          setMember(me.member);
          setStage((current) => (current === "email" || current === "code" ? "details" : current));
          fetch(`/api/sunday-social/reserved?eventId=${encodeURIComponent(eventId)}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data: { venues?: ReservedVenue[] | null } | null) => {
              if (!isCancelled() && Array.isArray(data?.venues)) setReserved(data.venues);
            })
            .catch(() => {
              /* no pick: we choose the bar */
            });
        } else {
          setFromQuiz(true);
          setStage((current) => (current === "email" || current === "code" ? "details" : current));
        }
        if (me.email) setEmail((current) => current || me.email!);
        if (me.name) setName((current) => current || me.name!);
        if (me.birthDate) setBirthDate((current) => current || me.birthDate!);
        // Their quiz answers stand in for the two choices on the card.
        if (me.ageMatters) setAgePreference((current) => current ?? (me.ageMatters === "yes" ? "similar" : "any"));
        if (me.language === "dutch") setTableLanguagePreference("prefer_dutch");
        // From "Kies je zondag" the ticket for this Sunday is ticked already
        // (see the effect above). The choice stays in view, "Elke zondag" and
        // a second seat next to it: one tap on "Verder" and their details
        // are there. The card sits under the story of the afternoon, so
        // bring it into view.
        if (window.location.hash === "#boeken" && new URLSearchParams(window.location.search).has("ticket")) {
          window.setTimeout(() => document.getElementById("boeken")?.scrollIntoView({ block: "start", behavior: "instant" }), 150);
        }
      })
      .catch(() => {
        /* the card simply stays empty */
      });
  }

  useEffect(() => {
    let cancelled = false;
    void loadMe(() => cancelled);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startsAt, eventId]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [englishNotified, setEnglishNotified] = useState(false);

  const askTellFriends = Boolean(friendEmail) && email.trim().toLowerCase() === friendEmail;
  const soldOut = spotsLeft <= 0;
  const maxSeats = Math.min(2, spotsLeft);
  const guestFree = Boolean(member?.freeGuest);
  const memberGuestEuros = member ? member.guestCents / 100 : 0;
  // The choice is only for someone who is not a member yet.
  const offersPlan = MEMBERSHIP_AT_BOOKING && !member;
  const monthly = offersPlan && ticketPlan === "monthly";
  // Two steps: the email, then the details and pay ("Elke zondag" is an offer there).
  const stepsTotal = 2;
  const stepLabel = (n: number) => <p className="text-xs font-medium text-wine/50">{stepCopy.step(n, stepsTotal)}</p>;
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

  /** Step 1: what kind of address is it. Nothing about the person comes back. */
  async function submitEmail() {
    if (validateAuthEmail(email)) {
      setError(stepCopy.invalidEmail);
      return;
    }
    const target = normalizeAuthEmail(email);
    setEmail(target);
    setLoading(true);
    setError(null);
    let kind: "member" | "known" | "new" = "new";
    try {
      const res = await fetch("/api/booking/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: target, startsAt }),
      });
      const data = (await res.json().catch(() => null)) as { kind?: "member" | "known" | "new" } | null;
      if (data?.kind) kind = data.kind;
    } catch {
      /* unknown: they simply fill it in */
    } finally {
      setLoading(false);
    }
    trackSundaySocialBookingStep({ step: "email", city: cityName, locale, kind });
    if (kind === "new") {
      setStage("details");
      return;
    }
    setLookupKind(kind);
    setCodeSent(false);
    setCode("");
    setStage("code");
  }

  async function sendLoginCode() {
    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: sendError } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    setLoading(false);
    if (sendError) {
      setError(stepCopy.codeFailed);
      return;
    }
    trackSundaySocialBookingStep({ step: "code_sent", city: cityName, locale });
    setCodeSent(true);
  }

  async function verifyLoginCode(token: string) {
    if (token.length !== AUTH_CODE_LENGTH || loading) return;
    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { data, error: verifyError } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    if (verifyError || !data.user) {
      const reason = verifyError
        ? classifyVerifyCodeError({ code: (verifyError as { code?: string }).code, status: verifyError.status, message: verifyError.message })
        : "other";
      setError(reason === "wrong_or_expired" ? stepCopy.codeWrong : stepCopy.codeFailed);
      setLoading(false);
      return;
    }
    trackSundaySocialBookingStep({ step: "code_verified", city: cityName, locale });
    await Promise.race([syncMemberCustomerClient(locale), new Promise((resolve) => window.setTimeout(resolve, 2500))]);
    await loadMe();
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (soldOut || loading) return;
    if (stage === "email") {
      await submitEmail();
      return;
    }
    if (stage === "code") {
      if (codeSent) await verifyLoginCode(code);
      else await sendLoginCode();
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
    if (member && reserved && reserved.length > 0 && !venueId) {
      setError(memberCopy.pickVenue);
      return;
    }
    if (ticketPlan) trackSundaySocialTicketChosen({ plan: ticketPlan, seats, city: cityName, locale });
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
          ...(member && venueId ? { preferredVenueId: venueId } : {}),
          ...(askTellFriends ? { tellFriends } : {}),
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

  // Step 1: the email.
  if (stage === "email") {
    return (
      <form onSubmit={handleSubmit} className="mt-6 space-y-3" noValidate>
        {stepLabel(1)}
        <label className="block text-sm font-medium text-wine">
          {stepCopy.emailTitle}
          <input
            id="booking-email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder={emailLabel}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            className={inputClass}
          />
        </label>
        {error ? <p className="text-sm text-red-800">{error}</p> : null}
        <Button type="submit" className={submitClass}>
          {loading ? "…" : stepCopy.next}
        </Button>
        {guaranteesLine}
      </form>
    );
  }

  // An address we know: a login code fills in the card (a member logs in to book with the membership).
  if (stage === "code") {
    const isMember = lookupKind === "member";
    return (
      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        {stepLabel(1)}
        <p className="font-serif text-2xl text-wine">{isMember ? stepCopy.memberTitle : stepCopy.knownTitle}</p>
        {codeSent ? (
          <label className="block text-sm font-medium text-wine">
            {stepCopy.codeLabel(email)}
            <input
              id="booking-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={AUTH_CODE_LENGTH}
              value={code}
              onChange={(e) => {
                const next = sanitizeAuthCode(e.target.value);
                setCode(next);
                setError(null);
                if (next.length === AUTH_CODE_LENGTH) void verifyLoginCode(next);
              }}
              className={`${inputClass} text-center text-2xl tracking-[0.4em]`}
            />
          </label>
        ) : (
          <p className="text-sm leading-relaxed text-wine/70">{isMember ? stepCopy.memberBody(email) : stepCopy.knownBody(email)}</p>
        )}
        {error ? <p className="text-sm text-red-800">{error}</p> : null}
        <Button type="submit" className={submitClass}>
          {loading ? "…" : codeSent ? stepCopy.next : stepCopy.sendCode}
        </Button>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
          {codeSent ? (
            <button type="button" onClick={() => void sendLoginCode()} className="font-medium text-burgundy underline decoration-burgundy/30 underline-offset-4">
              {stepCopy.resend}
            </button>
          ) : null}
          {!isMember ? (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStage("details");
              }}
              className="font-medium text-burgundy underline decoration-burgundy/30 underline-offset-4"
            >
              {stepCopy.skip}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStage("email");
            }}
            className="text-wine/60 underline underline-offset-4"
          >
            {stepCopy.otherEmail}
          </button>
        </div>
      </form>
    );
  }

  // Step 2: their details (a member starts here), the offer, and pay.
  const detailsKnown = signedIn && !editDetails && Boolean(name.trim() && birthDate && agePreference);
  const bornLabel = birthDate ? birthDate.split("-").reverse().join("-") : "";
  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3">
      {member ? null : stepLabel(stepsTotal)}
      {fromQuiz ? (
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
      {member && reserved ? (
        <fieldset className="rounded-xl border border-wine/10 bg-white/70 px-3.5 py-3">
          <legend className="px-1 text-sm font-semibold text-wine">{memberCopy.reservedTitle}</legend>
          {reserved.length === 0 ? (
            <p className="text-sm text-wine/60">{memberCopy.reservedPending}</p>
          ) : (
            <div className="space-y-1.5">
              {reserved.map((v) => {
                const full = v.seatsLeft !== null && v.seatsLeft < seats;
                return (
                  <label
                    key={v.id}
                    className={`flex items-center justify-between gap-3 text-sm ${full ? "text-wine/40" : "text-wine"}`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="preferredVenue"
                        value={v.id}
                        checked={venueId === v.id}
                        disabled={full}
                        onChange={() => {
                          setVenueId(v.id);
                          setError(null);
                        }}
                        className="h-4 w-4 accent-burgundy"
                      />
                      <span className="font-medium">{v.name}</span>
                      {v.area ? <span className="text-wine/50">{v.area}</span> : null}
                    </span>
                    {v.seatsLeft !== null ? (
                      <span className="shrink-0 text-xs text-wine/55">
                        {v.seatsLeft === 0 ? memberCopy.full : memberCopy.seatsLeft(v.seatsLeft)}
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          )}
        </fieldset>
      ) : null}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-wine/10 bg-white/70 px-3.5 py-2.5 text-sm text-wine">
        <span className="min-w-0 truncate">{email}</span>
        {member ? null : (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setNeedsLogin(false);
              setStage("email");
            }}
            className="shrink-0 font-medium text-burgundy underline decoration-burgundy/30 underline-offset-4 hover:decoration-burgundy"
          >
            {stepCopy.change}
          </button>
        )}
      </div>
      {englishOnlyWaiting ? null : seatsPicker}
      {detailsKnown ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-wine/10 bg-white/70 px-3.5 py-2.5 text-sm text-wine">
          <span className="min-w-0">
            {stepCopy.detailsKnown(name.trim(), bornLabel)}
            <span className="block text-xs text-wine/60">{agePreference ? ageCopy[agePreference] : ""}</span>
          </span>
          <button
            type="button"
            onClick={() => setEditDetails(true)}
            className="shrink-0 font-medium text-burgundy underline decoration-burgundy/30 underline-offset-4 hover:decoration-burgundy"
          >
            {stepCopy.change}
          </button>
        </div>
      ) : (
        <>
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
        </>
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


      {errorBlock}

      {offersPlan && !englishOnlyWaiting && !needsLogin ? (
        <div className={`rounded-2xl border px-4 py-3.5 transition ${monthly ? "border-burgundy bg-burgundy/[0.05]" : "border-gold/50 bg-gold/10"}`}>
          <p className="font-serif text-lg leading-snug text-wine">{upsellCopy.title}</p>
          <p className="mt-1 text-sm text-wine/75">{upsellCopy.lead(euroLabel(MONTHLY_CENTS / 100))}</p>
          <ul className="mt-2 space-y-1">
            {upsellCopy.items.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-snug text-wine/75">
                <span aria-hidden className="shrink-0 text-emerald-700">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
          <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-wine/15 bg-white px-3.5 py-2.5 text-sm font-semibold text-wine">
            <input
              id="every-sunday"
              type="checkbox"
              checked={monthly}
              onChange={(e) => {
                setTicketPlan(e.target.checked ? "monthly" : "single");
                setError(null);
              }}
              className="h-4 w-4 shrink-0 accent-burgundy"
            />
            {upsellCopy.yes}
          </label>
        </div>
      ) : null}
      {askTellFriends && !englishOnlyWaiting && !needsLogin ? (
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gold/40 bg-white/60 px-4 py-3 text-left text-sm leading-snug text-wine/80">
          <input
            id="tell-friends"
            type="checkbox"
            checked={tellFriends}
            onChange={(e) => setTellFriends(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-burgundy"
          />
          <span>
            <span className="font-semibold text-wine">{TELL_FRIENDS_COPY[locale === "en" ? "en" : "nl"].lead}</span>{" "}
            {TELL_FRIENDS_COPY[locale === "en" ? "en" : "nl"].note}
          </span>
        </label>
      ) : null}
      {englishOnlyWaiting || needsLogin ? null : (
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gold/40 bg-white/60 px-4 py-3 text-left text-sm leading-snug text-wine/80">
          <input type="checkbox" required className="mt-0.5 h-4 w-4 shrink-0 accent-burgundy" />
          <span>
            <span className="font-semibold text-wine">{COMMIT_COPY[locale === "en" ? "en" : "nl"].lead}</span>{" "}
            {COMMIT_COPY[locale === "en" ? "en" : "nl"][member || monthly ? "member" : "seat"]}
          </span>
        </label>
      )}
      {(englishOnlyWaiting && englishNotified) || needsLogin ? null : (
        <Button type="submit" className={submitClass}>
          {loading
            ? "…"
            : englishOnlyWaiting
              ? englishComingSoon.cta
              : member
                ? `${memberCopy.reserve} · ${total > 0 ? euroLabel(total) : memberCopy.free}`
                : monthly
                  ? `${planCopy.monthlyCta} · ${euroLabel(total)}/${planCopy.perMonthShort}${seats === 2 ? ` · ${planCopy.guestFree}` : ""}`
                  : `${seats > 1 ? ctaLabelPlural : ctaLabel} · €${total}`}
        </Button>
      )}
      {monthly && !englishOnlyWaiting ? (
        <p className="text-center text-xs leading-snug text-wine/60">{planCopy.monthlyNote}</p>
      ) : null}
      {includedBox}
      {guaranteesLine}
    </form>
  );
}
