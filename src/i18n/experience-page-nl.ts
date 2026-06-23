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
    "Bezoek een van onze partnerrestaurants. Superleuk aan tafel: de chef bereidt specials die je verassen, met wijn en spijs op één plek.",
  guestQuotesTitle: "Wat gasten zeggen",
  routeTitle: "Een middag door {city}",
  routeMapEyebrow: "Een indruk van de route",
  routeMapTitle: "Langs deze plekken in {city}",
  routeSubtitle:
    "Zo krijg je alvast een beeld van de sfeer en de buurt. Alle stops en adressen staan op deze pagina. Een dag van tevoren mailen we je ze nog even.",
  socialTitle: "Een avond uit, op jouw manier.",
  socialSubtitle:
    "Eigen tafel, alleen komen of aanschuiven bij anderen. Jij kiest hoe gezellig het wordt.",
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
  bookingEmail: "E-mail",
  bookingName: "Naam",
  bookingDietary: "Iets dat we moeten weten over eten?",
  bookingDietaryPlaceholder: "Allergie, vegetarisch, geen vis…",
  bookingSeatingLabel: "Met wie kom je?",
  bookingSeatingOwn: "Gewoon wij, eigen tafel",
  bookingSeatingOwnHint: "Jullie tafel, jullie crew. Wijn, bites, geen vreemden.",
  bookingSeatingJoin: "Ik schuif aan bij anderen",
  bookingSeatingJoinHint: "Solo of met een vriendin. Nieuwe gezichten, makkelijk gesprek.",
  bookingTableLanguageLabel: "Waarin praten we lekker?",
  bookingTableLanguageBoth: "Nederlands, Engels, of een mix",
  bookingTableLanguagePreferDutch: "Liever vooral Nederlands",
  bookingStepNext: "Volgende",
  bookingStepBack: "Terug",
  bookingFemaleOnlyNote: "Deze tafel is alleen voor vrouwen.",
  bookingMediaConsent:
    "Door je boeking af te ronden stem je ermee in dat tijdens de avond foto's en video's kunnen worden gemaakt en gebruikt voor MyTable-marketing, waaronder onze website, social media, e-mail en online advertenties.",
  bookingMediaConsentReadMore: "Meer in onze",
  bookingMediaConsentTerms: "algemene voorwaarden",
  bookingMediaConsentPrivacy: "privacyverklaring",
  bookingMediaConsentAnd: "en",
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
    closed: "Uitverkocht",
    new: "Nieuw in ons aanbod",
  },
  closedCta: "Uitverkocht",
  moods: {
    tastings: {
      tagline: "Wijnproeverij aan één tafel, girls only of gemengde groep",
      experienceFlow: tastingFlowNl,
      guestQuotes: tastingQuotesNl,
      description:
        "Je schuift aan tafel, proeft meerdere wijnen met bijpassende bites en eet wat de chef als special voor de tafel bereidt. Geen wijnles, wel context en ruimte om op je eigen tempo te genieten, meestal twee tot drie uur.",
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
          title: "Maak je eigen tafel of sluit aan",
          description:
            "Boek een plek met vrienden of op date, of kom solo en schuif aan bij anderen die ook zin hebben in een gezellige avond.",
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
        "Boek je eigen tafel met vrienden, kom alleen of schuif aan bij mensen die ook zin hebben in een gezellige avond.",
        "Proeven, lachen, bijpraten zonder gedoe. Niemand kijkt hoeveel je van wijn weet; iedereen is gewoon nieuwsgierig.",
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
        "Met je eigen groep of gewoon meelopen. Onderweg kom je andere mensen tegen die ook zin hebben in een leuke middag.",
        "Lopen, proeven, lachen. Geen saaie rondleiding: fijne stops en ruimte om te praten wanneer jij daar zin in hebt.",
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
        "Eigen tafel met je vrienden of erbij gaan zitten: beide kan. Lekker eten, goede sfeer, mensen die ook zin hebben in een avond uit.",
        "Klein genoeg om het gezellig te houden, relaxed genoeg om gewoon jezelf te zijn. Of je nu veel of weinig weet van wijn: iedereen doet lekker mee.",
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
