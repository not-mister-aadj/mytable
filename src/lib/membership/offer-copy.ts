// Words of the membership offer between paying for a Sunday Social and its
// confirmation. Pure and client-safe. Every amount comes in from the
// server, so the screen never names a price that is not charged.

import { formatPlanEuros } from "@/lib/membership/plans";

type Locale = "nl" | "en";

export type MembershipOfferAmounts = {
  /** What was just paid for this booking. */
  paidCents: number;
  /** One Sunday without a membership. */
  singleSeatCents: number;
  monthlyCents: number;
  creditCents: number;
  firstMonthCents: number;
  /** Cities with a Sunday Social. */
  cities: number;
};

export type OfferRow = { title: string; detail: string; amount: string | null; credit?: boolean };

export type MembershipOfferCopy = {
  paid: (sunday: string | null) => string;
  eyebrow: string;
  lead: string;
  headline: { before: string; accent: string; after: string };
  stackTitle: string;
  rows: OfferRow[];
  worth: { label: string; amount: string };
  regular: { label: string; amount: string };
  now: { label: string; amount: string; note: string };
  cta: string;
  busy: string;
  terms: string;
  decline: string;
  lastChance: string;
  error: string;
};

function euros(cents: number, locale: Locale): string {
  const value = formatPlanEuros(cents, locale);
  return locale === "nl" ? `€ ${value}` : `€${value}`;
}

export function getMembershipOfferCopy(locale: Locale, a: MembershipOfferAmounts): MembershipOfferCopy {
  const en = locale === "en";
  const paid = euros(a.paidCents, locale);
  const credit = euros(a.creditCents, locale);
  const first = euros(a.firstMonthCents, locale);
  const monthly = euros(a.monthlyCents, locale);
  const fourSundays = euros(a.singleSeatCents * 4, locale);
  const single = euros(a.singleSeatCents, locale);
  const worth = euros(a.singleSeatCents * 4 + a.singleSeatCents, locale);

  if (en) {
    return {
      paid: (sunday) => (sunday ? `Paid. Your seat on ${sunday} is yours.` : "Paid. Your seat is yours."),
      eyebrow: `Wait, your ${credit} is still worth something`,
      lead: `You just paid ${paid} for one Sunday.`,
      headline: { before: `For ${first} more you get `, accent: "all of them", after: "." },
      stackTitle: "What you get as a member",
      rows: [
        {
          title: `Every Sunday Social included, in all ${a.cities} cities`,
          detail: "4 Sundays one by one",
          amount: fourSundays,
        },
        { title: "Book before everyone else", detail: "You book 2 days before a table opens", amount: null },
        {
          title: "Bring someone for free every 3 months",
          detail: "The first time straight away",
          amount: single,
        },
        {
          title: `Your ${credit} of today counts`,
          detail: "It comes off your first month",
          amount: `− ${credit}`,
          credit: true,
        },
      ],
      worth: { label: "Together worth", amount: worth },
      regular: { label: "Normally", amount: `${monthly} per month` },
      now: { label: "Your first month", amount: first, note: `Then ${monthly} per month` },
      cta: `Yes, make me a member for ${first}`,
      busy: "One moment…",
      terms: "No contract. You can cancel every month in your settings.",
      decline: "No thanks, I would rather book per Sunday",
      lastChance: `Please note: after this screen you cannot come back here. The ${credit} of this booking then no longer counts.`,
      error: "Something went wrong. Please try again.",
    };
  }
  return {
    paid: (sunday) => (sunday ? `Betaald. Je plek op ${sunday} staat vast.` : "Betaald. Je plek staat vast."),
    eyebrow: `Wacht, je ${credit} is nog wat waard`,
    lead: `Je hebt net ${paid} betaald voor één zondag.`,
    headline: { before: `Voor ${first} erbij krijg je ze `, accent: "allemaal", after: "." },
    stackTitle: "Dit krijg je als lid",
    rows: [
      {
        title: `Elke Sunday Social inbegrepen, in alle ${a.cities} steden`,
        detail: "4 zondagen los",
        amount: fourSundays,
      },
      { title: "Eerder boeken dan de rest", detail: "Jij boekt 2 dagen voordat een tafel opengaat", amount: null },
      {
        title: "Elke 3 maanden neem je iemand gratis mee",
        detail: "De eerste keer meteen",
        amount: single,
      },
      {
        title: `Je ${credit} van vandaag telt mee`,
        detail: "Die gaat van je eerste maand af",
        amount: `− ${credit}`,
        credit: true,
      },
    ],
    worth: { label: "Samen ter waarde van", amount: worth },
    regular: { label: "Normaal", amount: `${monthly} per maand` },
    now: { label: "Je eerste maand", amount: first, note: `Daarna ${monthly} per maand` },
    cta: `Ja, maak me lid voor ${first}`,
    busy: "Een moment…",
    terms: "Geen contract. Opzeggen kan elke maand in je instellingen.",
    decline: "Nee bedankt, ik boek liever per zondag",
    lastChance: `Let op: na dit scherm kun je hier niet meer naar terug. De ${credit} van deze boeking telt daarna niet meer mee.`,
    error: "Er ging iets mis. Probeer het nog een keer.",
  };
}

/** Shown on the confirmation page right after becoming a member. */
export function getMemberWelcomeCopy(locale: Locale): { eyebrow: string; title: string; body: string; cta: string } {
  if (locale === "en") {
    return {
      eyebrow: "You are a member",
      title: "Welcome. Every Sunday is yours now.",
      body: "Your membership has started and the confirmation is in your inbox. Log in with the email address of this booking to choose your next Sunday.",
      cta: "Choose your next Sunday",
    };
  }
  return {
    eyebrow: "Je bent lid",
    title: "Welkom. Elke zondag is nu van jou.",
    body: "Je lidmaatschap is gestart en de bevestiging staat in je mail. Log in met het e-mailadres van deze boeking om je volgende zondag te kiezen.",
    cta: "Kies je volgende zondag",
  };
}
