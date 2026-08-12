import type { FormatLpLabels } from "@/i18n/format-lp.types";

export const wineWalkLpNl: FormatLpLabels = {
  meta: {
    title: "Wijnwalk · MyTable",
    description:
      "De stad ontdekken door meerdere locaties te proberen, elk met wijn en spijs. Met nieuwe mensen. Zet je op de wachtlijst.",
  },
  brand: "MyTable",
  socialProof: "Wijnwalk · meerdere locaties, één avond",
  headline: "Eén avond. Meerdere plekken. Nieuwe mensen.",
  line: "Wijnwalk laat je de stad ontdekken door meerdere locaties te proberen, elk met wijn en spijs. Samen met een groep nieuwe mensen, geen gedoe met plannen.",
  heroBenefits: [
    { bold: "Meerdere locaties", text: ", elk met wijn en spijs" },
    { bold: "Eén groep, nieuwe mensen", text: ", geen datingagenda" },
    { bold: "Girls only of gemengd", text: ", jij kiest" },
  ],
  cta: "Zet me op de lijst",
  ctaHint: "Gratis. Geen spam.",
  secondaryCta: "Wat je krijgt",
  how: {
    eyebrow: "Zo werkt het",
    title: "Van wachtlijst tot eerste glas onderweg",
    body: "Zet je op de lijst, en zodra er een wijnwalk vormt die bij je past, hoor je van ons.",
    steps: [
      {
        title: "Zet je op de lijst",
        body: "Vertel ons wat je zoekt. Duurt een minuut, kost niks.",
      },
      {
        title: "Wij vormen een groep",
        body: "Zodra er genoeg mensen zijn, plannen we een route en datum.",
      },
      {
        title: "Loop mee",
        body: "Je krijgt een mail zodra je wijnwalk klaarstaat.",
      },
    ],
  },
  included: {
    eyebrow: "Inbegrepen",
    title: "Wat je krijgt",
    items: [
      {
        title: "Meerdere locaties",
        body: "Elke stop met eigen wijn en spijs, uitgekozen door ons.",
      },
      {
        title: "Eén route door de stad",
        body: "Ontdek plekken die je zelf nooit had gevonden.",
      },
      {
        title: "Eén groep",
        body: "Loop samen met nieuwe mensen, max tien plekken.",
      },
      {
        title: "Girls only of gemengd",
        body: "Jij kiest welke groep bij je past.",
      },
    ],
    note: "Extra drankjes buiten de route betaal je zelf op locatie.",
  },
  proof: {
    eyebrow: "Onderweg",
    title: "De stad ontdekken, met gezelschap dat blijft",
    body: "Echte momenten van eerdere wijnwalks.",
    cta: "Zet me op de lijst",
  },
  pricing: {
    eyebrow: "Prijs",
    title: "Wat een wijnwalk kost",
    body: "Je betaalt pas zodra je wordt uitgenodigd voor een echte wijnwalk.",
    price: "€60",
    priceHint: "per persoon, inclusief wijn en spijs op elke stop",
    justification:
      "Je betaalt niet voor losse drankjes op losse plekken. Je betaalt voor een route die al is uitgestippeld, met gezelschap dat er ook voor koos.",
  },
  faq: {
    eyebrow: "Vragen",
    title: "Nog twijfels?",
    items: [
      {
        question: "Hoeveel locaties lopen we?",
        answer: "Dat verschilt per route. Elke stop krijg je wijn en spijs.",
      },
      {
        question: "Kan ik met iemand mee?",
        answer: "Ja, een +1 meenemen mag.",
      },
      {
        question: "Is het een lange wandeling?",
        answer: "Nee, de locaties liggen dicht bij elkaar. Comfortabele schoenen zijn genoeg.",
      },
    ],
  },
  final: {
    title: "Klaar om te lopen?",
    body: "Meerdere plekken. Eén avond. Jij erbij.",
    cta: "Zet me op de lijst",
  },
  waitlist: {
    eyebrow: "Wachtlijst",
    title: "Zet je op de lijst",
    body: "We laten je weten zodra er een wijnwalk vormt die bij je past.",
    nameLabel: "Naam",
    namePlaceholder: "Voornaam",
    emailLabel: "E-mail",
    emailPlaceholder: "jij@email.nl",
    cityLabel: "Stad",
    cityOther: "Andere stad",
    cityOtherPlaceholder: "Welke stad?",
    submit: "Zet me op de lijst",
    submitting: "Bezig…",
    privacyNote: "Geen spam. Je kunt je altijd uitschrijven.",
    error: "Er ging iets mis. Probeer het opnieuw.",
    questionsTitle: "Nog 3 korte vragen",
    questionsBody: "Helpt ons de juiste wijnwalk voor je te vinden. Helemaal optioneel.",
    skip: "Overslaan",
    back: "Terug",
    continueCta: "Verder",
    progress: "Vraag {n} van {total}",
    why: {
      title: "Waarom een wijnwalk?",
      options: [
        { id: "discover_wines", label: "Wijn ontdekken" },
        { id: "discover_flavours", label: "Nieuwe smaken" },
        { id: "discover_places", label: "Nieuwe plekken" },
        { id: "no_organise", label: "Niks zelf hoeven regelen" },
        { id: "treat", label: "Mezelf trakteren" },
        { id: "new_city", label: "Nieuw in de stad" },
      ],
    },
    company: {
      title: "Met wie kom je het liefst?",
      options: [
        { id: "meet_new", label: "Nieuwe mensen ontmoeten" },
        { id: "bring_friends", label: "Met vrienden" },
        { id: "bring_partner", label: "Met partner" },
        { id: "solo", label: "Solo" },
      ],
    },
    tableType: {
      title: "Welke groep?",
      options: [
        { id: "girls_only", label: "Girls only" },
        { id: "mixed", label: "Gemengd" },
        { id: "no_preference", label: "Maakt niet uit" },
      ],
    },
    successTitle: "Je staat op de lijst",
    successBody: "Zodra er een wijnwalk vormt die bij je past, hoor je van ons.",
    successNext:
      "In de tussentijd: join de WhatsApp-groep voor kortingscodes en updates.",
    whatsappGirlsLabel: "Girls only WhatsApp",
    whatsappMixedLabel: "Gemengde WhatsApp",
    close: "Sluiten",
    dialogAria: "Wachtlijst aanmelden",
  },
};
