import type { ExperiencePageLabels } from "./types";
import { images } from "@/data/images";
import { tastingFlowNl, tastingQuotesNl } from "./experience-mood-blocks-nl";

export const experiencePageNl: ExperiencePageLabels = {
  viewTableCta: "Bekijk tafel",
  secondaryCta: "Terug naar agenda",
  agendaCta: "Bekijk agenda",
  heroTrustBar: "★★★★★ 4.8 · 1200+ gasten aan tafel sinds 2024",
  heroTrustFooter:
    "Alles vooraf betaald · Gratis ruilen tot 48 uur van tevoren · Dieetwensen mogelijk",
  heroSpotsHint: "Nog {count} plekken voor deze datum",
  pillSoloTogether: "Kom alleen of samen",
  perPerson: "€{price} per persoon",
  aboutTitle: "Over deze ervaring",
  expectTitle: "Wat kun je verwachten?",
  flowTitle: "Hoe verloopt de ervaring?",
  venuesTitle: "Waar je aan tafel schuift",
  venuesSubtitle:
    "Eén partnerrestaurant per avond. Superleuk aan tafel: de chef bereidt specials die je verassen, met wijn en spijs op één plek.",
  guestQuotesTitle: "Wat gasten zeggen",
  routeTitle: "Een middag door {city}",
  routeMapEyebrow: "Zoek op de kaart",
  routeMapTitle: "Een wandeling langs deze restaurants",
  routeSubtitle:
    "Je loopt op ontspannen tempo langs zorgvuldig gekozen stops. De exacte route ontvang je na boeking.",
  routeOpenInApple: "Open route in Kaarten",
  routeMapSetupHint:
    "Voorkeursweergave: Apple Kaarten (MapKit). Voeg credentials toe voor de volledige kaart.",
  socialTitle: "Je komt voor wijn en gezelligheid. Niet om te netwerken.",
  socialSubtitle:
    "Een kleine groep aan één tafel, met ruimte om te proeven, lachen en praten op je eigen tempo.",
  galleryTitle: "Sfeerimpressie",
  practicalTitle: "Praktische info",
  faqTitle: "Veelgestelde vragen",
  relatedTitle: "Meer tafels om te ontdekken",
  finalCtaHeadline: "Schuif aan bij een tafel met goede wijn en gezelschap.",
  finalCtaSubheadline:
    "Chef's special, één restaurant en gesprekken die vanzelf ontstaan.",
  finalCtaPrimary: "Reserveer je plek",
  finalCtaSecondary: "Bekijk andere tafels",
  bookingDate: "Datum",
  bookingTime: "Tijd",
  bookingCity: "Stad",
  bookingPrice: "Prijs",
  bookingSpots: "Plekken",
  spotsLeftBadge: "Nog {count} plekken beschikbaar",
  bookingViewsLabel: "{count} mensen bekeken deze tafel deze week",
  bookingTrustBullets: [
    "Alles vooraf betaald",
    "Gratis ruilen tot 48 uur van tevoren",
    "Dieetwensen mogelijk",
    "Kom alleen of samen",
  ],
  trustLines: [
    "Gecureerde locaties en hosts",
    "Kom alleen, met vrienden of als duo",
    "Ontspannen sfeer, geen verplicht smalltalk",
  ],
  practicalLabels: {
    startTime: "Starttijd",
    duration: "Duur",
    city: "Stad",
    included: "Inbegrepen",
    dietary: "Dieetwensen",
    solo: "Alleen komen",
    payment: "Betaling",
    exchange: "Ruilen",
    walking: "Wandelafstand",
    weather: "Weer",
    arrival: "Aankomst",
    routeReveal: "Route & locaties",
    groupSize: "Groepsgrootte",
  },
  practicalValues: {
    dietary:
      "Geef het door bij boeken. De chef past de specials aan waar dat kan.",
    solo: "Alleen aankomen is heel normaal en juist welkom",
    payment: "Alles betaal je vooraf bij het reserveren.",
    exchange:
      "Gratis ruilen naar een andere datum tot 48 uur voor de start. Annuleren is niet mogelijk.",
    weather:
      "Meestal binnen in het restaurant. Bij mooi weer en een beschikbaar terras kan de tafel daar plaatsvinden.",
    arrival:
      "Kom 10 minuten voor starttijd. De host verwelkomt je en wijst de groep aan.",
    routeReveal:
      "Het restaurant en adres ontvang je per e-mail na bevestiging van je boeking.",
    groupSize: "Kleine groepen, meestal 8 tot 14 gasten per tafel",
  },
  spotsByStatus: {
    available: "Nog voldoende plekken beschikbaar",
    almostFull: "Nog enkele plekken over, wees er snel bij",
    soldOut: "Deze tafel is uitverkocht",
    new: "Nieuw in ons aanbod",
  },
  moods: {
    tastings: {
      tagline: "Wijnproeverij aan één tafel, girls only of gemengde groep",
      experienceFlow: tastingFlowNl,
      guestQuotes: tastingQuotesNl,
      description:
        "MyTable start met wijnproeverijen in één restaurant. Je schuift aan bij een kleine groep, proeft meerdere wijnen met bijpassende bites en eet wat de chef als special voor de tafel bereidt. Geen wijnles, wel context en ruimte om op je eigen tempo te genieten, meestal twee tot drie uur.",
      whatToExpect: [
        {
          title: "Eén restaurant, één tafel",
          description:
            "Geen stops door de stad. Alles speelt zich af op één plek die we zorgvuldig kiezen.",
        },
        {
          title: "Chef's special voor de groep",
          description:
            "De chef maakt specials voor iedereen aan tafel. Wijn en spijs zijn op elkaar afgestemd.",
        },
        {
          title: "Girls only of gemengd",
          description:
            "Kies een tafel die bij je past: alleen voor vrouwen, of een gemengde groep waar iedereen welkom is.",
        },
        {
          title: "Toegankelijke uitleg",
          description:
            "Onze host deelt achtergrond over de wijnen zonder dat het een examen wordt.",
        },
        {
          title: "Op eigen tempo",
          description:
            "Reken op twee tot drie uur. Geen strak schema, ruimte om te proeven, praten en na te genieten.",
        },
        {
          title: "Aanpassen op verzoek",
          description:
            "Dieetwensen of voorkeuren? Meld het bij boeken, dan stemmen we met de chef af waar mogelijk.",
        },
      ],
      socialParagraphs: [
        "Je schuift aan bij mensen die ook zin hebben in een avond uit. Soms alleen, soms met vrienden of op date. Het is superleuk als de chef je verrast met de volgende special of het glas dat erbij past, en het gesprek loopt vanzelf.",
        "Je hoeft niets te bewijzen en niemand zit er voor zakelijke contacten. Of je nu veel van wijn weet of vooral nieuwsgierig bent: iedereen proeft, eet en praat op gelijke hoogte. De hele avond op één plek maakt het rustig en persoonlijk.",
      ],
      gallery: [
        images.wineBar,
        images.wineGlasses,
        images.restaurantInterior,
        images.cheers,
        images.heroMain,
        images.restaurantDining,
      ],
      duration: "2 tot 3 uur, op eigen tempo",
      included: "Wijnproeverij, chef's special bites en host aan tafel",
      faq: [
        {
          question: "Wat is het verschil tussen girls only en gemengd?",
          answer:
            "Bij girls only schuiven alleen vrouwen aan. Bij een gemengde groep is iedereen welkom, solo, met vrienden of op date.",
        },
        {
          question: "Wat is een chef's special?",
          answer:
            "De chef bereidt gerechten en pairings speciaal voor jouw tafel. Geen standaard à-la-carte, wel iets dat bij de wijn en de groep past.",
        },
        {
          question: "Kan ik dieetwensen doorgeven?",
          answer:
            "Ja. Geef het bij boeken door. De chef past de specials aan waar dat kan.",
        },
        {
          question: "Kan ik bijbestellen?",
          answer:
            "Aan tafel kun je vaak extra bestellen, bijvoorbeeld een extra gang, bite of glas. Sommige partnerlocaties verkopen ook de volledige fles van een wijn die je lekker vond. Dat verschilt per restaurant; de host of bediening legt het je uit.",
        },
        {
          question: "Waar vindt de proeverij plaats?",
          answer:
            "In één partnerrestaurant per stad. De exacte locatie staat op je boekingsbevestiging.",
        },
        {
          question: "Kan ik annuleren of ruilen?",
          answer:
            "Annuleren is niet mogelijk. Wel kun je gratis ruilen naar een andere datum tot 48 uur voor de start. Alles betaal je vooraf bij het reserveren. Mail ons als je wilt ruilen.",
        },
      ],
    },
  },
};
