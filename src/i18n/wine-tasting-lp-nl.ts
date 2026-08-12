import type { FormatLpLabels } from "@/i18n/format-lp.types";

export const wineTastingLpNl: FormatLpLabels = {
  meta: {
    title: "Wijnproeverij · MyTable",
    description:
      "Vier wijnen en bite-pairings, gekozen door de wijnbar. Een gezellige middag aan één tafel met nieuwe mensen. Zet je op de wachtlijst.",
  },
  brand: "MyTable",
  socialProof: "Wijnproeverij · door de wijnbar samengesteld",
  headline: "Vier wijnen. Eén tafel. Nieuwe mensen.",
  line: "Wijnproeverij geeft je vier wijnen met bite-pairings, gekozen door de wijnbar. Een gezellige middag aan één tafel, zonder dat je zelf iets hoeft uit te zoeken.",
  heroBenefits: [
    { bold: "Vier wijnen met pairings", text: ", gekozen door de wijnbar" },
    { bold: "Eén tafel, nieuwe mensen", text: ", geen datingagenda" },
    { bold: "Girls only of gemengd", text: ", jij kiest" },
  ],
  cta: "Zet me op de lijst",
  ctaHint: "Gratis. Geen spam.",
  secondaryCta: "Wat je krijgt",
  how: {
    eyebrow: "Zo werkt het",
    title: "Van wachtlijst tot glas in de hand",
    body: "Zet je op de lijst, en zodra er een proeverij vormt die bij je past, hoor je van ons.",
    steps: [
      {
        title: "Zet je op de lijst",
        body: "Vertel ons wat je zoekt. Duurt een minuut, kost niks.",
      },
      {
        title: "Wij vormen een tafel",
        body: "Zodra er genoeg mensen zijn, plannen we een datum.",
      },
      {
        title: "Proef mee",
        body: "Je krijgt een mail zodra je proeverij klaarstaat.",
      },
    ],
  },
  included: {
    eyebrow: "Inbegrepen",
    title: "Wat je krijgt",
    items: [
      {
        title: "Vier wijnen",
        body: "Gekozen door de wijnbar, van licht naar vol.",
      },
      {
        title: "Bite-pairings",
        body: "Bij elke wijn een hap die 'm laat kloppen.",
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
    note: "Drankjes buiten de proeverij betaal je zelf op locatie.",
  },
  proof: {
    eyebrow: "Aan tafel",
    title: "Wijn als excuus, gesprek als bijvangst",
    body: "Echte momenten van eerdere proeverijen.",
    cta: "Zet me op de lijst",
  },
  pricing: {
    eyebrow: "Prijs",
    title: "Wat een proeverij kost",
    body: "Je betaalt pas zodra je wordt uitgenodigd voor een echte proeverij.",
    price: "€49",
    priceHint: "per persoon, inclusief vier wijnen en bites",
    justification:
      "Je betaalt niet voor losse glazen wijn. Je betaalt voor een avond die al voor je is samengesteld, aan een tafel met mensen die er ook voor kwamen.",
  },
  faq: {
    eyebrow: "Vragen",
    title: "Nog twijfels?",
    items: [
      {
        question: "Moet ik veel van wijn weten?",
        answer: "Nee. De wijnbar kiest en legt uit. Jij hoeft alleen te proeven.",
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
    title: "Klaar om te proeven?",
    body: "Vier wijnen. Eén tafel. Jij erbij.",
    cta: "Zet me op de lijst",
  },
  waitlist: {
    eyebrow: "Wachtlijst",
    title: "Zet je op de lijst",
    body: "We laten je weten zodra er een proeverij vormt die bij je past.",
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
    questionsBody: "Helpt ons de juiste proeverij voor je te vinden. Helemaal optioneel.",
    skip: "Overslaan",
    back: "Terug",
    continueCta: "Verder",
    progress: "Vraag {n} van {total}",
    why: {
      title: "Waarom een proeverij?",
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
    successBody: "Zodra er een proeverij vormt die bij je past, hoor je van ons.",
    successNext:
      "In de tussentijd: join de WhatsApp-groep voor kortingscodes en updates.",
    whatsappGirlsLabel: "Girls only WhatsApp",
    whatsappMixedLabel: "Gemengde WhatsApp",
    close: "Sluiten",
    dialogAria: "Wachtlijst aanmelden",
  },
};
