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
  happening: {
    title: "Komende Sunday Tables",
    subtitle: "Hier maak je culinaire vrienden.",
    eventTitle: "Sunday Table",
    status: "Early access",
    empty: "Geen tafels voor deze filter. Kies een andere stad.",
    filterCities: "Steden",
    filterTables: "Tafel",
    seatsLeft: "{count} plekken over",
  },
  explain: {
    closeAria: "Sluiten",
    cta: "Claim je plek",
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
    popular: "Beste deal",
    save: "Bespaar {percent}",
    perMonth: "{price}/maand",
    legal:
      "Door verder te gaan ga je akkoord met automatische verlenging tot je opzegt. Je kunt je plan later upgraden, downgraden of stopzetten.",
    continue: "Betalen en lid worden",
    summary: "{price} per {period}",
    successTitle: "Je zit erbij",
    successBody:
      "Je Clubmember-abonnement is actief en je Sunday Table-plek staat vast. Hieronder kun je nog een +1 toevoegen of afmelden voor die tafel.",
    successCta: "Terug naar Sunday Table",
    errorGeneric: "Er ging iets mis. Probeer het opnieuw.",
    plans: [
      {
        id: "1m",
        label: "1 maand trial",
        price: "€21",
        perMonth: "€21",
        hint: "Daarna kun je stoppen of upgraden.",
      },
      {
        id: "6m",
        label: "6 maanden",
        price: "€60",
        compareAt: "€126",
        perMonth: "€10",
        savePercent: "52%",
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
    upgradeTo6m: "Upgrade naar 6 maanden",
    switchToTrial: "Naar 1 maand trial",
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
    signupOpen: "Aanmelden vóór vrijdag 16:00",
    signupUrgent: "Aanmelden vóór vrijdag 16:00",
    signupClosed: "Inschrijving gesloten",
    signupClosedError: "Inschrijving is gesloten (vrijdag 16:00).",
    onboardingRequired:
      "Rond eerst je profiel af (naam, leeftijd en geslacht) om een tafel te reserveren.",
    girlsOnlyRestricted: "Girls only-tafels zijn alleen voor vrouwen.",
    soldOut: "Vol",
  },
  invite: {
    eyebrow: "Uitnodigen",
    title: "Neem iemand mee",
    body: "Deel je link. Elke eerste zondag. Nieuwe mensen.",
    whatsapp: "WhatsApp",
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
          "1 maand trial €21. Of 6 maanden €60 (€10/maand). Je kunt later upgraden of downgraden.",
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
          "Ja. Wijzig of stop je plan op de clubpagina, of via Betaling beheren. Een Sunday Table-RSVP kun je apart afzeggen.",
      },
    ],
  },
};
