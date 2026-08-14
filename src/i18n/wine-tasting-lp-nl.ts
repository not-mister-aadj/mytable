import type { FormatLpLabels } from "@/i18n/format-lp.types";

export const wineTastingLpNl: FormatLpLabels = {
  meta: {
    title: "Wijnproeverij · MyTable",
    description:
      "Een selectie wijnen met bite-pairings, gekozen door de wijnbar. Een gezellige middag aan één tafel. Zet je op de wachtlijst.",
  },
  brand: "MyTable",
  socialProof: "Wijnproeverij · door de wijnbar samengesteld",
  headline: "Lekkere wijn. Eén tafel. Niks zelf regelen.",
  line: "Wijnproeverij geeft je een selectie wijnen met bite-pairings, gekozen door de wijnbar. Een gezellige middag aan één tafel, zonder dat je zelf iets hoeft uit te zoeken.",
  cta: "Zet me op de lijst",
  ctaHint: "Gratis. Geen spam.",
  secondaryCta: "Wat je krijgt",
  how: {
    eyebrow: "Zo werkt het",
    title: "Van wachtlijst tot glas in de hand",
    body: "Zet je op de lijst, en zodra we een proeverij hebben die bij je past, hoor je van ons.",
    steps: [
      {
        title: "Zet je op de lijst",
        body: "Vertel ons wat je leuk vindt, zodat we je alleen uitnodigen voor wat bij je past. Geen spam.",
      },
      {
        title: "Wij nodigen je uit",
        body: "Zodra we een proeverij hebben die aansluit bij wat jij zoekt, hoor je van ons.",
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
        title: "Een selectie wijnen",
        body: "Gekozen door de wijnbar, van licht naar vol.",
      },
      {
        title: "Bite-pairings",
        body: "Bij elke wijn een hap die 'm laat kloppen.",
      },
      {
        title: "Eén tafel",
        body: "Een overzichtelijke groep, geen grote massaproeverij.",
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
    body: "Echte momenten van MyTable-avonden.",
    cta: "Zet me op de lijst",
  },
  faq: {
    eyebrow: "Vragen",
    title: "Nog twijfels?",
    items: [
      {
        question: "Wat kan ik verwachten van een avond?",
        answer:
          "Een paar wijnen, geselecteerd door de wijnbar, elk met een bijpassende hap. Geen keuzestress, wij zochten het al voor je uit. Jij proeft, praat, en ontdekt wat je lekker vindt.",
      },
      {
        question: "Moet ik veel van wijn weten?",
        answer: "Nee. De wijnbar kiest en legt uit. Jij hoeft alleen te proeven.",
      },
      {
        question: "Wat kost het?",
        answer:
          "Zodra je wordt uitgenodigd voor een proeverij, hoor je de prijs. Op de wachtlijst staan is gratis en verplicht je tot niets.",
      },
      {
        question: "Wat als ik niet kan op de geplande datum?",
        answer: "Laat het ons weten, dan zoeken we een volgende ronde voor je.",
      },
    ],
  },
  final: {
    title: "Klaar om te proeven?",
    body: "Lekkere wijn. Eén tafel. Jij erbij.",
    cta: "Zet me op de lijst",
  },
  waitlist: {
    eyebrow: "Wachtlijst",
    title: "Zet je op de lijst",
    body: "We laten je weten zodra er een proeverij vormt in jouw stad.",
    nameLabel: "Naam",
    namePlaceholder: "Voornaam",
    emailLabel: "E-mail",
    emailPlaceholder: "jij@email.nl",
    cityLabel: "In de volgende steden",
    cityOther: "Andere stad",
    cityOtherPlaceholder: "Welke stad?",
    formatLabel: "Geïnteresseerd in de volgende formats",
    submit: "Zet me op de lijst",
    submitting: "Bezig…",
    privacyNote: "Geen spam. Je kunt je altijd uitschrijven.",
    error: "Er ging iets mis. Probeer het opnieuw.",
    questionsTitle: "Nog een paar korte vragen",
    questionsBody: "Helpt ons de juiste proeverij voor je te vinden. Helemaal optioneel.",
    skip: "Overslaan",
    back: "Terug",
    continueCta: "Verder",
    progress: "Vraag {n} van {total}",
    why: {
      title: "Waarom sta je op de lijst?",
      options: [
        { id: "discover_wines", label: "Wijn ontdekken" },
        { id: "discover_flavours", label: "Nieuwe smaken" },
        { id: "discover_places", label: "Nieuwe plekken" },
        { id: "no_organise", label: "Niks zelf hoeven regelen" },
        { id: "treat", label: "Mezelf trakteren" },
        { id: "new_city", label: "Nieuw in de stad" },
        { id: "just_fun", label: "Gewoon een leuke zondag, zonder speciale reden" },
        { id: "other", label: "Iets anders" },
      ],
      otherPlaceholder: "Vertel het ons...",
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
    gender: {
      title: "Gender",
      options: [
        { id: "female", label: "Vrouw" },
        { id: "male", label: "Man" },
        { id: "other", label: "Anders" },
        { id: "unspecified", label: "Zeg ik liever niet" },
      ],
    },
    ageRange: {
      title: "Leeftijd",
      options: [
        { id: "18_24", label: "18-24" },
        { id: "25_34", label: "25-34" },
        { id: "35_44", label: "35-44" },
        { id: "45_plus", label: "45+" },
      ],
    },
    vibe: {
      title: "Wat maakt een avond voor jou geslaagd?",
      options: [
        { id: "people", label: "De mensen aan tafel" },
        { id: "experience", label: "Het eten en de wijn" },
        { id: "both", label: "Allebei evenveel" },
      ],
    },
    budget: {
      title: "Waar let je het meest op bij de prijs?",
      options: [
        { id: "budget", label: "Ik hou het betaalbaar" },
        { id: "premium", label: "Beste ervaring, budget is bijzaak" },
        { id: "flexible", label: "Ergens tussenin" },
      ],
    },
    experience: {
      title: "Hoe zou je jezelf omschrijven?",
      options: [
        {
          id: "curious",
          label: "Ik probeer graag iets nieuws, hoef geen expert te zijn",
        },
        {
          id: "experienced",
          label: "Ik weet er al veel van, ik zoek de betere dingen",
        },
      ],
    },
    successTitle: "Je staat op de lijst",
    successBody: "Zodra er een proeverij vormt in jouw stad, hoor je van ons.",
    successNext:
      "Liever updates via WhatsApp dan mail? Join de groep, daar doen we ook onze aankondigingen.",
    whatsappGirlsLabel: "Girls only WhatsApp",
    whatsappMixedLabel: "Gemengde WhatsApp",
    close: "Sluiten",
    dialogAria: "Wachtlijst aanmelden",
  },
};
