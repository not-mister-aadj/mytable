import type { FormatLpLabels } from "@/i18n/format-lp.types";

export const chefsSpecialLpNl: FormatLpLabels = {
  meta: {
    title: "Chef's Table · MyTable",
    description:
      "Zondagavond family style: meerdere voorgerechten, hoofdgerechten en dessert, met nieuwe mensen aan tafel. Zet je op de wachtlijst.",
  },
  brand: "MyTable",
  socialProof: "Chef's Table · family style, zondagavond",
  headline: "Het hele menu. Eén tafel. Nieuwe mensen.",
  line: "Chef's Table is een zondagavond family style: meerdere voorgerechten, hoofdgerechten en dessert, zodat je het beste van het restaurant proeft met je tafel.",
  heroBenefits: [
    { bold: "Family style menu", text: ", voor-, hoofd- en nagerecht" },
    { bold: "Eén tafel, nieuwe mensen", text: ", geen datingagenda" },
    { bold: "Girls only of gemengd", text: ", jij kiest" },
  ],
  cta: "Zet me op de lijst",
  ctaHint: "Gratis. Geen spam.",
  secondaryCta: "Wat je krijgt",
  how: {
    eyebrow: "Zo werkt het",
    title: "Van wachtlijst tot volle tafel",
    body: "Zet je op de lijst, en zodra er een Chef's Table vormt die bij je past, hoor je van ons.",
    steps: [
      {
        title: "Zet je op de lijst",
        body: "Vertel ons wat je zoekt. Duurt een minuut, kost niks.",
      },
      {
        title: "Wij vormen een tafel",
        body: "Zodra er genoeg mensen zijn, plannen we een restaurant en datum.",
      },
      {
        title: "Schuif aan",
        body: "Je krijgt een mail zodra je Chef's Table klaarstaat.",
      },
    ],
  },
  included: {
    eyebrow: "Inbegrepen",
    title: "Wat je krijgt",
    items: [
      {
        title: "Family style menu",
        body: "Meerdere voorgerechten, hoofdgerechten en dessert, gedeeld aan tafel.",
      },
      {
        title: "Uitgekozen restaurant",
        body: "Wij regelen de plek, jij hoeft niet te reserveren.",
      },
      {
        title: "Eén tafel",
        body: "Maximaal tien plekken, met nieuwe mensen.",
      },
      {
        title: "Girls only of gemengd",
        body: "Jij kiest welke tafel bij je past.",
      },
    ],
    note: "Drankjes betaal je zelf op locatie.",
  },
  proof: {
    eyebrow: "Aan tafel",
    title: "Zondagavond, vol bord, nieuw gezelschap",
    body: "Echte momenten van eerdere Chef's Tables.",
    cta: "Zet me op de lijst",
  },
  pricing: {
    eyebrow: "Prijs",
    title: "Wat een Chef's Table kost",
    body: "De prijs hangt af van het restaurant en het menu. Je ziet het exacte bedrag zodra je wordt uitgenodigd, je betaalt pas dan.",
    price: "Prijs per avond",
    priceHint: "afhankelijk van restaurant en menu",
    justification:
      "Je betaalt niet voor losse gerechten. Je betaalt voor een avond die al is samengesteld, aan een tafel met mensen die er ook voor kwamen.",
  },
  faq: {
    eyebrow: "Vragen",
    title: "Nog twijfels?",
    items: [
      {
        question: "Kan ik aangeven wat ik niet eet?",
        answer: "Ja, allergieën en voorkeuren geef je door zodra je bent uitgenodigd.",
      },
      {
        question: "Kan ik met iemand mee?",
        answer: "Ja, een +1 meenemen mag.",
      },
      {
        question: "Wat als ik niet kan op de geplande datum?",
        answer: "Laat het ons weten, dan zoeken we een volgende ronde voor je.",
      },
    ],
  },
  final: {
    title: "Klaar om aan te schuiven?",
    body: "Het hele menu. Eén tafel. Jij erbij.",
    cta: "Zet me op de lijst",
  },
  waitlist: {
    eyebrow: "Wachtlijst",
    title: "Zet je op de lijst",
    body: "We laten je weten zodra er een Chef's Table vormt die bij je past.",
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
    questionsBody: "Helpt ons de juiste tafel voor je te vinden. Helemaal optioneel.",
    skip: "Overslaan",
    back: "Terug",
    continueCta: "Verder",
    progress: "Vraag {n} van {total}",
    why: {
      title: "Waarom een Chef's Table?",
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
      title: "Welke tafel?",
      options: [
        { id: "girls_only", label: "Girls only" },
        { id: "mixed", label: "Gemengd" },
        { id: "no_preference", label: "Maakt niet uit" },
      ],
    },
    successTitle: "Je staat op de lijst",
    successBody: "Zodra er een Chef's Table vormt die bij je past, hoor je van ons.",
    successNext:
      "In de tussentijd: join de WhatsApp-groep voor kortingscodes en updates.",
    whatsappGirlsLabel: "Girls only WhatsApp",
    whatsappMixedLabel: "Gemengde WhatsApp",
    close: "Sluiten",
    dialogAria: "Wachtlijst aanmelden",
  },
};
