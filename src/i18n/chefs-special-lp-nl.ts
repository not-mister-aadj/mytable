import type { FormatLpLabels } from "@/i18n/format-lp.types";
import { buildWaitlistLabelsNl } from "@/i18n/build-waitlist-labels";

export const chefsSpecialLpNl: FormatLpLabels = {
  meta: {
    title: "Chef's Table · MyTable",
    description:
      "Zondagavond met de beste gerechten van het menu, voorgeselecteerd: voorgerechten, hoofdgerechten en dessert. Zet je op de wachtlijst.",
    titleCity: "Chef's Table in {city} · MyTable",
    descriptionCity:
      "Zondagavond in {city} met de beste gerechten van het menu, voorgeselecteerd: voorgerechten, hoofdgerechten en dessert. Zet je op de wachtlijst.",
  },
  brand: "MyTable",
  socialProof: "Chef's Table · beste gerechten, voorgeselecteerd",
  headline: "De beste gerechten. Eén tafel. Niks zelf regelen.",
  headlineCity: "De beste gerechten in {city}. Eén tafel. Niks zelf regelen.",
  line: "Chef's Table is een zondagavond met de beste gerechten van het menu, voorgeselecteerd: voorgerechten, hoofdgerechten en dessert.",
  lineCity:
    "Chef's Table is een zondagavond in {city} met de beste gerechten van het menu, voorgeselecteerd: voorgerechten, hoofdgerechten en dessert.",
  cta: "Zet me op de wachtlijst",
  ctaHint: "Gratis. Geen spam.",
  secondaryCta: "Wat je krijgt",
  how: {
    eyebrow: "Zo werkt het",
    title: "Van wachtlijst tot volle tafel",
    body: "Zet je op de lijst, en zodra we een Chef's Table hebben die bij je past, hoor je van ons.",
    steps: [
      {
        title: "Zet je op de lijst",
        body: "Vertel ons wat je leuk vindt, zodat we je alleen uitnodigen voor wat bij je past. Geen spam.",
      },
      {
        title: "Wij nodigen je uit",
        body: "Zodra we een Chef's Table hebben die aansluit bij wat jij zoekt, hoor je van ons.",
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
        title: "De beste gerechten",
        body: "Voorgeselecteerd uit het menu: voorgerechten, hoofdgerechten en dessert.",
      },
      {
        title: "Uitgekozen restaurant",
        body: "Wij regelen de plek, jij hoeft niet te reserveren.",
      },
      {
        title: "Eén tafel",
        body: "Iedereen aan dezelfde tafel, geen aparte tafeltjes.",
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
          "De beste gerechten van het menu, voorgeselecteerd: voorgerechten, hoofdgerechten en dessert. Geen keuzestress, je proeft het beste van het restaurant in één avond.",
      },
      {
        question: "Kan ik aangeven wat ik niet eet?",
        answer: "Ja, allergieën en voorkeuren geef je door zodra je bent uitgenodigd.",
      },
      {
        question: "Wat kost het?",
        answer:
          "De prijs hangt af van restaurant en menu, en die hoor je zodra je wordt uitgenodigd. Op de wachtlijst staan is gratis en verplicht je tot niets.",
      },
      {
        question: "Wat als ik niet kan op de geplande datum?",
        answer: "Laat het ons weten, dan zoeken we een volgende ronde voor je.",
      },
    ],
  },
  final: {
    title: "Klaar om aan te schuiven?",
    titleCity: "Klaar om aan te schuiven in {city}?",
    body: "De beste gerechten. Eén tafel. Jij erbij.",
    cta: "Zet me op de wachtlijst",
  },
  cities: {
    eyebrow: "Steden",
    title: "Ook in jouw stad?",
    body: "We breiden uit. Zet je op de wachtlijst voor de stad waar jij aan tafel wilt.",
  },
  waitlist: buildWaitlistLabelsNl({
    body: "We laten je weten zodra er een Chef's Table vormt in jouw stad.",
    questionsBody: "Helpt ons de juiste tafel voor je te vinden. Helemaal optioneel.",
    successBody: "Zodra er een Chef's Table vormt in jouw stad, hoor je van ons.",
    tableTypeTitle: "Welke tafel?",
  }),
};
