import { listTopNlCityNames } from "@/data/nl-top-cities";
import type { WaitlistPageLabels } from "./waitlist-page.types";

export const waitlistPageNl: WaitlistPageLabels = {
  meta: {
    title: "Jouw tafel · MyTable",
    description:
      "Vertel wat je zoekt aan tafel. MyTable gebruikt je antwoorden om te bepalen welke ervaringen we openen.",
  },
  brand: "MyTable",
  progressLabel: "{current} / {total}",
  back: "Terug",
  next: "Verder",
  start: "Beginnen",
  trustLine: "Kort · vrijblijvend · geen spam",
  multiHint: "Meerdere antwoorden mogelijk",
  intro: {
    eyebrow: "MyTable",
    title: "Vertel wat je zoekt",
    subtitle:
      "We bouwen MyTable verder uit. Deze korte vragen helpen ons te bepalen welke tafels we als eerste openen.",
  },
  steps: {
    interests: {
      title: "Welke ervaring spreekt je aan?",
      subtitle: "Kies wat past. Je eerste keuze weegt het zwaarst.",
      required: "Kies minstens één optie",
      options: [
        {
          id: "wine_tasting",
          title: "Wijnproeverij",
          description:
            "Zondagmiddag: vier wijnen en bite-pairings, gekozen door de wijnbar. Gezellig aan tafel met je groep.",
        },
        {
          id: "chefs_special",
          title: "Chef's Table",
          description:
            "Zondagavond: meerdere voor-, hoofd- en nagerechten family style, zodat je het beste van het restaurant proeft.",
        },
        {
          id: "wine_walk",
          title: "Wine Walk",
          description:
            "Zondagmiddag: de stad ontdekken door meerdere locaties te proberen, met wijn en spijs.",
        },
        {
          id: "aperitivo",
          title: "Golden Hour Aperitivo",
          description: "Zondagochtend: bubbels, hapjes en soft light.",
        },
      ],
    },
    why: {
      title: "Waarom spreekt dit je aan?",
      subtitle: "Kies wat het dichtst bij komt.",
      required: "Kies minstens één optie",
      options: [
        { id: "discover_wines", title: "Nieuwe wijnen ontdekken" },
        { id: "discover_flavours", title: "Nieuwe smaken ontdekken" },
        { id: "discover_places", title: "Nieuwe locaties ontdekken" },
        { id: "no_organise", title: "Geen gedoe met plannen" },
        { id: "treat", title: "Verjaardag of cadeau" },
        { id: "new_city", title: "Nieuw in de stad" },
      ],
    },
    company: {
      title: "Hoe wil je komen?",
      subtitle:
        "Neem je mensen mee, of wil je juist nieuwe gezichten ontmoeten?",
      required: "Kies minstens één optie",
      options: [
        { id: "meet_new", title: "Nieuwe mensen ontmoeten" },
        { id: "bring_friends", title: "Met vriendinnen of vrienden" },
        { id: "bring_partner", title: "Met partner" },
        { id: "solo", title: "Solo" },
      ],
    },
    tableType: {
      title: "Welk type tafel?",
      subtitle: "Girls only of gemengd.",
      required: "Kies minstens één optie",
      options: [
        { id: "girls_only", title: "Girls only" },
        { id: "mixed", title: "Gemengde tafel" },
      ],
    },
    where: {
      title: "Waar zoek je een tafel?",
      subtitle: "Kies je steden. Optioneel kun je flexibel zijn in de regio.",
      citiesHint: "Selecteer één of meer steden",
      citiesRequired: "Kies minstens één stad",
      cities: listTopNlCityNames(),
      flexibleLabel: "Flexibel in de regio",
      flexibleHint: "Ook open voor een stad in de buurt.",
    },
    contact: {
      title: "Bijna klaar",
      subtitle:
        "Laat je naam en e-mail achter. We mailen je wanneer jouw gekozen ervaringen online komen.",
      tease: "Jouw keuzes",
      choiceHint: "We houden je op de hoogte zodra deze ervaringen live gaan.",
      nameLabel: "Voornaam",
      namePlaceholder: "Voornaam",
      emailLabel: "E-mail",
      emailPlaceholder: "naam@email.nl",
      cta: "Houd me op de hoogte",
      submitting: "Bezig…",
    },
  },
  outcomes: {
    wine_tasting: {
      id: "wine_tasting",
      eyebrow: "Jouw keuze",
      title: "Wijnproeverij",
      body: "Vier wijnen en bite-pairings, gekozen door de wijnbar. Jij geniet van een gezellige middag met je tafel.",
      image: "/girls-only/table-wine-laughing.jpg",
      imageAlt: "Vrouwen lachen aan tafel tijdens een wijnproeverij",
    },
    chefs_special: {
      id: "chefs_special",
      eyebrow: "Jouw keuze",
      title: "Chef's Table",
      body: "Meerdere voorgerechten, hoofdgerechten en dessert komen family style op tafel. Zo proef je het beste van het restaurant, gedeeld met je tafel. Minder kiezen, meer ontdekken.",
      image: "/girls-only/table-group.jpg",
      imageAlt: "Gezelschap aan tafel tijdens een dineravond",
    },
    wine_walk: {
      id: "wine_walk",
      eyebrow: "Jouw keuze",
      title: "Wine Walk",
      body: "De stad ontdekken door meerdere locaties te proberen, elk met wijn en spijs. Wandelen, proeven, nieuwe plekken leren kennen.",
      image: "/girls-only/crowd-evening.jpg",
      imageAlt: "Groep vrouwen onderweg tijdens een avond uit",
    },
    aperitivo: {
      id: "aperitivo",
      eyebrow: "Jouw keuze",
      title: "Golden Hour Aperitivo",
      body: "Licht beginnen. Bubbels, hapjes en soft light in de ochtend. Laagdrempelig, helder en goed te herhalen.",
      image: "/girls-only/wine-moment.jpg",
      imageAlt: "Vrouw geniet van een glas wijn in warm licht",
    },
  },
  success: {
    eyebrow: "Bedankt",
    waitlistNote:
      "We mailen je wanneer jouw gekozen ervaringen online komen.",
    whatsappTitle: "Nog sneller op de hoogte?",
    whatsappBody:
      "Join de WhatsApp-groep per ervaring die je koos. Alleen updates als er plekken openen, geen spam.",
    whatsappCta: "Join WhatsApp",
    agendaLabel: "Bekijk de agenda",
  },
  error: "Er ging iets mis. Probeer het later opnieuw.",
  databaseUnavailable:
    "We kunnen je aanmelding nu niet opslaan. Probeer het zo opnieuw.",
  breadcrumbHome: "Home",
  breadcrumbWaitlist: "Jouw tafel",
};
