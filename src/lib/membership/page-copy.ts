// Membership copy, Dutch and English: the page (/jouw-tafel/lid), the
// membership choice on "Kies je zondag" and the settings group. House rules:
// short, warm, clear, no em dashes, no exclamation marks, never a venue,
// drinks are paid at the table, no invented numbers.

import type { FaqItem } from "@/lib/jouw-tafel/copy";
import { MEMBER_SEAT_CANCEL_HOURS } from "@/lib/membership/logic";
import {
  MEMBERSHIP_PLANS,
  formatPlanEuros,
  type MembershipPlanId,
} from "@/lib/membership/plans";

type Locale = "nl" | "en";

const eur = (cents: number, locale: Locale) => `€${formatPlanEuros(cents, locale)}`;

export type PlanCopy = {
  name: string;
  /** The big number: the monthly equivalent. */
  price: string;
  priceUnit: string;
  /** Under the price. */
  line: string;
  badge: string | null;
};

export type MembershipPageCopy = {
  metaTitle: string;
  metaDescription: string;
  settingsLink: string;
  hero: { title: string; sub: string; cta: string; note: string; imageAlt: string };
  benefits: { eyebrow: string; title: string; items: (guest: { single: string | null }) => { title: string; body: string }[] };
  plans: {
    eyebrow: string;
    title: string;
    radioLabel: string;
    plan: (id: MembershipPlanId) => PlanCopy;
    cta: (plan: string) => string;
    busy: string;
    single: (price: string | null) => string;
    startsNow: string;
    termsLink: string;
  };
  example: { eyebrow: string; title: string; single: (n: number) => string; member: string; note: string };
  how: { eyebrow: string; title: string; steps: { title: string; body: string }[]; imageAlt: string };
  reviews: { eyebrow: string; title: string };
  faq: { eyebrow: string; title: string; items: (guest: { single: string | null }) => FaqItem[] };
  closing: { title: string; cta: string; note: string };
  member: { title: string; body: (plan: string) => string; choose: string; settings: string };
  welcome: {
    title: string;
    body: string;
    booked: (sunday: string) => string;
    pending: string;
    choose: string;
  };
  errors: { generic: string; alreadyMember: string };
  footer: { terms: string; privacy: string };
};

function planNl(id: MembershipPlanId): PlanCopy {
  const p = MEMBERSHIP_PLANS[id];
  const monthly = eur(p.monthlyCents, "nl");
  const initial = eur(p.initialCents, "nl");
  const badge = p.badge === "popular" ? "Meest gekozen" : p.badge === "best_value" ? "Voordeligst" : null;
  if (id === "1m") return { name: "1 maand", price: monthly, priceUnit: "per maand", line: "Per maand opzegbaar", badge };
  if (id === "4m") {
    return {
      name: "4 maanden",
      price: monthly,
      priceUnit: "per maand",
      line: `${initial} voor de eerste 4 maanden, daarna ${monthly} per maand, per maand opzegbaar`,
      badge,
    };
  }
  return {
    name: "1 jaar",
    price: monthly,
    priceUnit: "per maand",
    line: `${initial} voor het eerste jaar, daarna ${monthly} per maand, per maand opzegbaar`,
    badge,
  };
}

function planEn(id: MembershipPlanId): PlanCopy {
  const p = MEMBERSHIP_PLANS[id];
  const monthly = eur(p.monthlyCents, "en");
  const initial = eur(p.initialCents, "en");
  const badge = p.badge === "popular" ? "Most chosen" : p.badge === "best_value" ? "Best value" : null;
  if (id === "1m") return { name: "1 month", price: monthly, priceUnit: "per month", line: "Cancel monthly", badge };
  if (id === "4m") {
    return {
      name: "4 months",
      price: monthly,
      priceUnit: "per month",
      line: `${initial} for the first 4 months, then ${monthly} per month, cancel monthly`,
      badge,
    };
  }
  return {
    name: "1 year",
    price: monthly,
    priceUnit: "per month",
    line: `${initial} for the first year, then ${monthly} per month, cancel monthly`,
    badge,
  };
}

const guestPricesNl = `${eur(MEMBERSHIP_PLANS["1m"].monthlyCents, "nl")}, ${eur(MEMBERSHIP_PLANS["4m"].monthlyCents, "nl")} of ${eur(MEMBERSHIP_PLANS["12m"].monthlyCents, "nl")}`;
const guestPricesEn = `${eur(MEMBERSHIP_PLANS["1m"].monthlyCents, "en")}, ${eur(MEMBERSHIP_PLANS["4m"].monthlyCents, "en")} or ${eur(MEMBERSHIP_PLANS["12m"].monthlyCents, "en")}`;

