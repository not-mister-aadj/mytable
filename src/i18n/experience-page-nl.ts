import type { ExperiencePageLabels } from "./types";
import { images } from "@/data/images";
import {
  chefsSpecialFlowNl,
  tastingFlowNl,
  tastingQuotesNl,
  wineWalkFlowNl,
  wineWalkQuotesNl,
} from "./experience-mood-blocks-nl";

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
  socialTitle: "Een fijne avond met anderen. Zonder netwerkdruk.",
  socialSubtitle:
    "Kleine groep, ontspannen tempo — ruimte om te genieten, lachen en praten zoals jij dat wilt.",
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
        "Alleen komen, met vrienden of iemand meenemen: alles kan. De avond heeft een duidelijk kader, maar binnen dat kader bepaal jij je tempo.",
        "Niemand hoeft iets te bewijzen of zit er voor zakelijke contacten. Je deelt een tafel met nieuwsgierige mensen; gesprekken ontstaan vanzelf terwijl je proeft, eet en ontspant.",
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
    wineWalk: {
      tagline: "Een ontspannen wandeling vol wijn, mooie plekken en goed gezelschap.",
      description:
        "Een Wijnwalk bij MyTable is geen rondleiding met script, maar een ontspannen middag door de stad. Je loopt langs plekken met karakter, proeft onderweg iets lekkers en ontmoet mensen op een natuurlijke manier. De route geeft structuur, maar de sfeer blijft los en gezellig.",
      experienceFlow: wineWalkFlowNl,
      guestQuotes: wineWalkQuotesNl,
      whatToExpect: [
        {
          title: "Meerdere geselecteerde locaties",
          description: "Je bezoekt verschillende restaurants en wijnbars in de stad.",
        },
        {
          title: "Wijn en bites onderweg",
          description: "Bij elke stop staat er iets klaar om te proeven.",
        },
        {
          title: "Rustig wandeltempo",
          description: "Geen haast tussen de locaties.",
        },
        {
          title: "Kleine sociale groep",
          description: "Genoeg mensen om gezellig te zijn, niet te groot.",
        },
        {
          title: "Kom alleen of samen",
          description: "Alleen komen is heel normaal en welkom.",
        },
        {
          title: "Geen verplichte smalltalk",
          description: "Ontmoeten voelt natuurlijk door de route en de stops.",
        },
      ],
      socialParagraphs: [
        "Onderweg ontmoet je dezelfde groep bij verschillende momenten. Dat houdt het luchtig: even iets nieuws, dan weer tijd om bij te praten.",
        "Geen verplichte smalltalk of zakelijke vibe. Je beweegt, proeft en lacht op een tempo dat voor iedereen werkt.",
      ],
      gallery: [
        images.wineBar,
        images.wineGlasses,
        images.restaurantInterior,
        images.cheers,
        images.heroMain,
        images.restaurantDining,
      ],
      duration: "Ongeveer 3 tot 4 uur",
      included: "Wijnproeverijen, bites en routebegeleiding",
      walkingDistance: "Meestal 2 tot 4 km, afhankelijk van de stad",
      faq: [
        {
          question: "Kan ik alleen komen?",
          answer:
            "Ja. Veel mensen komen alleen. De route en groep zijn zo ingericht dat je makkelijk met anderen in gesprek komt.",
        },
        {
          question: "Moet ik veel wandelen?",
          answer:
            "Nee. Het tempo is rustig en de afstanden tussen locaties blijven overzichtelijk.",
        },
        {
          question: "Wat is inbegrepen?",
          answer:
            "Per locatie krijg je een wijn, bite of kleine pairing. De exacte invulling kan per stad verschillen.",
        },
        {
          question: "Wanneer krijg ik de route?",
          answer:
            "Je ontvangt de praktische informatie en startlocatie vooraf. De locaties kunnen afhankelijk van het format vooraf of later bekend worden gemaakt.",
        },
        {
          question: "Wat als het regent?",
          answer:
            "De ervaring gaat meestal door. Neem bij twijfel een jas of paraplu mee. We houden het tempo ontspannen.",
        },
      ],
    },
    chefsSpecial: {
      tagline: "Een bijzondere avond aan tafel, samengesteld door de chef.",
      description:
        "Chef's Special draait om een avond waarin je niet alles zelf hoeft te kiezen. Het restaurant bepaalt de richting, de chef maakt iets moois en jij schuift aan bij een tafel met goed gezelschap. Het is een toegankelijke manier om een restaurant anders te beleven.",
      experienceFlow: chefsSpecialFlowNl,
      guestQuotes: tastingQuotesNl,
      whatToExpect: [
        {
          title: "Een speciaal menu of meerdere gangen",
          description: "Het restaurant stelt de avond samen.",
        },
        {
          title: "Eén geselecteerd restaurant",
          description: "Alles speelt zich af op één plek.",
        },
        {
          title: "Goede sfeer aan tafel",
          description: "Kleine groep, ontspannen gesprek.",
        },
        {
          title: "Kom alleen of samen",
          description: "Alleen komen is heel normaal en welkom.",
        },
        {
          title: "Kleine groep",
          description: "Meestal 8 tot 14 gasten.",
        },
        {
          title: "Geen keuzestress",
          description: "De chef of het restaurant bepaalt de invulling.",
        },
      ],
      socialParagraphs: [
        "Je schuift aan bij mensen die ook zin hebben in een avond uit. Het programma geeft houvast; de rest komt vanzelf.",
        "Klein genoeg om elkaar echt te zien, ontspannen genoeg om niet te hoeven presteren. Nieuwsgierig of al ervaren: iedereen zit op gelijk niveau.",
      ],
      gallery: [
        images.restaurantDining,
        images.restaurantInterior,
        images.wineGlasses,
        images.cheers,
        images.wineBar,
        images.heroMain,
      ],
      duration: "Ongeveer 2,5 tot 3 uur",
      included: "Menu of meerdere gangen zoals omschreven op de eventpagina",
      faq: [
        {
          question: "Weet ik vooraf wat ik eet?",
          answer:
            "Soms wel, soms niet. Bij Chef's Special bepaalt het restaurant de invulling. Als er een vast menu is, tonen we dit op de pagina.",
        },
        {
          question: "Zijn drankjes inbegrepen?",
          answer:
            "Alleen als dit duidelijk op de eventpagina staat. Anders betaal je drankjes zelf bij het restaurant.",
        },
        {
          question: "Kan ik dieetwensen doorgeven?",
          answer:
            "Ja. Geef dit door bij het boeken, dan stemmen wij dit af met het restaurant.",
        },
        {
          question: "Kan ik alleen komen?",
          answer:
            "Ja. De tafel is juist ingericht zodat alleen komen normaal en ontspannen voelt.",
        },
        {
          question: "Is dit fine dining?",
          answer:
            "Niet per se. Chef's Special betekent vooral dat het restaurant iets bijzonders samenstelt voor de avond.",
        },
      ],
    },
  },
};
