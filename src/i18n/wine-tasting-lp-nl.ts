import type { FormatLpLabels } from "@/i18n/format-lp.types";
import { buildWaitlistLabelsNl } from "@/i18n/build-waitlist-labels";

export const wineTastingLpNl: FormatLpLabels = {
  meta: {
    title: "Wijnproeverij · MyTable",
    description:
      "Een selectie wijnen met bite-pairings, gekozen door de wijnbar. Een gezellige middag aan één tafel. Zet je op de wachtlijst.",
    titleCity: "Wijnproeverij in {city} · MyTable",
    descriptionCity:
      "Een selectie wijnen met bite-pairings in {city}, gekozen door de wijnbar. Een gezellige middag aan één tafel. Zet je op de wachtlijst.",
  },
  brand: "MyTable",
  socialProof: "Wijnproeverij · door de wijnbar samengesteld",
  headline: "Lekkere wijn. Eén tafel. Niks zelf regelen.",
  headlineCity: "Lekkere wijn in {city}. Eén tafel. Niks zelf regelen.",
  line: "Wijnproeverij geeft je een selectie wijnen met bite-pairings, gekozen door de wijnbar. Een gezellige middag aan één tafel, zonder dat je zelf iets hoeft uit te zoeken.",
  lineCity:
    "Wijnproeverij geeft je een selectie wijnen met bite-pairings in {city}, gekozen door de wijnbar. Een gezellige middag aan één tafel, zonder dat je zelf iets hoeft uit te zoeken.",
  cta: "Zet me op de wachtlijst",
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
    cta: "Zet me op de wachtlijst",
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
    titleCity: "Klaar om te proeven in {city}?",
    body: "Lekkere wijn. Eén tafel. Jij erbij.",
    cta: "Zet me op de wachtlijst",
  },
  cities: {
    eyebrow: "Steden",
    title: "Ook in jouw stad?",
    body: "We breiden uit. Zet je op de wachtlijst voor de stad waar jij wilt proeven.",
  },
  waitlist: buildWaitlistLabelsNl({
    body: "We laten je weten zodra er een proeverij vormt in jouw stad.",
    questionsBody: "Helpt ons de juiste proeverij voor je te vinden. Helemaal optioneel.",
    successBody: "Zodra er een proeverij vormt in jouw stad, hoor je van ons.",
    tableTypeTitle: "Welke tafel?",
  }),
};