/** The lowest guest price (the monthly amount of the longest plan). */
const lowestGuestCents = Math.min(...Object.values(MEMBERSHIP_PLANS).map((p) => p.monthlyCents));
const lowestGuestNl = eur(lowestGuestCents, "nl");
const lowestGuestEn = eur(lowestGuestCents, "en");

const nl: MembershipPageCopy = {
  metaTitle: "Lid worden · MyTable",
  metaDescription: "Word lid en schuif aan bij elke Sunday Table in jouw steden.",
  settingsLink: "Instellingen",
  hero: {
    title: "Elke zondag een plek aan tafel.",
    sub: "Word lid en schuif aan bij elke Sunday Table in jouw steden.",
    cta: "Word lid",
    note: "Maandelijks opzegbaar na je eerste periode.",
    imageAlt: "Vrouwen heffen het glas aan een tafel vol wijn",
  },
  benefits: {
    eyebrow: "Lidmaatschap",
    title: "Wat je krijgt",
    items: ({ single }) => [
      { title: "Elke zondag aan tafel", body: "Schuif aan bij elke Sunday Table in jouw steden, zo vaak als je wilt." },
      { title: "Als eerste boeken", body: "Als lid boek je al 4 weken van tevoren. Dat is een paar dagen eerder dan de rest." },
      {
        title: "Iemand meenemen",
        body: `Neem iemand mee voor de ledenprijs: vanaf ${lowestGuestNl}${single ? ` in plaats van ${single}` : ""}.`,
      },
    ],
  },
  plans: {
    eyebrow: "Lidmaatschap",
    title: "Kies je lidmaatschap",
    radioLabel: "Lidmaatschap",
    plan: planNl,
    cta: (plan) => `Word lid · ${plan}`,
    busy: "Even geduld",
    single: (price) =>
      price ? `Liever één keer proberen? Een losse plek kost ${price}.` : "Liever één keer proberen? Boek dan een losse plek.",
    startsNow: "Je lidmaatschap start direct na betaling.",
    termsLink: "Voorwaarden",
  },
  example: {
    eyebrow: "Rekenvoorbeeld",
    title: "Zo vaak als je wilt",
    single: (n) => `${n} zondagen los`,
    member: "Met 4 maanden lidmaatschap",
    note: "Drankjes bestel en betaal je zelf aan tafel.",
  },
  how: {
    eyebrow: "Zo werkt het",
    title: "Hoe het werkt",
    steps: [
      { title: "Kies je lidmaatschap", body: "Je betaalt veilig online en bent meteen lid." },
      { title: "Kies je zondag", body: "Jij kunt al 48 uur eerder boeken dan niet-leden." },
      { title: "Schuif aan", body: "Waar precies, hoor je een week van tevoren." },
    ],
    imageAlt: "Gasten in gesprek aan een Sunday Table",
  },
  reviews: { eyebrow: "Aan tafel", title: "Wat gasten zeggen" },
  faq: {
    eyebrow: "Vragen",
    title: "Goed om te weten",
    items: ({ single }) => [
      {
        q: "Hoe zeg ik op?",
        a: "In je instellingen, met een paar tikken. Je bent lid tot het einde van de periode die je al hebt betaald. Daarna schrijven we niets meer af.",
      },
      {
        q: "Wat gebeurt er na mijn eerste periode?",
        a: `Dan loopt je lidmaatschap per maand door voor het maandbedrag: ${eur(MEMBERSHIP_PLANS["4m"].monthlyCents, "nl")} bij 4 maanden, ${eur(MEMBERSHIP_PLANS["12m"].monthlyCents, "nl")} bij 1 jaar. Vanaf dan zeg je per maand op. Een week voordat je eerste periode afloopt, krijg je van ons een herinnering.`,
      },
      {
        q: "Wat als ik een maand niet kan?",
        a: `Dan sla je die maand gewoon over. Heb je al een zondag geboekt, zeg je plek dan uiterlijk ${MEMBER_SEAT_CANCEL_HOURS} uur van tevoren af in je instellingen. Dan kan iemand anders aanschuiven. Had je een gast meegeboekt, dan vervalt die plek ook en krijg je wat je ervoor betaalde niet terug.`,
      },
      {
        q: "Kan ik iemand meenemen?",
        a: `Ja. Boek twee plekken: je eigen plek is inbegrepen en je gast betaalt de ledenprijs. Dat is het maandbedrag van je lidmaatschap, dus ${guestPricesNl}${single ? ` in plaats van ${single}` : ""}.`,
      },
      {
        q: "Wat als een tafel niet doorgaat?",
        a: "Dat hoor je een week van tevoren. Je kiest dan een andere zondag. Je plek blijft gewoon inbegrepen.",
      },
      {
        q: "Zijn drankjes inbegrepen?",
        a: "Nee. Je drankjes, en iets te eten als je wilt, bestel en betaal je zelf aan tafel.",
      },
      {
        q: "Wat als ik niet kom opdagen?",
        a: "De eerste keer sturen we je een vriendelijke herinnering. Kom je daarna nog eens niet zonder af te zeggen, dan kun je een maand niet boeken. Je lidmaatschap loopt in die maand gewoon door.",
      },
    ],
  },
  closing: { title: "Klaar om aan te schuiven?", cta: "Word lid", note: "Maandelijks opzegbaar na je eerste periode." },
  member: {
    title: "Je bent lid",
    body: (plan) => `Lidmaatschap: ${plan}. Elke Sunday Table in jouw steden is inbegrepen.`,
    choose: "Kies je zondag",
    settings: "Naar je instellingen",
  },
  welcome: {
    title: "Welkom als lid",
    body: "Je lidmaatschap staat klaar. In je mail vind je alles op een rij.",
    booked: (sunday) => `Je plek op ${sunday} staat vast.`,
    pending: "We verwerken je betaling. Dat duurt meestal een paar seconden.",
    choose: "Kies je zondag",
  },
  errors: {
    generic: "Dat lukte niet. Probeer het nog een keer.",
    alreadyMember: "Je bent al lid.",
  },
  footer: { terms: "Voorwaarden", privacy: "Privacy" },
};

