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
  /** The city of the Sunday that was just booked, if known. */
  city?: string | null;
};

export type OfferRow = { title: string; detail: string; amount: string | null };

export type MembershipOfferCopy = {
  paid: (sunday: string | null) => string;
  headline: { before: string; accent: string };
  lead: string;
  stackTitle: string;
  rows: OfferRow[];
  /** In front of every amount in the list: it is what the part is worth,
   * not something that is charged. */
  worthPrefix: string;
  worth: { label: string; amount: string };
  /** What is paid today, on top of the seat already paid for, and after. */
  price: { label: string; amount: string; extra: string; credited: string; after: string };
  cta: string;
  busy: string;
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
      // Honest about where the other Sundays are: each city has one
      // Sunday Social every 4 weeks, so more Sundays means other cities.
      headline: { before: `For ${first} extra: every Sunday Social, in `, accent: `all ${a.cities} cities` },
      lead: `You just paid ${paid} for one Sunday${a.city ? ` in ${a.city}` : ""}. Upgrade for ${first} extra and this month you can also join in the other cities.`,
      stackTitle: "What you get as a member",
      rows: [
        {
          title: `Every Sunday Social included, in all ${a.cities} cities`,
          detail: `4 Sunday Socials at ${single} each. You book while there are seats.`,
          amount: fourSundays,
        },
        { title: "Book before everyone else", detail: "You book 2 days before a table opens", amount: null },
        {
          title: "Bring someone for free every 3 months",
          detail: "The first time straight away",
          amount: single,
        },
      ],
      worthPrefix: "worth",
      worth: { label: "Total value of your membership", amount: worth },
      price: {
        label: "Today you pay",
        amount: first,
        extra: "extra",
        credited: `Your ${credit} ticket is taken off.`,
        after: `Then ${monthly} per month. Cancel monthly.`,
      },
      cta: `Yes, upgrade my ticket for ${first}`,
      busy: "One moment…",
      decline: "No, I will stick to this Sunday",
      lastChance: `Please note: after this screen you cannot come back here. The ${credit} of this booking then no longer counts.`,
      error: "Something went wrong. Please try again.",
    };
  }
  return {
    paid: (sunday) => (sunday ? `Betaald. Je plek op ${sunday} staat vast.` : "Betaald. Je plek staat vast."),
    headline: { before: `Voor ${first} extra: elke Sunday Social, in `, accent: `alle ${a.cities} steden` },
    lead: `Je hebt net ${paid} betaald voor één zondag${a.city ? ` in ${a.city}` : ""}. Upgrade voor ${first} extra en schuif deze maand ook aan in de andere steden.`,
    stackTitle: "Dit krijg je als lid",
    rows: [
      {
        title: `Elke Sunday Social inbegrepen, in alle ${a.cities} steden`,
        detail: `4 Sunday Socials à ${single}. Je boekt zolang er plek is.`,
        amount: fourSundays,
      },
      { title: "Eerder boeken dan de rest", detail: "Jij boekt 2 dagen voordat een tafel opengaat", amount: null },
      {
        title: "Elke 3 maanden neem je iemand gratis mee",
        detail: "De eerste keer meteen",
        amount: single,
      },
    ],
    worthPrefix: "t.w.v.",
    worth: { label: "Totale waarde van je lidmaatschap", amount: worth },
    price: {
      label: "Vandaag betaal je",
      amount: first,
      extra: "extra",
      credited: `Je ticket van ${credit} is verrekend.`,
      after: `Daarna ${monthly} per maand. Maandelijks opzegbaar.`,
    },
    cta: `Ja, upgrade mijn ticket voor ${first}`,
    busy: "Een moment…",
    decline: "Nee, ik hou het bij deze zondag",
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
