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
  viewTableCta: "Plan je tafel",
  secondaryCta: "Terug naar agenda",
  heroTrustBar: "★★★★★ 4.8 · 1200+ gasten aan tafel sinds 2024",
  heroTrustFooter:
    "Alles vooraf betaald · Gratis ruilen tot 48 uur van tevoren · Dieetwensen mogelijk",
  heroSpotsHint: "Nog {count} plekken voor deze datum",
  heroBenefitBullets: [
    "Vier wijnen + gepaarde bites aan tafel",
    "Boek voor jezelf of je eigen gezelschap",
    "Alles vooraf betaald, geen rekening aan tafel",
  ],
  pillSoloTogether: "Boek je tickets",
  perPerson: "€{price} per persoon",
  perPersonFrom: "Vanaf €{price} per persoon",
  includedEyebrow: "Wat zit erin",
  includedTitle: "Alles geregeld voor één middag uit",
  includedSubtitle:
    "Eén restaurant, één tafel. Jij boekt vooraf; wij regelen wijn, hapjes en de ervaring.",
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
  venuesTitle: "De restaurants",
  venuesSubtitle:
    "Bij een partnerrestaurant aan tafel: specials van de chef, met wijn en spijs op één plek.",
  guestQuotesTitle: "Wat gasten zeggen",
  guestQuotesEyebrow: "Ervaringen",
  midCtaEyebrow: "Kaartjes kopen",
  midCtaTitle: "Klaar om te boeken?",
  midCtaTrustLine:
    "Gratis ruilen tot 48 uur van tevoren · Alles vooraf betaald · Dieetwensen mogelijk",
  routeTitle: "Een middag door {city}",
  routeMapEyebrow: "De route",
  routeMapTitle: "Langs deze plekken in {city}",
  routeSubtitle:
    "Alle stops staan op deze pagina. Een dag van tevoren mailen we de details nog even.",
  socialTitle: "Jouw avond, onze organisatie.",
  socialSubtitle:
    "Boek tickets voor jezelf, een date, vrienden of een groep. Wij regelen wijn, eten en de locatie.",
  galleryTitle: "Sfeerimpressie",
  practicalTitle: "Praktische info",
  faqTitle: "Veelgestelde vragen",
  relatedTitle: "Meer ervaringen",
  finalCtaHeadline: "Reserveer je plek voor goede wijn en spijs.",
  finalCtaSubheadline:
    "Chef's special of proeverij: één restaurant, alles vooraf geregeld.",
  finalCtaPrimary: "Reserveer je plek",
  finalCtaSecondary: "Bekijk andere data",
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
    legend: "Aantal tickets",
    perPerson: "€{price} p.p.",
    perPersonFrom: "€{price} p.p.",
    bestValue: "Aanbevolen",
    mostChosen: "Meest gekozen",
    seatOne: "1 plek",
    seatOther: "{count} plekken",
    seatsFrom: "Vanaf {count} plekken",
    groupSeatsLabel: "Aantal tickets",
    seatsJoinOthers: "ticket",
    seatsOwnTable: "jullie zitten samen",
    seatingTogetherHint:
      "Minimaal 2 tickets. Je zit met wie je meeneemt.",
    soloTitle: "Alleen ik",
    duoTitle: "Met z'n tweeën",
    groupTitle: "Met een groep",
    tableTitle: "Reserveer een tafel",
    soloCta: "Reserveer mijn plek",
    duoCta: "Reserveer onze plekken",
    groupCta: "Reserveer onze plekken",
    tableCta: "Reserveer de tafel",
  },
  bookingSeatingLabel: "Met wie kom je?",
  bookingSeatingOwn: "Eigen gezelschap",
  bookingSeatingOwnHint: "Jullie tafel, jullie groep. Wijn en hapjes inbegrepen.",
  bookingSeatingJoin: "Individueel",
  bookingSeatingJoinHint: "Boek één of meer tickets voor jezelf.",
  bookingTableLanguageLabel: "Voorkeurstaal aan tafel",
  bookingTableLanguageHint:
    "Handig voor de bediening. Nederlands en Engels zijn beide mogelijk.",
  bookingTableLanguageBoth: "Nederlands, Engels, of een mix",
  bookingTableLanguagePreferDutch: "Liever vooral Nederlands",
  bookingStepNext: "Volgende",
  bookingStepBack: "Terug",
  bookingFemaleOnlyNote: "Deze ervaring is alleen voor vrouwen.",
  bookingPriorityList:
    "Zet me op de wachtlijst. Ik hoor als eerste over nieuwe data en krijg een mooie korting.",
  bookingMediaConsent:
    "Tijdens het event kunnen foto's en video's gemaakt worden voor MyTable (website, socials en e-mail).",
  bookingMediaConsentReadMore: "Meer in onze",
  bookingMediaConsentTerms: "algemene voorwaarden",
  bookingMediaConsentPrivacy: "privacyverklaring",
  bookingMediaConsentAnd: "en",
  spotsLeftBadge: "Nog {count} plekken beschikbaar",
  bookingViewsLabel: "{count} mensen bekeken deze ervaring deze week",
  bookingTrustBullets: [
    "Alles vooraf betaald",
    "Gratis ruilen tot 48 uur van tevoren",
    "Dieetwensen mogelijk",
    "Boek voor jezelf of je groep",
  ],
  trustLines: [
    "Geselecteerde restaurants en hosts",
    "Boek voor jezelf of je eigen gezelschap",
    "Wijn, spijs en sfeer, vooraf geregeld",
  ],
  practicalLabels: {
    dayOfWeek: "Dag",
    partOfDay: "Dagdeel",
    startTime: "Starttijd",
    duration: "Duur",
    city: "Stad",
    included: "Inbegrepen",
    dietary: "Dieetwensen",
    solo: "Individueel boeken",
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
    solo: "Je boekt tickets voor jezelf of je gezelschap",
    payment: "Alles betaal je vooraf bij het reserveren.",
    exchange:
      "Gratis ruilen naar een andere datum tot 48 uur voor de start. Annuleren is niet mogelijk.",
    weather:
      "Meestal binnen in het restaurant. Bij mooi weer en een beschikbaar terras kan de tafel daar plaatsvinden.",
    arrival:
      "Kom 10 minuten voor starttijd. De host of bediening wijst je je plek.",
    routeReveal:
      "Het restaurant en adres ontvang je per e-mail na bevestiging van je boeking.",
    groupSize: "Afhankelijk van het format; details staan op de eventpagina",
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
      tagline: "Vier wijnen en bite-pairings aan één tafel.",
      experienceFlow: tastingFlowNl,
      guestQuotes: tastingQuotesNl,
      description:
        "Op zondagmiddag zit je aan tafel voor vier wijnen met bite-pairings, gekozen door de wijnbar. Geen wijnexamen: een proeverij op één plek, vooraf betaald, op eigen tempo.",
      whatToExpect: [
        {
          title: "Eén wijnbar, één tafel",
          description:
            "Alles speelt zich af op één plek. Jij boekt vooraf; wij regelen wijn, hapjes en de organisatie.",
        },
        {
          title: "Vier wijnen, gekozen door de wijnbar",
          description:
            "De wijnbar stelt de proeverij samen: vier wijnen met bijpassende bite-pairings.",
        },
        {
          title: "Met je eigen gezelschap",
          description:
            "Boek tickets voor jezelf, een date, vrienden of een groep. Je zit met wie je meeneemt.",
        },
        {
          title: "Op eigen tempo",
          description:
            "Plan de middag in. Geen strak schema. Extra bestellen kan vaak aan tafel.",
        },
        {
          title: "Aanpassen op verzoek",
          description:
            "Dieetwensen of voorkeuren? Meld het bij boeken, dan stemmen we af waar mogelijk.",
        },
      ],
      socialParagraphs: [
        "Boek tickets voor je eigen gezelschap. Wij regelen de proeverij, de locatie en de organisatie.",
        "Proeven zonder wijnkennis. Alles is vooraf betaald; jij komt genieten.",
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
          question: "Zit ik met onbekenden?",
          answer:
            "Nee. Je boekt tickets voor jezelf of je gezelschap. Matching met nieuwe mensen gebeurt alleen via Clubmember en Sunday Table, niet op deze ervaring.",
        },
        {
          question: "Kan ik dieetwensen doorgeven?",
          answer:
            "Ja. Geef het bij boeken door. De chef past de specials aan waar dat kan.",
        },
        {
          question: "Kan ik bijbestellen?",
          answer:
            "Aan tafel kun je vaak extra bestellen, bijvoorbeeld een extra gang, bite of glas. Sommige partnerlocaties verkopen ook de volle fles. Dat verschilt per restaurant; de bediening legt het uit.",
        },
        {
          question: "Waar vindt de proeverij plaats?",
          answer:
            "In één partnerrestaurant per stad. De exacte locatie staat op je boekingsbevestiging.",
        },
        {
          question: "Wanneer zijn de events?",
          answer:
            "Meestal op zondag in de middag. De exacte tijd staat op de eventpagina en in je bevestigingsmail.",
        },
        {
          question: "Kan ik annuleren of ruilen?",
          answer:
            "Annuleren is niet mogelijk. Wel kun je gratis ruilen naar een andere datum tot 48 uur voor de start. Alles betaal je vooraf. Mail ons als je wilt ruilen.",
        },
      ],
    },
    wineWalk: {
      tagline: "Meerdere restaurants, telkens wijn en spijs.",
      description:
        "Een Wine Walk is een culinaire wandeling door de stad. Je bezoekt meerdere restaurants en proeft bij elke stop een pairing. Geen gidsrondleiding: een vaste route met je eigen gezelschap, op rustig tempo.",
      experienceFlow: wineWalkFlowNl,
      guestQuotes: wineWalkQuotesNl,
      whatToExpect: [
        {
          title: "Meerdere restaurants",
          description:
            "Je bezoekt verschillende plekken en ontdekt de stad door te proeven.",
        },
        {
          title: "Wijn en spijs bij elke stop",
          description: "Bij elke locatie staat een pairing klaar.",
        },
        {
          title: "Rustig wandeltempo",
          description: "Geen haast tussen de locaties. Afstanden blijven overzichtelijk.",
        },
        {
          title: "Met je eigen gezelschap",
          description:
            "Je loopt en proeft met wie je hebt geboekt. Geen matching met andere gasten.",
        },
        {
          title: "Alles vooraf geregeld",
          description:
            "Tickets, route en pairings zijn vooraf betaald en georganiseerd.",
        },
      ],
      socialParagraphs: [
        "Boek voor jezelf, een duo of een groep. Onderweg volg je de route met je eigen gezelschap.",
        "Wandelen, proeven, verder. Geen saaie rondleiding: heldere stops en ruimte op jullie tempo.",
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
      included: "Wijn-spijs pairings en route",
      walkingDistance: "Meestal 2 tot 4 km, afhankelijk van de stad",
      faq: [
        {
          question:
            "Wat is het verschil tussen een wijnspijs-wandeling en een foodwandeling?",
          answer:
            "Bij een wijnspijs-wandeling (Wine Walk) ligt de nadruk op de wijnen, met bij elke stop een bijpassende pairing. Bij een foodwandeling staat het eten centraal. Er kunnen bijpassende wijnen bij zitten, maar die zijn optioneel: je kunt de wandeling ook zonder wijnen genieten.",
        },
        {
          question: "Kan ik alleen boeken?",
          answer:
            "Ja. Je boekt tickets voor jezelf. Je volgt de route met je eigen gezelschap; wij matchen je niet met andere gasten.",
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
            "Meestal op zondag overdag. De exacte tijd staat op de eventpagina en in je bevestigingsmail.",
        },
        {
          question: "Wanneer krijg ik de route?",
          answer:
            "Je ontvangt de praktische informatie en startlocatie vooraf. Stops staan ook op deze pagina.",
        },
        {
          question: "Wat als het regent?",
          answer:
            "De ervaring gaat meestal door. Neem bij twijfel een jas of paraplu mee. Het tempo blijft ontspannen.",
        },
      ],
    },
    chefsSpecial: {
      tagline: "Het beste van het restaurant, family style.",
      description:
        "Chef's Table is een avond waarbij je het restaurant leert kennen zoals de chef het bedoeld heeft. Meerdere voor-, hoofd- en nagerechten komen family style op tafel: gedeeld met je gezelschap, zodat iedereen meer kan proeven.",
      experienceFlow: chefsSpecialFlowNl,
      guestQuotes: tastingQuotesNl,
      whatToExpect: [
        {
          title: "Meerdere gangen, family style",
          description:
            "Voorgerechten, hoofdgerechten en dessert komen in het midden van de tafel.",
        },
        {
          title: "Het beste van de keuken",
          description:
            "De chef stelt de avond samen, zodat je meer van het restaurant proeft dan met één eigen bord.",
        },
        {
          title: "Eén restaurant",
          description:
            "Alles speelt zich af op één plek. Jij boekt vooraf voor je gezelschap.",
        },
        {
          title: "Geen keuzestress",
          description:
            "Jij hoeft geen menu samen te stellen. De chef bepaalt wat er komt.",
        },
      ],
      socialParagraphs: [
        "Boek een tafel of tickets voor je eigen gezelschap. Gerechten in het midden, smaak centraal.",
        "Family style zodat je meer van de keuken proeft, zonder zelf te organiseren.",
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
        "Meerdere voorgerechten, hoofdgerechten en dessert, family style",
      faq: [
        {
          question: "Weet ik vooraf wat ik eet?",
          answer:
            "Soms wel, soms niet. Bij Chef's Table stelt de chef de avond samen. Als er een vast menu is, tonen we dit op de pagina.",
        },
        {
          question: "Wat betekent family style?",
          answer:
            "Gerechten komen in het midden van de tafel, zodat je met je gezelschap deelt en meer van de keuken proeft.",
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
          question: "Kan ik alleen boeken?",
          answer:
            "Ja. Je boekt tickets voor jezelf. Je zit met wie je meeneemt, niet met onbekenden.",
        },
        {
          question: "Wanneer zijn de Chef's Tables?",
          answer:
            "Meestal op zondagavond. De exacte tijd staat op de eventpagina en in je bevestigingsmail.",
        },
        {
          question: "Is dit fine dining?",
          answer:
            "Niet per se. Chef's Table betekent vooral dat je family style het beste van de keuken proeft.",
        },
      ],
    },
  },
};