const en: MembershipPageCopy = {
  metaTitle: "Become a member · MyTable",
  metaDescription: "Become a member and join every Sunday Table in your cities.",
  settingsLink: "Settings",
  hero: {
    title: "A seat at the table, every Sunday.",
    sub: "Become a member and join every Sunday Table in your cities.",
    cta: "Become a member",
    note: "Cancel monthly after your first period.",
    imageAlt: "Women raising their glasses at a table full of wine",
  },
  benefits: {
    eyebrow: "Membership",
    title: "What you get",
    items: ({ single }) => [
      { title: "A seat every Sunday", body: "Join every Sunday Table in your cities, as often as you like." },
      { title: "First to book", body: "As a member you can book 4 weeks ahead. That is a few days before everyone else." },
      {
        title: "Bring someone",
        body: `Bring someone at the member price: from ${lowestGuestEn}${single ? ` instead of ${single}` : ""}.`,
      },
    ],
  },
  plans: {
    eyebrow: "Membership",
    title: "Choose your membership",
    radioLabel: "Membership",
    plan: planEn,
    cta: (plan) => `Become a member · ${plan}`,
    busy: "One moment",
    single: (price) =>
      price ? `Rather try it once? A single seat is ${price}.` : "Rather try it once? Then book a single seat.",
    startsNow: "Your membership starts right after payment.",
    termsLink: "Terms",
  },
  example: {
    eyebrow: "An example",
    title: "As often as you like",
    single: (n) => `${n} Sundays, single seats`,
    member: "With the 4-month membership",
    note: "You order and pay for your own drinks at the table.",
  },
  how: {
    eyebrow: "How it works",
    title: "How it works",
    steps: [
      { title: "Choose your membership", body: "You pay safely online and are a member straight away." },
      { title: "Choose your Sunday", body: "You can book 48 hours before non-members." },
      { title: "Join the table", body: "Where exactly, you hear a week before." },
    ],
    imageAlt: "Guests talking at a Sunday Table",
  },
  reviews: { eyebrow: "At the table", title: "What guests say" },
  faq: {
    eyebrow: "Questions",
    title: "Good to know",
    items: ({ single }) => [
      {
        q: "How do I cancel?",
        a: "In your settings, in a few taps. You stay a member until the end of the period you already paid for. After that we do not charge you again.",
      },
      {
        q: "What happens after my first period?",
        a: `Your membership then continues monthly at the monthly amount: ${eur(MEMBERSHIP_PLANS["4m"].monthlyCents, "en")} for 4 months, ${eur(MEMBERSHIP_PLANS["12m"].monthlyCents, "en")} for 1 year. From then on you cancel monthly. A week before your first period ends, we send you a reminder.`,
      },
      {
        q: "What if I cannot make it for a month?",
        a: `Then you simply skip that month. Already booked a Sunday? Cancel your seat in your settings up to ${MEMBER_SEAT_CANCEL_HOURS} hours before. Then someone else can join. If you booked a guest, that seat is cancelled too and what you paid for it is not refunded.`,
      },
      {
        q: "Can I bring someone?",
        a: `Yes. Book two seats: your own seat is included and your guest pays the member price. That is the monthly amount of your membership, so ${guestPricesEn}${single ? ` instead of ${single}` : ""}.`,
      },
      {
        q: "What if a table does not go ahead?",
        a: "You hear a week before. You then choose another Sunday. Your seat stays included.",
      },
      {
        q: "Are drinks included?",
        a: "No. You order and pay for your drinks, and some food if you like, at the table.",
      },
      {
        q: "What if I do not show up?",
        a: "The first time we send you a friendly reminder. If it happens again without cancelling, you cannot book for a month. Your membership continues during that month.",
      },
    ],
  },
  closing: { title: "Ready to join the table?", cta: "Become a member", note: "Cancel monthly after your first period." },
  member: {
    title: "You are a member",
    body: (plan) => `Membership: ${plan}. Every Sunday Table in your cities is included.`,
    choose: "Choose your Sunday",
    settings: "Go to your settings",
  },
  welcome: {
    title: "Welcome, you are a member",
    body: "Your membership is ready. You will find everything in your email.",
    booked: (sunday) => `Your seat for ${sunday} is booked.`,
    pending: "We are processing your payment. This usually takes a few seconds.",
    choose: "Choose your Sunday",
  },
  errors: {
    generic: "That did not work. Please try again.",
    alreadyMember: "You are already a member.",
  },
  footer: { terms: "Terms", privacy: "Privacy" },
};

