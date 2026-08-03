import type { MemberClubLabels } from "./member-club.types";

export const memberClubNl: MemberClubLabels = {
  meta: {
    title: "MyTable Clubmember · Sunday Table",
    description:
      "Elke eerste zondag. Nieuwe mensen. Daarna culinaire ervaringen.",
  },
  pageTitle: "Sunday Table",
  hero: {
    brand: "Clubmember",
    title: "Sunday Table",
    line: "Elke eerste zondag. Nieuwe mensen. Daarna culinaire ervaringen.",
    memberLine: "Kies je stad. Reserveer je plek.",
    cta: "Claim je plek",
  },
  tableFilter: {
    girlsOnly: "Girls only",
    mixed: "Gemengd",
  },
  languageFilter: {
    label: "Ik voel me comfortabel om te communiceren in",
    nl: "Nederlands",
    en: "English",
  },
  happening: {
    title: "Komende Sunday Tables",
    subtitle: "Hier maak je culinaire vrienden elke eerste zondag van de maand.",
    eventTitle: "Sunday Table",
    status: "Early access",
    empty: "Geen tafels voor deze filter. Kies een andere stad.",
    filterCities: "Steden",
    filterTables: "Tafel",
    seatsLeft: "{count} plekken over",
    comingSoon: "Binnenkort",
  },
  explain: {
    closeAria: "Sluiten",
    cta: "Claim je plek",
    locationNote: "De exacte locatie ontvang je 24 uur van tevoren.",
    mixed: {
      title: "Sunday Table",
      body: "Sunday Table is om nieuwe mensen te ontmoeten. Met hen boek je later culinaire ervaringen uit de agenda. Drankjes en hapjes betaal je op locatie. Die zijn niet inbegrepen.",
    },
    girlsOnly: {
      title: "Sunday Table · Girls only",
      body: "Alleen vrouwen aan tafel. Sunday Table is om nieuwe mensen te ontmoeten. Met hen boek je later culinaire ervaringen uit de agenda. Drankjes en hapjes betaal je op locatie. Die zijn niet inbegrepen.",
    },
  },
  paywall: {
    closeAria: "Sluiten",
    eyebrow: "Clubmember",
    headline: "Elke eerste zondag. Nieuwe mensen. Culinaire plannen.",
    eventLine: "{city} · {date} · {time}",
    perksTitle: "Clubmember",
    perks: [
      {
        title: "Sunday Table",
        body: "Elke eerste zondag van de maand.",
      },
      {
        title: "Nieuwe mensen",
        body: "Wij matchen je aan tafel. Solo welkom, of neem een +1 mee.",
      },
      {
        title: "Culinaire vrienden",
        body: "Boek daarna iets met je nieuwe groep. Leden krijgen 10% korting.",
      },
    ],
    consumptionsNote:
      "Bij Sunday Table betaal je drankjes en hapjes op locatie. Die zijn niet inbegrepen. Culinaire ervaringen uit de agenda zijn all-in: eten en drinken inbegrepen.",
    plansTitle: "Kies je plan",
    popular: "Meest gekozen",
    save: "Bespaar {percent}",
    perMonth: "{price}/maand",
    legal:
      "De trialmaand is een eenmalige betaling en verlengt niet. De plannen van 5 en 12 maanden verlengen automatisch tot je opzegt.",
    continue: "Betalen en lid worden",
    summary: "{price}/maand",
    successTitle: "Je zit erbij",
    successBody:
      "Je Clubmember-toegang is actief en je Sunday Table-plek staat vast. Hieronder kun je nog een +1 toevoegen of afmelden voor die tafel.",
    successCta: "Terug naar Sunday Table",
    errorGeneric: "Er ging iets mis. Probeer het opnieuw.",
    plans: [
      {
        id: "1m",
        label: "1 maand trial",
        price: "€21",
        perMonth: "€21",
        hint: "Eenmalig. Verlengt niet.",
      },
      {
        id: "5m",
        label: "5 maanden",
        price: "€50",
        compareAt: "€105",
        perMonth: "€10",
        savePercent: "52%",
      },
      {
        id: "12m",
        label: "12 maanden",
        price: "€100",
        compareAt: "€252",
        perMonth: "€8,33",
        savePercent: "60%",
      },
    ],
  },
  membership: {
    eyebrow: "Lidmaatschap",
    titleActive: "Je Clubmember-plan is actief",
    titleInactive: "Nog geen actief Clubmember-plan",
    planLabel: "Plan: {plan}",
    renews: "Verlengt op {date}",
    cancelScheduled: "Loopt af op {date}",
    manageBilling: "Betaling beheren",
    changePlan: "Plan wijzigen",
    upgradeTo12m: "Upgrade naar 12 maanden",
    upgradeScheduled: "Upgrade ingepland. Die gaat in op {date}.",
    upgradePending: "Upgrade naar 12 maanden vanaf {date}",
    changePlanBusy: "Bezig…",
    changePlanSuccess: "Je plan is bijgewerkt.",
    checkoutSuccess: "Betaling gelukt. Welkom bij Clubmember.",
    checkoutCancel: "Checkout geannuleerd. Je plek is nog niet bevestigd.",
  },
  checkoutOutcome: {
    confirmedTitle: "Je bent Clubmember",
    confirmedBody:
      "Je abonnement is actief en je Sunday Table-plek staat vast. Op je clubpagina kun je nog een +1 toevoegen of je afmelden voor die tafel.",
    confirmedCta: "Naar Sunday Table",
    calendarCta: "Zet in je agenda",
    cancelledTitle: "Checkout geannuleerd",
    cancelledBody:
      "Er is niets afgeschreven. Je kunt later opnieuw een plan kiezen. Bij een geweigerde kaart blijf je op de Stripe-pagina en kun je een andere betaalmethode proberen.",
    cancelledCta: "Terug naar Sunday Table",
    pendingTitle: "Betaling wordt bevestigd",
    pendingBody:
      "We wachten nog op bevestiging van Stripe. Vernieuw zo, of open Sunday Table. Je lidmaatschap verschijnt zodra de betaling binnen is.",
  },
  rsvp: {
    title: "Jouw Sunday Tables",
    subtitle:
      "Neem een +1 mee of meld je af als je niet kunt. Je abonnement blijft actief.",
    empty: "Nog geen Sunday Table-RSVP. Kies hierboven een tafel.",
    confirmed: "Je gaat",
    cancelled: "Afgemeld",
    pending: "Wacht op betaling",
    plusOne: "+1",
    plusOneHint: "Telt als tweede plek. Geen extra kosten.",
    cancelGoing: "Ik kan niet",
    reactivate: "Reserveer je plek",
    bookSeat: "Reserveer je plek",
    viewTable: "Bekijk tafel",
    girlsOnly: "Girls only",
    mixed: "Mixed",
    signupOpen: "Aanmelden vóór {deadline}",
    signupUrgent: "Aanmelden vóór {deadline}",
    signupClosed: "Inschrijving gesloten",
    signupClosedError: "Inschrijving is gesloten (deadline was vrijdag 16:00 vóór de tafel).",
    onboardingRequired:
      "Rond eerst je profiel af (naam, leeftijd en geslacht) om een tafel te reserveren.",
    girlsOnlyRestricted: "Girls only-tafels zijn alleen voor vrouwen.",
    soldOut: "Vol",
    confirmDismiss: "Annuleren",
    confirmPlusOneAddTitle: "Plus 1 meenemen?",
    confirmPlusOneAddBody:
      "Je reserveert een tweede plek aan tafel. Geen extra kosten. We mailen je een bevestiging.",
    confirmPlusOneAddCta: "Ja, +1 toevoegen",
    confirmPlusOneRemoveTitle: "+1 verwijderen?",
    confirmPlusOneRemoveBody:
      "Je tweede plek komt vrij. Jouw eigen RSVP blijft staan.",
    confirmPlusOneRemoveCta: "Ja, +1 verwijderen",
    confirmReplaceSeatTitle: "Andere tafel kiezen?",
    confirmReplaceSeatBody:
      "Je hebt al een plek op {fromTable} in {fromCity}. Als je doorgaat, vervalt die RSVP en reserveer je {toTable} in {toCity}.",
    confirmReplaceSeatCta: "Ja, wissel van tafel",
    confirmReserveTitle: "Plek reserveren?",
    confirmReserveBody:
      "Je reserveert je Sunday Table-plek. Je kunt later nog een +1 toevoegen of je afmelden.",
    confirmReserveCta: "Ja, reserveer",
    confirmCancelGoingTitle: "Afmelden voor deze tafel?",
    confirmCancelGoingBody:
      "Je plek komt vrij voor iemand anders. Je abonnement blijft actief.",
    confirmCancelGoingCta: "Ja, ik kan niet",
  },
  invite: {
    eyebrow: "Uitnodigen",
    title: "Nodig iemand uit voor MyTable",
    body: "Deel je link. Zo ontdekken zij Sunday Table en culinaire ervaringen via jou.",
    copyLink: "Kopieer link",
    copied: "Gekopieerd",
  },
  benefits: {
    eyebrow: "Het aanbod",
    title: "Clubmember",
    subtitle: "Duidelijk. Geen kleine lettertjes.",
    items: [
      {
        title: "Sunday Table",
        body: "Elke eerste zondag van de maand.",
      },
      {
        title: "Nieuwe mensen",
        body: "Wij matchen je aan tafel. Solo welkom, of neem een +1 mee.",
      },
      {
        title: "Culinaire vrienden",
        body: "Boek daarna iets met je nieuwe groep. Leden krijgen 10% korting.",
      },
    ],
    note: "Bij Sunday Table betaal je drankjes en hapjes op locatie. Die zijn niet inbegrepen. Culinaire ervaringen uit de agenda zijn all-in: eten en drinken inbegrepen.",
  },
  roadmap: {
    eyebrow: "Later",
    title: "Op de planning",
    subtitle: "Komt later.",
    items: [
      "Partnerkortingen",
      "Meer steden",
      "Samen doorplannen naar Wine Walks",
    ],
  },
  faq: {
    eyebrow: "Vragen",
    title: "Veelgestelde vragen",
    items: [
      {
        question: "Wat is Sunday Table?",
        answer:
          "Sunday Table is om nieuwe mensen te ontmoeten. Met hen boek je later culinaire ervaringen uit de agenda. Drankjes en hapjes betaal je op locatie. Die zijn niet inbegrepen.",
      },
      {
        question: "Wat zit er in Clubmember?",
        answer:
          "Sunday Tables en 10% op culinaire ervaringen. Bij Sunday Table betaal je drankjes en hapjes op locatie. Die zijn niet inbegrepen. Culinaire ervaringen uit de agenda zijn all-in: eten en drinken inbegrepen.",
      },
      {
        question: "Wat kost Clubmember?",
        answer:
          "1 maand trial €21 (eenmalig, verlengt niet). Of 5 maanden €50 (€10/maand). Of 12 maanden €100 (€8,33/maand). De langere plannen verlengen automatisch tot je opzegt.",
      },
      {
        question: "Betaal ik apart voor drank en hapjes?",
        answer:
          "Ja. Bij Sunday Table betaal je drankjes en hapjes op locatie. Die zijn niet inbegrepen. Culinaire ervaringen uit de agenda zijn all-in: eten en drinken inbegrepen.",
      },
      {
        question: "Is Sunday Table dating?",
        answer: "Nee. Nieuwe mensen. Geen datingagenda.",
      },
      {
        question: "Kan ik solo komen?",
        answer: "Ja. Solo is standaard.",
      },
      {
        question: "Girls only of gemengd?",
        answer: "Girls only: alleen vrouwen. Gemengd: iedereen. Jij kiest.",
      },
      {
        question: "Kan ik stopzetten?",
        answer:
          "De trialmaand stopt vanzelf. Bij 5 of 12 maanden stop je via Betaling beheren. Een Sunday Table-RSVP kun je apart afzeggen.",
      },
    ],
  },
};
