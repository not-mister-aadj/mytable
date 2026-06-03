import type { ExperiencePageLabels } from "./types";
import { images } from "@/data/images";
import { tastingFlowNl, tastingQuotesNl } from "./experience-mood-blocks-nl";

export const experiencePageNl: ExperiencePageLabels = {
  viewTableCta: "Bekijk tafel",
  secondaryCta: "Terug naar agenda",
  agendaCta: "Bekijk agenda",
  heroTrustBar: "★★★★★ 4.8 · 1200+ gasten aan tafel sinds 2024",
  heroTrustFooter:
    "Gratis annuleren tot 48 uur van tevoren · Kleine groepen · Gehoste ervaring",
  heroSpotsHint: "Nog {count} plekken voor deze datum",
  pillSoloTogether: "Kom alleen of samen",
  perPerson: "€{price} per persoon",
  aboutTitle: "Over deze ervaring",
  expectTitle: "Wat kun je verwachten?",
  flowTitle: "Hoe verloopt de ervaring?",
  venuesTitle: "Waar je aan tafel schuift",
  venuesSubtitle:
    "Eén partnerrestaurant per avond. De chef bereidt specials voor de groep — wijn en spijs op één plek.",
  guestQuotesTitle: "Wat gasten zeggen",
  routeTitle: "Een middag door {city}",
  routeMapEyebrow: "Zoek op de kaart",
  routeMapTitle: "Een wandeling langs deze restaurants",
  routeSubtitle:
    "Je loopt op ontspannen tempo langs zorgvuldig gekozen stops. De exacte route ontvang je na boeking.",
  routeOpenInApple: "Open route in Kaarten",
  routeMapSetupHint:
    "Voorkeursweergave: Apple Kaarten (MapKit). Voeg credentials toe voor de volledige kaart.",
  socialTitle: "Geen ongemakkelijke networking. Gewoon een goede tafel.",
  socialSubtitle:
    "MyTable draait om ontspannen ontmoetingen, goede gesprekken en een tafel waar iedereen zich welkom voelt.",
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
    "Gratis annuleren tot 48 uur vooraf",
    "Kleine groepen & ontspannen sfeer",
    "Kom alleen of samen",
    "Gehoste ervaring",
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
    cancellation: "Annuleren",
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
    cancellation:
      "Gratis annuleren tot 48 uur van tevoren, daarna wordt het bedrag omgezet in tegoed",
    weather: "De proeverij vindt plaats binnen in het restaurant.",
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
      tagline: "Wijnproeverij aan één tafel — girls only of gemengde groep",
      experienceFlow: tastingFlowNl,
      guestQuotes: tastingQuotesNl,
      description:
        "MyTable start met wijnproeverijen in één restaurant. Je schuift aan bij een kleine groep, proeft meerdere wijnen met bijpassende bites en eet wat de chef als special voor de tafel bereidt. Geen wijnles, wel context en ruimte om op je eigen tempo te genieten — meestal twee tot drie uur.",
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
            "Reken op twee tot drie uur. Geen strak schema — ruimte om te proeven, praten en na te genieten.",
        },
        {
          title: "Aanpassen op verzoek",
          description:
            "Dieetwensen of voorkeuren? Meld het bij boeken, dan stemmen we met de chef af waar mogelijk.",
        },
      ],
      socialParagraphs: [
        "Proeverijen trekken mensen aan die houden van ontdekken zonder gedoe. Het gesprek gaat van smaak naar favoriete plekken in de stad, en vaak verder. Omdat je de hele avond op één plek blijft, voelt alles rustig en persoonlijk.",
        "Of je nu veel proeft of voor het eerst serieus naar wijn kijkt, iedereen start op gelijke hoogte. Het gaat om nieuwsgierigheid, niet om kennis. Daardoor ontstaan gesprekken die verder gaan dan alleen wat er in je glas zit.",
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
            "Bij girls only schuiven alleen vrouwen aan. Bij een gemengde groep is iedereen welkom — solo, met vrienden of op date.",
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
          question: "Hoeveel glazen proef ik?",
          answer:
            "Meestal tussen de vijf en zeven proefmomenten met bijpassende bites van de chef.",
        },
        {
          question: "Waar vindt de proeverij plaats?",
          answer:
            "In één partnerrestaurant per stad. De exacte locatie staat op je boekingsbevestiging.",
        },
      ],
    },
  },
};