export function getMembershipPageCopy(locale: Locale): MembershipPageCopy {
  return locale === "en" ? en : nl;
}

// ---------------------------------------------------------------- kies sheet

export type MembershipKiesCopy = {
  singleTitle: string;
  singlePrice: (price: string) => string;
  memberTitle: string;
  memberFrom: (price: string) => string;
  planPickerLabel: string;
  planShort: (id: MembershipPlanId) => string;
  becomeMember: string;
  becomeMemberBusy: string;
  memberSummary: string;
  included: string;
  includedShort: string;
  guest: string;
  memberPrice: string;
  bookIncluded: string;
  booked: string;
  bookedLink: string;
  earlyLabel: (date: string) => string;
  blocked: (date: string) => string;
  pastDue: string;
  settingsLink: string;
};

export function getMembershipKiesCopy(locale: Locale): MembershipKiesCopy {
  if (locale === "en") {
    return {
      singleTitle: "Single seat",
      singlePrice: (price) => price,
      memberTitle: "Become a member",
      memberFrom: (price) => `from ${price} per month`,
      planPickerLabel: "Membership",
      planShort: (id) => (id === "1m" ? "1 month" : id === "4m" ? "4 months" : "1 year"),
      becomeMember: "Become a member and book",
      becomeMemberBusy: "One moment",
      memberSummary: "Your own seat is included.",
      included: "Included in your membership",
      includedShort: "Included",
      guest: "Guest",
      memberPrice: "member price",
      bookIncluded: "Book my seat",
      booked: "Your seat is booked. The confirmation is in your email.",
      bookedLink: "See your reservations",
      earlyLabel: (date) => `Bookable from ${date}`,
      blocked: (date) => `You can book again from ${date}.`,
      pastDue: "Your last membership payment did not go through. Update your payment details in your settings.",
      settingsLink: "Settings",
    };
  }
  return {
    singleTitle: "Losse plek",
    singlePrice: (price) => price,
    memberTitle: "Word lid",
    memberFrom: (price) => `vanaf ${price} per maand`,
    planPickerLabel: "Lidmaatschap",
    planShort: (id) => (id === "1m" ? "1 maand" : id === "4m" ? "4 maanden" : "1 jaar"),
    becomeMember: "Word lid en boek",
    becomeMemberBusy: "Even geduld",
    memberSummary: "Je eigen plek is inbegrepen.",
    included: "Inbegrepen in je lidmaatschap",
    includedShort: "Inbegrepen",
    guest: "Gast",
    memberPrice: "ledenprijs",
    bookIncluded: "Boek mijn plek",
    booked: "Je plek staat vast. De bevestiging staat in je mail.",
    bookedLink: "Bekijk je reserveringen",
    earlyLabel: (date) => `Te boeken vanaf ${date}`,
    blocked: (date) => `Je kunt weer boeken vanaf ${date}.`,
    pastDue: "Je laatste betaling voor je lidmaatschap is niet gelukt. Werk je betaalgegevens bij in je instellingen.",
    settingsLink: "Instellingen",
  };
}

