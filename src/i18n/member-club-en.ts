import type { MemberClubLabels } from "./member-club.types";

export const memberClubEn: MemberClubLabels = {
  meta: {
    title: "MyTable Clubmember · Sunday Table",
    description:
      "Every first Sunday. New people. Then culinary experiences.",
  },
  pageTitle: "Sunday Table",
  hero: {
    brand: "Clubmember",
    title: "Upcoming Sunday Tables",
    line: "This is where you make culinary friends every first Sunday of the month.",
    memberLine:
      "This is where you make culinary friends every first Sunday of the month.",
    cta: "Claim your seat",
    secondaryCta: "What is Clubmember",
  },
  tableFilter: {
    girlsOnly: "Girls only",
    mixed: "Mixed table",
  },
  languageFilter: {
    label: "I feel comfortable communicating in",
    nl: "Dutch",
    en: "English",
    both: "Both",
  },
  happening: {
    title: "Upcoming Sunday Tables",
    subtitle: "",
    eventTitle: "Sunday Table",
    status: "Early access",
    empty: "No tables for this filter. Try another city.",
    filterCities: "Cities",
    filterTables: "Table",
    seatsGoingFast: "6–10 seats going fast",
    seatsLeftFew: "Only {count} seats left",
    comingSoon: "Coming soon",
  },
  explain: {
    closeAria: "Close",
    cta: "Claim your seat",
    locationNote: "You’ll get the exact location 24 hours beforehand.",
    mixed: {
      title: "Sunday Table",
      body: "Sunday Table is for meeting new people. Your first drink is on us. At some locations we have MyTable recommendations and discounts.",
    },
    girlsOnly: {
      title: "Sunday Table · Girls only",
      body: "Women only at the table. Sunday Table is for meeting new people. Your first drink is on us. At some locations we have MyTable recommendations and discounts.",
    },
  },
  paywall: {
    closeAria: "Close",
    eyebrow: "Clubmember",
    headline: "Every first Sunday. New people. Culinary plans.",
    eventLine: "{city} · {date} · {time}",
    perksTitle: "Clubmember",
    perks: [
      {
        title: "New people",
        body: "Every first Sunday at a table with faces you don’t know yet.",
      },
      {
        title: "First drink & specials",
        body: "Your first drink is on us. Bar recommendations, sometimes with a discount.",
      },
      {
        title: "Culinary friends",
        body: "Then book something with your new group. Members get 10% off.",
      },
    ],
    consumptionsNote:
      "Your first drink is on us. Further drinks and bites you pay for on location. Culinary experiences from the agenda are all-in.",
    plansTitle: "Choose your plan",
    popular: "Most chosen",
    save: "Save {percent}",
    perMonth: "{price}/month",
    legal:
      "The trial month is a one-time payment and does not renew. The 5- and 12-month plans auto-renew until you cancel.",
    continue: "Pay and join",
    summary: "{price}/month",
    successTitle: "You're in",
    successBody:
      "Your Clubmember access is active and your Sunday Table seat is confirmed. You can still add a +1 or cancel that table below.",
    successCta: "Back to Sunday Table",
    errorGeneric: "Something went wrong. Please try again.",
    plans: [
      {
        id: "1m",
        label: "1 month trial",
        price: "€21",
        perMonth: "€21",
        hint: "One-time. Does not renew.",
      },
      {
        id: "5m",
        label: "5 months",
        price: "€50",
        compareAt: "€105",
        perMonth: "€10",
        savePercent: "52%",
      },
      {
        id: "12m",
        label: "12 months",
        price: "€100",
        compareAt: "€252",
        perMonth: "€8.33",
        savePercent: "60%",
      },
    ],
  },
  membership: {
    eyebrow: "Membership",
    titleActive: "Your Clubmember plan is active",
    titleInactive: "No active Clubmember plan yet",
    planLabel: "Plan: {plan}",
    renews: "Renews {date}",
    cancelScheduled: "Ends on {date}",
    manageBilling: "Manage billing",
    changePlan: "Change plan",
    upgradeTo12m: "Upgrade to 12 months",
    upgradeScheduled: "Upgrade scheduled. It starts on {date}.",
    upgradePending: "Upgrades to 12 months on {date}",
    changePlanBusy: "Updating…",
    changePlanSuccess: "Your plan was updated.",
    checkoutSuccess: "Payment received. Welcome to Clubmember.",
    checkoutCancel: "Checkout cancelled. Your seat is not confirmed yet.",
  },
  checkoutOutcome: {
    confirmedTitle: "You're a Clubmember",
    confirmedBody:
      "Your subscription is active and your Sunday Table seat is confirmed. On your club page you can still add a +1 or cancel that table.",
    confirmedCta: "Go to Sunday Table",
    calendarCta: "Add to calendar",
    cancelledTitle: "Checkout cancelled",
    cancelledBody:
      "Nothing was charged. You can choose a plan again later. If a card was declined, you stay on the Stripe page and can try another payment method.",
    cancelledCta: "Back to Sunday Table",
    pendingTitle: "Payment is confirming",
    pendingBody:
      "We’re still waiting for Stripe confirmation. Refresh shortly, or open Sunday Table. Your membership appears once payment lands.",
  },
  rsvp: {
    title: "Your Sunday Tables",
    subtitle:
      "Bring a +1 or cancel if you can’t make it. Your membership stays active.",
    empty: "No Sunday Table RSVP yet. Pick a table above.",
    confirmed: "You're going",
    cancelled: "Cancelled",
    pending: "Awaiting payment",
    plusOne: "+1",
    plusOneHint: "Counts as a second seat. No extra cost.",
    cancelGoing: "I can't make it",
    reactivate: "Reserve your seat",
    bookSeat: "Reserve your seat",
    viewTable: "View table",
    girlsOnly: "Girls only",
    mixed: "Mixed",
    signupOpen: "Sign up before {deadline}",
    signupUrgent: "Sign up before {deadline}",
    signupClosed: "Signup closed",
    signupClosedError: "Signup is closed (deadline was Friday 4pm before the table).",
    onboardingRequired:
      "Finish your profile first (name, age and gender) to reserve a table.",
    girlsOnlyRestricted: "Girls-only tables are for women only.",
    soldOut: "Sold out",
    confirmDismiss: "Cancel",
    confirmPlusOneAddTitle: "Bring a +1?",
    confirmPlusOneAddBody:
      "You reserve a second seat at the table. No extra cost. We will email you a confirmation.",
    confirmPlusOneAddCta: "Yes, add +1",
    confirmPlusOneRemoveTitle: "Remove +1?",
    confirmPlusOneRemoveBody:
      "Your second seat is released. Your own RSVP stays.",
    confirmPlusOneRemoveCta: "Yes, remove +1",
    confirmReplaceSeatTitle: "Switch tables?",
    confirmReplaceSeatBody:
      "You already have a seat at {fromTable} in {fromCity}. If you continue, that RSVP is released and you reserve {toTable} in {toCity}.",
    confirmReplaceSeatCta: "Yes, switch tables",
    confirmReserveTitle: "Reserve your seat?",
    confirmReserveBody:
      "You reserve your Sunday Table seat. You can still add a +1 or cancel later.",
    confirmReserveCta: "Yes, reserve",
    confirmCancelGoingTitle: "Cancel this table?",
    confirmCancelGoingBody:
      "Your seat opens up for someone else. Your membership stays active.",
    confirmCancelGoingCta: "Yes, I can't make it",
  },
  invite: {
    eyebrow: "Invite",
    title: "Invite someone to MyTable",
    body: "Share your link. They discover Sunday Table and culinary experiences through you.",
    copyLink: "Copy link",
    copied: "Copied",
  },
  benefits: {
    eyebrow: "The offer",
    title: "What you get",
    subtitle: "Clear. No fine print.",
    items: [
      {
        title: "New people",
        body: "Every first Sunday at a table with faces you don’t know yet.",
      },
      {
        title: "First drink & specials",
        body: "Your first drink is on us. Bar recommendations, sometimes with a discount.",
      },
      {
        title: "Culinary friends",
        body: "Then book something with your new group. Members get 10% off.",
      },
    ],
    note: "Your first drink is on us. Further drinks and bites you pay for on location. Culinary experiences from the agenda are all-in.",
  },
  roadmap: {
    eyebrow: "Later",
    title: "On the roadmap",
    subtitle: "Coming later.",
    items: [
      "Partner discounts",
      "More cities",
      "Easier Wine Walk plans with your table",
    ],
  },
  faq: {
    eyebrow: "Questions",
    title: "FAQ",
    items: [
      {
        question: "What is Sunday Table?",
        answer:
          "Sunday Table is for meeting new people. Your first drink is on us. Later you book culinary experiences from the agenda together.",
      },
      {
        question: "What’s in Clubmember?",
        answer:
          "Sunday Tables, your first drink on us, MyTable specials at the bar, and 10% off culinary experiences. Culinary experiences from the agenda are all-in.",
      },
      {
        question: "What does Clubmember cost?",
        answer:
          "1 month trial €21 (one-time, does not renew). Or 5 months €50 (€10/month). Or 12 months €100 (€8.33/month). Longer plans auto-renew until you cancel.",
      },
      {
        question: "What’s included at the bar?",
        answer:
          "Your first drink is on us. The bar has MyTable specials, sometimes with a discount. Further drinks and bites you pay for on location.",
      },
      {
        question: "Is Sunday Table dating?",
        answer: "No. New people. No dating agenda.",
      },
      {
        question: "Can I come solo?",
        answer: "Yes. Solo is the default.",
      },
      {
        question: "Girls only or mixed?",
        answer: "Girls only: women only. Mixed: everyone. You choose.",
      },
      {
        question: "Can I cancel?",
        answer:
          "The trial month ends on its own. For 5- or 12-month plans, stop via Manage billing. You can cancel a Sunday Table RSVP separately.",
      },
    ],
  },
};
