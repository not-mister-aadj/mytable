// Words for the membership mails, Dutch and English. House rules: short,
// warm, no em dashes, no exclamation marks, never a venue, drinks are paid
// at the table.

import type { MembershipEmailProps } from "@/emails/MembershipEmail";
import { formatPlanEuros, getMembershipPlan, type MembershipPlanId } from "@/lib/membership/plans";
import { MEMBER_SEAT_CANCEL_HOURS } from "@/lib/membership/logic";

type Locale = "nl" | "en";
const AMSTERDAM = "Europe/Amsterdam";

/** "4 februari 2027" / "4 February 2027". */
export function mailDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", {
    timeZone: AMSTERDAM,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** "zondag 25 oktober" / "Sunday 25 October". */
export function mailSunday(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", {
    timeZone: AMSTERDAM,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function greeting(locale: Locale, firstName?: string | null): string {
  const name = firstName?.trim();
  if (locale === "en") return name ? `Hi ${name},` : "Hi,";
  return name ? `Hoi ${name},` : "Hoi,";
}

export function planName(plan: MembershipPlanId, locale: Locale): string {
  if (locale === "en") return plan === "1m" ? "1 month" : plan === "4m" ? "4 months" : "1 year";
  return plan === "1m" ? "1 maand" : plan === "4m" ? "4 maanden" : "1 jaar";
}

/** "€36 voor de eerste 4 maanden, daarna €9 per maand" etc. */
export function planPriceLine(plan: MembershipPlanId, locale: Locale): string {
  const p = getMembershipPlan(plan);
  const monthly = `€${formatPlanEuros(p.monthlyCents, locale)}`;
  const initial = `€${formatPlanEuros(p.initialCents, locale)}`;
  if (locale === "en") {
    if (plan === "1m") return `${monthly} per month, cancel monthly`;
    if (plan === "4m") return `${initial} for the first 4 months, then ${monthly} per month, cancel monthly`;
    return `${initial} for the first year, then ${monthly} per month, cancel monthly`;
  }
  if (plan === "1m") return `${monthly} per maand, per maand opzegbaar`;
  if (plan === "4m") return `${initial} voor de eerste 4 maanden, daarna ${monthly} per maand, per maand opzegbaar`;
  return `${initial} voor het eerste jaar, daarna ${monthly} per maand, per maand opzegbaar`;
}

type Links = { kies: string; settings: string };

export type MembershipMail = { subject: string; props: MembershipEmailProps };

export function welcomeMail(input: {
  locale: Locale;
  firstName?: string | null;
  plan: MembershipPlanId;
  bookedSunday?: Date | null;
  links: Links;
}): MembershipMail {
  const { locale: l, plan } = input;
  const guest = `€${formatPlanEuros(getMembershipPlan(plan).monthlyCents, l)}`;
  const en = l === "en";
  const booked = input.bookedSunday ? mailSunday(input.bookedSunday, l) : null;
  return {
    subject: en ? "Welcome, you are a member" : "Welkom als lid",
    props: {
      locale: l,
      preview: en ? "Every Sunday Table in your cities is now included." : "Elke Sunday Table in jouw steden is nu inbegrepen.",
      greeting: greeting(l, input.firstName),
      headline: en ? "Welcome, you are a member" : "Welkom als lid",
      body: en
        ? "Lovely to have you. From now on you can join every Sunday Table in your cities."
        : "Fijn dat je erbij bent. Vanaf nu schuif je aan bij elke Sunday Table in jouw steden.",
      warmLine: booked
        ? en
          ? `Your seat for ${booked} is booked. The confirmation follows in a separate email.`
          : `Je plek op ${booked} staat vast. De bevestiging krijg je in een aparte mail.`
        : undefined,
      details: {
        label: en ? "Your membership" : "Je lidmaatschap",
        lines: [planName(plan, l), planPriceLine(plan, l)],
      },
      infoHeading: en ? "What you get" : "Wat je krijgt",
      items: [
        {
          icon: "calendar",
          title: en ? "Every Sunday Table" : "Elke Sunday Table",
          description: en ? "Every Sunday in your cities, as often as you like." : "Alle zondagen in jouw steden, zo vaak als je wilt.",
        },
        {
          icon: "clock",
          title: en ? "Book earlier" : "Eerder boeken",
          description: en
            ? "You book 48 hours before non-members. So you are sure of your seat."
            : "Je boekt 48 uur eerder dan niet-leden. Zo ben je zeker van je plek.",
        },
        {
          icon: "people",
          title: en ? "Bring someone" : "Iemand meenemen",
          description: en ? `Your guest pays the member price: ${guest}.` : `Je gast betaalt de ledenprijs: ${guest}.`,
        },
        {
          icon: "wineGlasses",
          title: en ? "Drinks at the table" : "Drankjes aan tafel",
          description: en ? "You order and pay for your own drinks at the table." : "Je drankjes bestel en betaal je zelf aan tafel.",
        },
      ],
      cta: {
        href: input.links.kies,
        label: en ? "Choose your Sunday →" : "Kies je zondag →",
        helperText: en ? "See which tables are open for you." : "Bekijk welke tafels er voor je klaarstaan.",
      },
      note: en
        ? "You can cancel any time in your settings."
        : "Opzeggen kan altijd in je instellingen.",
    },
  };
}

export function reminderMail(input: {
  locale: Locale;
  firstName?: string | null;
  plan: MembershipPlanId;
  from: Date;
  links: Links;
}): MembershipMail {
  const { locale: l } = input;
  const en = l === "en";
  const date = mailDate(input.from, l);
  const amount = `€${formatPlanEuros(getMembershipPlan(input.plan).monthlyCents, l)}`;
  return {
    subject: en ? "Your membership continues monthly soon" : "Je lidmaatschap loopt straks per maand door",
    props: {
      locale: l,
      preview: en ? `From ${date} your membership continues at ${amount} per month.` : `Vanaf ${date} loopt je lidmaatschap door voor ${amount} per maand.`,
      greeting: greeting(l, input.firstName),
      headline: en ? "Your first period ends soon" : "Je eerste periode loopt bijna af",
      body: en
        ? `Your membership continues monthly from ${date} at ${amount}. You can cancel any time in your settings.`
        : `Je lidmaatschap loopt vanaf ${date} per maand door voor ${amount}. Opzeggen kan altijd in je instellingen.`,
      cta: {
        href: input.links.settings,
        label: en ? "Go to your settings →" : "Naar je instellingen →",
        helperText: en ? "Want to keep going? Then you need to do nothing." : "Wil je blijven? Dan hoef je niets te doen.",
      },
    },
  };
}

export function cancelledMail(input: {
  locale: Locale;
  firstName?: string | null;
  until: Date;
  links: Links;
}): MembershipMail {
  const { locale: l } = input;
  const en = l === "en";
  const date = mailDate(input.until, l);
  return {
    subject: en ? "Cancellation confirmed" : "Opzegging bevestigd",
    props: {
      locale: l,
      preview: en ? `You are a member until ${date}.` : `Je bent lid tot ${date}.`,
      greeting: greeting(l, input.firstName),
      headline: en ? "Cancellation confirmed" : "Opzegging bevestigd",
      body: en
        ? `You are a member until ${date}. Until then you simply book your Sundays. After that we will not charge you again.`
        : `Je bent lid tot ${date}. Tot die tijd boek je gewoon je zondagen. Daarna schrijven we niets meer af.`,
      warmLine: en ? "Changed your mind? You can undo it in your settings." : "Toch van gedachten veranderd? In je instellingen draai je het terug.",
      cta: {
        href: input.links.kies,
        label: en ? "Choose your Sunday →" : "Kies je zondag →",
        helperText: en ? `Tables until ${date} are still included.` : `Tafels tot ${date} zijn nog inbegrepen.`,
      },
    },
  };
}

export function noShowWarningMail(input: {
  locale: Locale;
  firstName?: string | null;
  sunday: Date;
  links: Links;
}): MembershipMail {
  const { locale: l } = input;
  const en = l === "en";
  const day = mailSunday(input.sunday, l);
  return {
    subject: en ? "We missed you at the table" : "We hebben je gemist aan tafel",
    props: {
      locale: l,
      preview: en ? `You were not there on ${day}.` : `Je was er ${day} niet bij.`,
      greeting: greeting(l, input.firstName),
      headline: en ? "We missed you" : "We hebben je gemist",
      body: en
        ? `You were not at the table on ${day}. That can happen. If you cannot make it, cancel your seat in your settings up to ${MEMBER_SEAT_CANCEL_HOURS} hours before. Then someone else can join.`
        : `Je was er ${day} niet bij. Dat kan gebeuren. Kun je een keer niet, zeg je plek dan uiterlijk ${MEMBER_SEAT_CANCEL_HOURS} uur van tevoren af in je instellingen. Dan kan iemand anders aanschuiven.`,
      warmLine: en
        ? "If it happens again without cancelling, you cannot book for a month. Your membership continues as usual."
        : "Gebeurt het nog een keer zonder afzeggen, dan kun je een maand niet boeken. Je lidmaatschap loopt dan gewoon door.",
      cta: {
        href: input.links.settings,
        label: en ? "Your reservations →" : "Je reserveringen →",
        helperText: en ? "Cancel a seat here when you cannot make it." : "Hier zeg je een plek af als je niet kunt.",
      },
    },
  };
}

export function noShowBlockedMail(input: {
  locale: Locale;
  firstName?: string | null;
  sunday: Date;
  until: Date;
  links: Links;
}): MembershipMail {
  const { locale: l } = input;
  const en = l === "en";
  const day = mailSunday(input.sunday, l);
  const until = mailDate(input.until, l);
  return {
    subject: en ? `You can book again from ${until}` : `Vanaf ${until} kun je weer boeken`,
    props: {
      locale: l,
      preview: en ? `You can book again from ${until}.` : `Vanaf ${until} kun je weer boeken.`,
      greeting: greeting(l, input.firstName),
      headline: en ? "A month off from booking" : "Een maand niet boeken",
      body: en
        ? `You were not at the table on ${day}, and it was not the first time. So for a month you cannot book a table. From ${until} you can book again.`
        : `Je was er ${day} niet bij, en het was niet de eerste keer. Daarom kun je een maand geen tafel boeken. Vanaf ${until} kun je weer boeken.`,
      warmLine: en ? "Your membership continues as usual." : "Je lidmaatschap loopt gewoon door.",
      note: en
        ? `Cannot make it next time? Cancel your seat in your settings up to ${MEMBER_SEAT_CANCEL_HOURS} hours before.`
        : `Kun je een volgende keer niet? Zeg je plek dan uiterlijk ${MEMBER_SEAT_CANCEL_HOURS} uur van tevoren af in je instellingen.`,
    },
  };
}

/** For people on a table's "Houd me op de hoogte" list: the members-only
 * window is over and they can book. Never names a venue. */
export function openForEveryoneMail(input: {
  locale: Locale;
  city: string;
  sunday: Date;
  links: Links;
}): MembershipMail {
  const { locale: l } = input;
  const en = l === "en";
  const day = mailSunday(input.sunday, l);
  return {
    subject: en ? `You can book now: Sunday Table ${input.city}` : `Je kunt nu boeken: Sunday Table ${input.city}`,
    props: {
      locale: l,
      preview: en ? `The table of ${day} is open for you.` : `De tafel van ${day} staat voor je open.`,
      greeting: greeting(l, null),
      headline: en ? "You can book now" : "Je kunt nu boeken",
      body: en
        ? `The Sunday Table of ${day} in ${input.city} is now open for everyone. Seats are limited.`
        : `De Sunday Table van ${day} in ${input.city} is nu voor iedereen open. De plekken zijn beperkt.`,
      cta: {
        href: input.links.kies,
        label: en ? "Choose your Sunday →" : "Kies je zondag →",
        helperText: en ? "Where exactly, you hear a week before." : "Waar precies, hoor je een week van tevoren.",
      },
    },
  };
}