// ---------------------------------------------------------------- settings

export type MembershipSettingsCopy = {
  group: string;
  join: string;
  joinValue: (price: string) => string;
  plan: string;
  planValue: (plan: string) => string;
  renews: (date: string, amount: string) => string;
  ends: (date: string) => string;
  pastDue: string;
  blocked: (date: string) => string;
  portal: string;
  portalBusy: string;
  portalFailed: string;
  note: string;
  memberSeat: string;
  memberSeatShort: string;
  cancelSeat: string;
  cancelSeatBusy: string;
  cancelSeatConfirm: (withGuest: boolean) => string;
  cancelSeatKeep: string;
  cancelSeatTitle: string;
  cancelSeatRule: string;
  /** With a paid guest seat: it is not refunded. */
  cancelSeatGuestNote: string;
  cancelSeatTooLate: string;
  cancelSeatDone: string;
  cancelSeatFailed: string;
  bookedToast: string;
  deleteMember: string;
};

export function getMembershipSettingsCopy(locale: Locale): MembershipSettingsCopy {
  const h = MEMBER_SEAT_CANCEL_HOURS;
  if (locale === "en") {
    return {
      group: "Membership",
      join: "Become a member",
      joinValue: (price) => `from ${price} per month`,
      plan: "Your membership",
      planValue: (plan) => plan,
      renews: (date, amount) => `Next payment: ${date}, ${amount}`,
      ends: (date) => `Member until ${date}`,
      pastDue: "Your last payment did not go through. Update your payment details.",
      blocked: (date) => `You can book again from ${date}.`,
      portal: "Payment details and cancelling",
      portalBusy: "Opening",
      portalFailed: "That did not work. Please try again.",
      note: "Cancelling takes effect at the end of the period you paid for.",
      memberSeat: "Included in your membership",
      memberSeatShort: "Included",
      cancelSeat: "Cancel my seat",
      cancelSeatBusy: "Cancelling",
      cancelSeatConfirm: (withGuest) =>
        withGuest ? "Yes, cancel both seats" : "Yes, cancel my seat",
      cancelSeatKeep: "Keep my seat",
      cancelSeatTitle: "Cancel your seat?",
      cancelSeatRule: `You can cancel up to ${h} hours before the start. Your seat then goes to someone else.`,
      cancelSeatGuestNote: "Your guest's seat is cancelled too. What you paid for it is not refunded.",
      cancelSeatTooLate: `Cancelling is possible up to ${h} hours before the start.`,
      cancelSeatDone: "Your seat is cancelled.",
      cancelSeatFailed: "That did not work. Please try again.",
      bookedToast: "Your seat is booked.",
      deleteMember: "Your membership ends straight away and nothing is charged after that.",
    };
  }
  return {
    group: "Lidmaatschap",
    join: "Word lid",
    joinValue: (price) => `vanaf ${price} per maand`,
    plan: "Je lidmaatschap",
    planValue: (plan) => plan,
    renews: (date, amount) => `Volgende betaling: ${date}, ${amount}`,
    ends: (date) => `Lid tot ${date}`,
    pastDue: "Je laatste betaling is niet gelukt. Werk je betaalgegevens bij.",
    blocked: (date) => `Je kunt weer boeken vanaf ${date}.`,
    portal: "Betaalgegevens en opzeggen",
    portalBusy: "Openen",
    portalFailed: "Dat lukte niet. Probeer het nog een keer.",
    note: "Opzeggen gaat in aan het einde van de periode die je hebt betaald.",
    memberSeat: "Inbegrepen in je lidmaatschap",
    memberSeatShort: "Inbegrepen",
    cancelSeat: "Plek afzeggen",
    cancelSeatBusy: "Afzeggen",
    cancelSeatConfirm: (withGuest) =>
      withGuest ? "Ja, zeg beide plekken af" : "Ja, zeg mijn plek af",
    cancelSeatKeep: "Plek houden",
    cancelSeatTitle: "Plek afzeggen?",
    cancelSeatRule: `Afzeggen kan tot ${h} uur voor de start. Je plek gaat dan naar iemand anders.`,
    cancelSeatGuestNote: "De plek van je gast vervalt ook. Wat je voor die plek hebt betaald, krijg je niet terug.",
    cancelSeatTooLate: `Afzeggen kan tot ${h} uur voor de start.`,
    cancelSeatDone: "Je plek is afgezegd.",
    cancelSeatFailed: "Dat lukte niet. Probeer het nog een keer.",
    bookedToast: "Je plek staat vast.",
    deleteMember: "Je lidmaatschap stopt dan meteen en we schrijven daarna niets meer af.",
  };
}

