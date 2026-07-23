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
  heroBenefitBullets: [
    "Vier wijnen + gepaarde bites aan tafel",
    "Kom solo of samen, wij regelen je plek",
    "Alles vooraf betaald, geen rekening aan tafel",
  ],
  pillSoloTogether: "Kom alleen of samen",
  perPerson: "€{price} per persoon",
  perPersonFrom: "Vanaf €{price} per persoon",
  includedEyebrow: "Wat zit erin",
  includedTitle: "Alles geregeld voor één middag uit",
  includedSubtitle:
    "Eén restaurant, één tafel. Jij hoeft alleen op te komen dagen, wij regelen wijn, bites en gezelschap.",
  includedItems: [
    { value: "4", label: "wijnen" },
    { value: "4", label: "bites" },
    { value: "1", label: "restaurant" },
    { value: "100%", label: "vooraf betaald" },
  ],
  aboutTitle: "Over deze ervaring",
  expectTitle: "Wat kun je verwachten?",
  flowEyebrow: "Goed om te weten",
  flowTitle: "Hoe werkt het?",
  flowExpandCta: "Bekijk alle stappen",
  venuesTitle: "Waar je aan tafel schuift",
  venuesSubtitle:
    "Bezoek een van onze partnerrestaurants. Superleuk aan tafel: de chef bereidt specials die je verassen, met wijn en spijs op één plek.",
  guestQuotesTitle: "Wat gasten zeggen",
  guestQuotesEyebrow: "Echte verhalen",
  midCtaEyebrow: "Kaartjes kopen",
  midCtaTitle: "Klaar om te boeken?",
  midCtaTrustLine:
    "Gratis ruilen tot 48 uur van tevoren · Alles vooraf betaald · Dieetwensen mogelijk",
  routeTitle: "Een middag door {city}",
  routeMapEyebrow: "Een indruk van de route",
  routeMapTitle: "Langs deze plekken in {city}",
  routeSubtitle:
    "Zo krijg je alvast een beeld van de sfeer en de buurt. Alle stops en adressen staan op deze pagina. Een dag van tevoren mailen we je ze nog even.",
  socialTitle: "Een zondagmiddag uit, op jouw manier.",
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
  bookingTiers: {
    legend: "Hoe kom je?",
    perPerson: "€{price} p.p.",
    perPersonFrom: "Vanaf €{price} p.p.",
    bestValue: "Beste keuze",
    mostChosen: "Meest gekozen",
    seatOne: "1 plek",
    seatOther: "{count} plekken",
    seatsFrom: "Vanaf {count} plekken",
    groupSeatsLabel: "Aantal plekken",
    seatsJoinOthers: "schuif aan bij anderen",
    seatsOwnTable: "jullie eigen tafel",
    soloTitle: "Solo & schuif aan",
    duoTitle: "Twee is feest, schuif aan",
    groupTitle: "Jullie eigen tafel",
    soloCta: "Reserveer mijn plek",
    duoCta: "Reserveer onze plekken",
    groupCta: "Reserveer de tafel",
  },
  bookingSeatingLabel: "Met wie kom je?",
  bookingSeatingOwn: "Gewoon wij, eigen tafel",
  bookingSeatingOwnHint: "Jullie tafel, jullie crew. Wijn, bites, geen vreemden.",
  bookingSeatingJoin: "Ik schuif aan bij anderen",
  bookingSeatingJoinHint: "Solo of met een vriendin. Nieuwe gezichten, makkelijk gesprek.",
  bookingTableLanguageLabel: "Waarin praten we lekker?",
  bookingTableLanguageHint:
    "Zowel Nederlands als Engels is prima, zolang het maar gezellig blijft aan tafel.",
  bookingTableLanguageBoth: "Nederlands, Engels, of een mix",
  bookingTableLanguagePreferDutch: "Liever vooral Nederlands",
  bookingStepNext: "Volgende",
  bookingStepBack: "Terug",
  bookingFemaleOnlyNote: "Deze tafel is alleen voor vrouwen.",
  bookingPriorityList:
    "Zet me op de wachtlijst. Ik hoor als eerste over nieuwe tafels en krijg een mooie korting.",
  bookingMediaConsent:
    "Tijdens het event kunnen foto's en video's gemaakt worden voor MyTable (website, socials en e-mail).",
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
    dayOfWeek: "Dag",
    partOfDay: "Dagdeel",
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
      tagline: "Vier wijnen en bite-pairings, gezellig aan één tafel.",
      experienceFlow: tastingFlowNl,
      guestQuotes: tastingQuotesNl,
      description:
        "Op zondagmiddag schuif je aan tafel voor vier wijnen met bite-pairings, gekozen door de wijnbar. Geen wijnexamen, wel een gezellige middag met je tafel. Plan gerust de hele middag. Vaak houdt de groep het daarna nog vast: nawijnen, borrelen of ergens uit eten.",
      whatToExpect: [
        {
          title: "Eén wijnbar, één tafel",
          description:
            "Alles speelt zich af op één plek. Jij komt voor de middag, wij regelen de rest rond de tafel.",
        },
        {
          title: "Vier wijnen, gekozen door de wijnbar",
          description:
            "De wijnbar stelt de proeverij samen: vier wijnen met bijpassende bite-pairings.",
        },
        {
          title: "Gezellig met je tafel",
          description:
            "Boek met vrienden of op date, of kom solo en schuif aan bij anderen die ook zin hebben in een gezellige zondagmiddag.",
        },
        {
          title: "Op eigen tempo",
          description:
            "Plan de hele middag in. Geen strak schema. En soms pakt de groep het zelf nog lekker vast met nawijnen of ergens uit eten.",
        },
        {
          title: "Aanpassen op verzoek",
          description:
            "Dieetwensen of voorkeuren? Meld het bij boeken, dan stemmen we af waar mogelijk.",
        },
      ],
      socialParagraphs: [
        "Boek je eigen tafel met vrienden, kom alleen of schuif aan bij mensen die ook zin hebben in een gezellige zondagmiddag.",
        "Proeven, lachen, bijpraten. Niemand kijkt hoeveel je van wijn weet; iedereen is gewoon nieuwsgierig.",
      ],
      gallery: [
        images.wineBar,
        images.wineGlasses,
        images.restaurantInterior,
        images.cheers,
        images.heroMain,
        images.restaurantDining,
      ],
      dayOfWeek: "Altijd op zondag",
      partOfDay: "Middag",
      duration: "Hele middag, op eigen tempo",
      included: "Vier wijnen met bite-pairings, gekozen door de wijnbar",
      faq: [
        {
          question: "Wat is het verschil tussen girls only en gemengd?",
          answer:
            "Bij girls only schuiven alleen vrouwen aan. Bij een gemengde groep is iedereen welkom, solo, met vrienden of op date.",
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
          question: "Wanneer zijn de events?",
          answer:
            "Altijd op zondag, in de middag, meestal tussen 12:00 en 17:00. De exacte tijd staat op je tafelkaart en in je bevestigingsmail.",
        },
        {
          question: "Kan ik annuleren of ruilen?",
          answer:
            "Annuleren is niet mogelijk. Wel kun je gratis ruilen naar een andere datum tot 48 uur voor de start. Alles betaal je vooraf bij het reserveren. Mail ons als je wilt ruilen.",
        },
      ],
    },
    wineWalk: {
      tagline: "De stad ontdekken: meerdere locaties, telkens wijn en spijs.",
      description:
        "Een Wine Walk bij MyTable is een zondagmiddag door de stad. Je bezoekt meerdere locaties en proeft bij elke stop wijn met spijs. Zo ontdek je nieuwe plekken op een natuurlijke manier: wandelen, proeven, bijpraten. Geen strakke rondleiding, wel een route met karakter.",
      experienceFlow: wineWalkFlowNl,
      guestQuotes: wineWalkQuotesNl,
      whatToExpect: [
        {
          title: "Meerdere locaties in de stad",
          description:
            "Je bezoekt verschillende plekken en ontdekt zo de stad door te proeven.",
        },
        {
          title: "Wijn en spijs bij elke stop",
          description: "Bij elke locatie staat een pairing klaar om te proeven.",
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
      dayOfWeek: "Altijd op zondag",
      partOfDay: "Middag",
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
          question: "Wanneer zijn de wine walks?",
          answer:
            "Altijd op zondag, overdag in de middag. De exacte tijd staat op je tafelkaart en in je bevestigingsmail.",
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
      tagline: "Het beste van het restaurant, family style op zondagavond.",
      description:
        "Chef's Table is een zondagavond waarbij je het restaurant leert kennen zoals de chef het bedoeld heeft. Meerdere voorgerechten, hoofdgerechten en een dessert komen family style op tafel: gedeeld met je tafel, zodat iedereen meer kan proeven. Geen keuzestress, wel het beste van de keuken in één avond.",
      experienceFlow: chefsSpecialFlowNl,
      guestQuotes: tastingQuotesNl,
      whatToExpect: [
        {
          title: "Meerdere gangen, family style",
          description:
            "Voorgerechten, hoofdgerechten en dessert komen in het midden van de tafel. Iedereen deelt en proeft mee.",
        },
        {
          title: "Het beste van de keuken",
          description:
            "De chef stelt de avond samen, zodat je meer van het restaurant proeft dan met één eigen bord.",
        },
        {
          title: "Eén restaurant, één tafel",
          description:
            "Alles speelt zich af op één plek. Vaak aan een lange, gedeelde tafel.",
        },
        {
          title: "Goede sfeer aan tafel",
          description: "Kleine groep, ontspannen gesprek, eten dat je samen deelt.",
        },
        {
          title: "Kom alleen of samen",
          description: "Alleen komen is heel normaal en welkom.",
        },
        {
          title: "Geen keuzestress",
          description:
            "Jij hoeft geen menu samen te stellen. De chef bepaalt wat er komt.",
        },
      ],
      socialParagraphs: [
        "Eigen tafel met je vrienden of erbij gaan zitten: beide kan. Gerechten in het midden, gesprekken die vanzelf komen, een avond waarin je samen proeft.",
        "Klein genoeg om het gezellig te houden, relaxed genoeg om gewoon jezelf te zijn. Of je nu veel of weinig van eten weet: iedereen deelt mee.",
      ],
      gallery: [
        images.restaurantDining,
        images.restaurantInterior,
        images.wineGlasses,
        images.cheers,
        images.wineBar,
        images.heroMain,
      ],
      dayOfWeek: "Altijd op zondag",
      partOfDay: "Avond",
      duration: "Ongeveer 2,5 tot 3 uur",
      included:
        "Meerdere voorgerechten, hoofdgerechten en dessert, family style gedeeld aan tafel",
      faq: [
        {
          question: "Weet ik vooraf wat ik eet?",
          answer:
            "Soms wel, soms niet. Bij Chef's Table stelt de chef de avond samen. Als er een vast menu is, tonen we dit op de pagina.",
        },
        {
          question: "Wat betekent family style?",
          answer:
            "Gerechten komen in het midden van de tafel, zodat je met je tafel deelt. Zo proef je meer van het restaurant: meerdere voorgerechten, hoofdgerechten en dessert.",
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
          question: "Wanneer zijn de Chef's Tables?",
          answer:
            "Altijd op zondag, in de avond. De exacte tijd staat op je tafelkaart en in je bevestigingsmail.",
        },
        {
          question: "Is dit fine dining?",
          answer:
            "Niet per se. Chef's Table betekent vooral dat je family style het beste van de keuken proeft, samen met je tafel.",
        },
      ],
    },
  },
};
