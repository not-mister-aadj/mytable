import type { FormatLpLabels } from "@/i18n/format-lp.types";
import { buildWaitlistLabelsNl } from "@/i18n/build-waitlist-labels";

export const wineWalkLpNl: FormatLpLabels = {
  meta: {
    title: "Wijnwalk · MyTable",
    description:
      "De stad ontdekken door meerdere locaties te proberen, elk met wijn en spijs. Zet je op de wachtlijst.",
    titleCity: "Wijnwalk in {city} · MyTable",
    descriptionCity:
      "{city} ontdekken door meerdere locaties te proberen, elk met wijn en spijs. Zet je op de wachtlijst.",
  },
  brand: "MyTable",
  socialProof: "Wijnwalk · meerdere locaties, één avond",
  headline: "Eén avond. Meerdere plekken. Geen gedoe met plannen.",
  headlineCity: "Eén avond in {city}. Meerdere plekken. Geen gedoe met plannen.",
  line: "Wijnwalk laat je de stad ontdekken door meerdere locaties te proberen, elk met wijn en spijs. Wij stippelen de route al voor je uit.",
  lineCity:
    "Wijnwalk laat je {city} ontdekken door meerdere locaties te proberen, elk met wijn en spijs. Wij stippelen de route al voor je uit.",
  cta: "Zet me op de wachtlijst",
  ctaHint: "Gratis. Geen spam.",
  secondaryCta: "Wat je krijgt",
  how: {
    eyebrow: "Zo werkt het",
    title: "Van wachtlijst tot eerste glas onderweg",
    body: "Zet je op de lijst, en zodra we een wijnwalk hebben die bij je past, hoor je van ons.",
    steps: [
      {
        title: "Zet je op de lijst",
        body: "Vertel ons wat je leuk vindt, zodat we je alleen uitnodigen voor wat bij je past. Geen spam.",
      },
      {
        title: "Wij nodigen je uit",
        body: "Zodra we een wijnwalk hebben die aansluit bij wat jij zoekt, hoor je van ons.",
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
        body: "Een overzichtelijke groep, geen grote massatour.",
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
          "We lopen samen langs meerdere plekken die wij hebben uitgekozen. Op elke stop wijn en spijs, geen zoeken of plannen, wij hebben de route al uitgestippeld.",
      },
      {
        question: "Hoeveel locaties lopen we?",
        answer: "Dat verschilt per route. Elke stop krijg je wijn en spijs.",
      },
      {
        question: "Is het een lange wandeling?",
        answer: "Nee, de locaties liggen dicht bij elkaar. Comfortabele schoenen zijn genoeg.",
      },
      {
        question: "Wat kost het?",
        answer:
          "Zodra je wordt uitgenodigd voor een wijnwalk, hoor je de prijs. Op de wachtlijst staan is gratis en verplicht je tot niets.",
      },
    ],
  },
  final: {
    title: "Klaar om te lopen?",
    titleCity: "Klaar om te lopen in {city}?",
    body: "Meerdere plekken. Eén avond. Jij erbij.",
    cta: "Zet me op de wachtlijst",
  },
  cities: {
    eyebrow: "Steden",
    title: "Ook in jouw stad?",
    body: "We breiden uit. Zet je op de wachtlijst voor de stad waar jij wilt lopen.",
  },
  waitlist: buildWaitlistLabelsNl({
    body: "We laten je weten zodra er een wijnwalk vormt in jouw stad.",
    questionsBody: "Helpt ons de juiste wijnwalk voor je te vinden. Helemaal optioneel.",
    successBody: "Zodra er een wijnwalk vormt in jouw stad, hoor je van ons.",
    tableTypeTitle: "Welke groep?",
  }),
};