// ---------------------------------------------------------------- reserve step

export type MembershipReserveCopy = {
  proof: (count: number) => string;
  chooseTitle: string;
  planLabel: (id: MembershipPlanId) => string;
  save: (price: string) => string;
  /** Under the plans: what "Bespaar" is measured against. */
  saveNote: (single: string) => string;
  perMonth: string;
  total: (price: string) => string;
  guestQuestion: string;
  guestPrice: (price: string) => string;
  guestOneLeft: string;
  cta: (id: MembershipPlanId) => string;
  ctaNote: string;
  or: string;
  singleTitle: (price: string) => string;
  singleLine: (date: string, time: string) => string;
  footnote: string;
  /** Members (own seat included). */
  yourSeat: string;
  included: string;
  guest: string;
  memberPrice: string;
  today: string;
  bookIncluded: string;
  pay: string;
  busy: string;
};

export function getMembershipReserveCopy(locale: Locale): MembershipReserveCopy {
  if (locale === "en") {
    return {
      proof: (count) => `${count}+ people already signed up`,
      chooseTitle: "Choose what suits you",
      planLabel: (id) => (id === "1m" ? "1 month" : id === "4m" ? "4 months" : "1 year"),
      save: (price) => `Save ${price}`,
      saveNote: (single) => `Savings compared with a single seat of ${single}, one Sunday a month.`,
      perMonth: "per month",
      total: (price) => `${price} total`,
      guestQuestion: "Bringing someone?",
      guestPrice: (price) => `+${price} (member price)`,
      guestOneLeft: "1 seat left at this table",
      cta: (id) => (id === "1m" ? "Take the monthly plan" : id === "4m" ? "Take the 4-month plan" : "Take the yearly plan"),
      ctaNote: "Cancel anytime. After your first period, your membership continues month to month.",
      or: "or",
      singleTitle: (price) => `Single seat (${price})`,
      singleLine: (date, time) => `1x ${date}, ${time}`,
      footnote: "Food and drinks are not included, also not with a single seat. You order and pay for them yourself at the table.",
      yourSeat: "Your seat",
      included: "Included",
      guest: "Guest",
      memberPrice: "member price",
      today: "To pay today",
      bookIncluded: "Reserve, included",
      pay: "Go to payment",
      busy: "One moment",
    };
  }
  return {
    proof: (count) => `Al ${count}+ mensen aangemeld`,
    chooseTitle: "Kies wat bij je past",
    planLabel: (id) => (id === "1m" ? "1 maand" : id === "4m" ? "4 maanden" : "1 jaar"),
    save: (price) => `Bespaar ${price}`,
    saveNote: (single) => `Besparing ten opzichte van een losse plek van ${single}, bij één zondag per maand.`,
    perMonth: "per maand",
    total: (price) => `${price} totaal`,
    guestQuestion: "Neem je iemand mee?",
    guestPrice: (price) => `+${price} (ledenprijs)`,
    guestOneLeft: "Nog 1 plek aan deze tafel",
    cta: (id) => (id === "1m" ? "Neem het maandplan" : id === "4m" ? "Neem het 4-maandenplan" : "Neem het jaarplan"),
    ctaNote: "Opzeggen kan altijd. Na je eerste periode loopt je lidmaatschap per maand door.",
    or: "of",
    singleTitle: (price) => `Losse plek (${price})`,
    singleLine: (date, time) => `1x ${date}, ${time}`,
    footnote: "Eten en drinken zijn niet inbegrepen, ook niet bij een losse plek. Die bestel en betaal je zelf aan tafel.",
    yourSeat: "Jouw plek",
    included: "Inbegrepen",
    guest: "Gast",
    memberPrice: "ledenprijs",
    today: "Vandaag te betalen",
    bookIncluded: "Reserveer, inbegrepen",
    pay: "Naar betalen",
    busy: "Even geduld",
  };
}
