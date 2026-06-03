import type { ExperiencePageLabels } from "./types";
import { images } from "@/data/images";
import {
  mysteryFlowNl,
  mysteryQuotesNl,
  sharedDinnerFlowNl,
  sharedDinnerQuotesNl,
  sundayFlowNl,
  sundayQuotesNl,
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
    "Gratis annuleren tot 48 uur van tevoren · Kleine groepen · Gehoste ervaring",
  heroSpotsHint: "Nog {count} plekken voor deze datum",
  pillSoloTogether: "Kom alleen of samen",
  perPerson: "€{price} per persoon",
  aboutTitle: "Over deze ervaring",
  expectTitle: "Wat kun je verwachten?",
  flowTitle: "Hoe verloopt de ervaring?",
  venuesTitle: "Ontdek de plekken aan tafel",
  venuesSubtitle:
    "Van verborgen wijnbars tot restaurants met karakter. Iedere stop draait om sfeer, smaak en goed gezelschap.",
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
  finalCtaHeadline: "Schuif aan bij een tafel die je zondag beter maakt.",
  finalCtaSubheadline:
    "Goede wijn, mooie plekken en gesprekken die vanzelf ontstaan.",
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
    dietary: "Geef het door bij boeken, wij stemmen af met de locatie",
    solo: "Alleen aankomen is heel normaal en juist welkom",
    cancellation:
      "Gratis annuleren tot 48 uur van tevoren, daarna wordt het bedrag omgezet in tegoed",
    weather:
      "Bij regen passen we de route aan. Alleen bij extreem weer wijzigen we het programma.",
    arrival:
      "Kom 10 minuten voor starttijd. De host verwelkomt je en wijst de groep aan.",
    routeReveal:
      "De volledige route en adressen ontvang je per e-mail na bevestiging van je boeking.",
    groupSize: "Kleine groepen, meestal 8 tot 14 gasten per tafel",
  },
  spotsByStatus: {
    available: "Nog voldoende plekken beschikbaar",
    almostFull: "Nog enkele plekken over, wees er snel bij",
    soldOut: "Deze tafel is uitverkocht",
    new: "Nieuw in ons aanbod",
  },
  moods: {
    wineWalks: {
      tagline:
        "Een ontspannen zondagmiddag vol wijn, mooie plekken en goed gezelschap.",
      experienceFlow: wineWalkFlowNl,
      guestQuotes: wineWalkQuotesNl,
      description:
        "Een wijnwandeling bij MyTable is geen rondleiding met script, maar een ontspannen middag door de stad. Je loopt langs zorgvuldig gekozen wijnbarretjes en plekken met karakter, proeft bij elke stop iets lekkers en schuift steeds even aan bij een tafel vol nieuw gezelschap. Het tempo is rustig, de sfeer is warm en er is altijd ruimte voor een goed gesprek.",
      whatToExpect: [
        {
          title: "Start met een welkomstdrankje",
          description:
            "We beginnen samen met een glas en een korte intro, zodat iedereen meteen op zijn gemak is.",
        },
        {
          title: "Drie tot vier proefmomenten",
          description:
            "Onderweg proef je wijnen en bijpassende bites bij locaties die we persoonlijk hebben uitgekozen.",
        },
        {
          title: "Rustig wandeltempo",
          description:
            "Geen haast, geen marathon. We nemen de tijd om te proeven, te praten en de stad te zien.",
        },
        {
          title: "Mix van alleenkomers en duo's",
          description:
            "De groep is altijd een fijne mix. Je hoeft niemand te kennen om je meteen thuis te voelen.",
        },
        {
          title: "Host die alles regelt",
          description:
            "Onze host begeleidt de route, introduceert de locaties en zorgt dat de sfeer los en luchtig blijft.",
        },
        {
          title: "Afsluiten met proost",
          description:
            "We eindigen met een laatste glas en vaak blijven mensen nog even napraten. Geen verplicht programma daarna.",
        },
      ],
      socialParagraphs: [
        "Wijnwandelingen zijn misschien wel onze meest ontspannen tafels. Je staat niet stil aan één lange tafel, maar beweegt door de stad en maakt onderweg steeds nieuwe contacten. Dat maakt het makkelijk om in gesprek te raken, zonder dat het geforceerd voelt.",
        "Veel deelnemers komen alleen en gaan weg met nieuwe favoriete plekken in de stad. Soms wisselen mensen contactgegevens uit, soms niet. Beide is prima. Het gaat om een middag waar je je goed voelt, met goede wijn en gezellig gezelschap.",
      ],
      gallery: [
        images.cityWalk,
        images.wineGlasses,
        images.wineBar,
        images.cheers,
        images.heroMain,
        images.restaurantInterior,
      ],
      duration: "Ongeveer 4 uur",
      included: "Wijnproeverijen, bites en begeleiding door de stad",
      walkingDistance: "Ongeveer 3 km, rustig tempo met regelmatige stops",
      faq: [
        {
          question: "Moet ik veel wijnkennis hebben?",
          answer:
            "Helemaal niet. We proeven toegankelijk en legen graag uit wat je proeft, zonder dat het een les wordt.",
        },
        {
          question: "Wat als ik alleen kom?",
          answer:
            "Perfect. Veel deelnemers komen solo en vinden dat juist fijn. Onze hosts zorgen dat iedereen snel aansluit.",
        },
        {
          question: "Zijn de locaties rolstoeltoegankelijk?",
          answer:
            "Dat verschilt per route. Mail ons vooraf als je specifieke wensen hebt, dan kijken we mee naar de beste optie.",
        },
        {
          question: "Wat gebeurt er bij slecht weer?",
          answer:
            "Bij regen passen we de route aan waar nodig. We gaan alleen bij extreem weer over op een alternatief programma.",
        },
      ],
    },
    sharedDinners: {
      tagline: "Eén tafel, nieuwe gezichten, een avond vol smaak",
      experienceFlow: sharedDinnerFlowNl,
      guestQuotes: sharedDinnerQuotesNl,
      description:
        "Bij een gedeeld diner schuif je aan bij één lange tafel in een restaurant dat we zorgvuldig hebben gekozen. Het menu is doordacht, de sfeer is warm en de avond draait om goed eten en open gesprekken. Je hoeft niemand te kennen. Wij zorgen voor de setting, jij geniet van de tafel.",
      whatToExpect: [
        {
          title: "Welkomstdrankje bij aankomst",
          description:
            "Je begint met een glas in de hand, zodat de avond meteen ontspannen van start gaat.",
        },
        {
          title: "Gedeeld menu",
          description:
            "Het restaurant serveert een menu dat past bij de sfeer van de avond, met aandacht voor seizoen en smaak.",
        },
        {
          title: "Lange tafel, open opstelling",
          description:
            "Iedereen zit aan dezelfde tafel. Geen vaste plaatsen, geen speeches, gewoon een avond samen.",
        },
        {
          title: "Mix van alleenkomers en duo's",
          description:
            "De groep is bewust samengesteld zodat gesprekken vanzelf ontstaan en niemand aan de zijkant blijft hangen.",
        },
        {
          title: "Host aanwezig",
          description:
            "Onze host verwelkomt iedereen, introduceert het concept kort en houdt de sfeer luchtig zonder het te sturen.",
        },
        {
          title: "Ruimte om door te praten",
          description:
            "Na het dessert is er geen harde eindtijd. Wie wil blijft nog even zitten, wie wil gaat op tijd weg.",
        },
      ],
      socialParagraphs: [
        "Gedeelde diners zijn bedoeld voor mensen die zin hebben in een mooie avond uit, met eten dat de moeite waard is en gezelschap dat vanzelf meekomt. Het voelt als uit eten gaan met vrienden, alleen ken je ze nog niet.",
        "We houden de groepen bewust klein genoeg voor intimiteit, maar groot genoeg voor variatie. Niemand hoeft te netwerken. Het enige wat we vragen is openheid voor een goed gesprek en een lege maag.",
      ],
      gallery: [
        images.restaurantDining,
        images.longTable,
        images.cheers,
        images.restaurantInterior,
        images.heroMain,
        images.wineGlasses,
      ],
      duration: "Ongeveer 3 uur",
      included: "Welkomstdrankje, driegangenmenu en koffie of thee",
      faq: [
        {
          question: "Kan ik dieetwensen doorgeven?",
          answer:
            "Ja, geef het door bij boeken. Wij stemmen af met het restaurant zodat er rekening mee wordt gehouden.",
        },
        {
          question: "Hoe groot is de groep?",
          answer:
            "Meestal tussen de 10 en 16 personen. Klein genoeg voor echte gesprekken, groot genoeg voor variatie.",
        },
        {
          question: "Wat als ik iemand niet aardig vind?",
          answer:
            "Dat kan gebeuren, net als in het echte leven. De tafel is lang genoeg om je plek te vinden en de sfeer blijft ontspannen.",
        },
        {
          question: "Is de prijs inclusief drank?",
          answer:
            "Welkomstdrankje en koffie of thee zijn inbegrepen. Extra wijn of cocktails bestel je zelf aan tafel.",
        },
      ],
    },
    tastings: {
      tagline: "Proeven, leren en lachen aan een intieme tafel",
      experienceFlow: tastingFlowNl,
      guestQuotes: tastingQuotesNl,
      description:
        "Onze proeverijen zijn kleinschalige sessies in wijnbarren en restaurants waar smaak centraal staat. Je proeft meerdere wijnen of combinaties met bites, krijgt context zonder collegegevoel en ontmoet mensen die net als jij nieuwsgierig zijn naar goede smaken. Het is gezellig, informeel en altijd met aandacht voor kwaliteit.",
      whatToExpect: [
        {
          title: "Intieme groepsgrootte",
          description:
            "We werken met kleine groepen zodat iedereen kan proeven, vragen stellen en meedoen aan het gesprek.",
        },
        {
          title: "Gecureerde proefselectie",
          description:
            "Elke proeverij heeft een thema, bijvoorbeeld een regio, druivenras of seizoenspairing met bites.",
        },
        {
          title: "Toegankelijke uitleg",
          description:
            "Onze host of sommelier deelt achtergrond en tips zonder dat het een examen wordt.",
        },
        {
          title: "Bijpassende bites",
          description:
            "Bij elke proeverij horen kleine gerechtjes die de smaken versterken en de avond compleet maken.",
        },
        {
          title: "Ruimte voor vragen",
          description:
            "Geen domme vragen. Iedereen proeft anders en dat maakt het juist interessant.",
        },
        {
          title: "Ontspannen afsluiting",
          description:
            "Na de laatste proef is er tijd om na te praten, na te bestellen of gewoon te genieten van de sfeer.",
        },
      ],
      socialParagraphs: [
        "Proeverijen trekken mensen aan die houden van ontdekken. Het gesprek gaat van smaak naar favoriete plekken in de stad, en vaak verder. Omdat je aan een tafel zit in plaats van door een zaal te lopen, voelt alles persoonlijk en warm.",
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
      duration: "Ongeveer 2,5 uur",
      included: "Proeverij van wijnen en bijpassende bites",
      faq: [
        {
          question: "Hoeveel glazen proef ik?",
          answer:
            "Dat verschilt per sessie, meestal tussen de vijf en zeven proefmomenten met bijpassende bites.",
        },
        {
          question: "Kan ik als niet-drinker meedoen?",
          answer:
            "Mail ons vooraf. Sommige sessies bieden alcoholvrije alternatieven, afhankelijk van het thema.",
        },
        {
          question: "Is er eten inbegrepen?",
          answer:
            "Ja, bites zijn onderdeel van de proeverij. Het is geen volledig diner, maar je gaat niet met lege maag naar huis.",
        },
        {
          question: "Waar vinden proeverijen plaats?",
          answer:
            "In wijnbarren en restaurants die we persoonlijk selecteren. De exacte locatie staat op je boekingsbevestiging.",
        },
      ],
    },
    sundayTables: {
      tagline: "Zondagse tafels, lang lunchgenot en lichte sfeer",
      experienceFlow: sundayFlowNl,
      guestQuotes: sundayQuotesNl,
      description:
        "Sunday Tables zijn onze langzame zondagen aan tafel. Denk aan een lange lunch of brunch in een mooie zaal, met seizoensgerechten, goede koffie en de rustige energie die alleen een zondag kan geven. Je schuift aan bij mensen die zin hebben in een middag zonder haast, met ruimte voor gesprek en lekker eten.",
      whatToExpect: [
        {
          title: "Lange tafel in daglicht",
          description:
            "We kiezen locaties met veel licht en een warme, uitnodigende sfeer die past bij een lazy Sunday.",
        },
        {
          title: "Seizoensmenu of brunch",
          description:
            "Het menu wisselt per editie, altijd met aandacht voor frisse smaken en mooie presentatie.",
        },
        {
          title: "Koffie, thee en welkom",
          description:
            "Je start met iets warms in de hand terwijl iedereen binnenkomt en plaatsneemt.",
        },
        {
          title: "Ontspannen tempo",
          description:
            "Geen strak schema. Gerechten komen rustig op tafel, zodat je kunt genieten en praten.",
        },
        {
          title: "Mix van gezelschap",
          description:
            "Alleenkomers, vrienden en duo's delen de tafel. De sfeer is open en laagdrempelig.",
        },
        {
          title: "Zachte afsluiting",
          description:
            "Na het dessert is er ruimte om door te praten of de middag rustig af te sluiten.",
        },
      ],
      socialParagraphs: [
        "Zondagtafels voelen als een uitnodiging om even te vertragen. Mensen komen vaak rechtstreeks uit hun weekend en schuiven aan zonder verwachtingen. Het is de perfecte tafel als je zin hebt in gezelligheid zonder de drukte van een vrijdagavond.",
        "Omdat het overdag is, voelt alles lichter. Gesprekken gaan over reizen, favoriete plekken, wat je at afgelopen week. Het is sociaal, maar nooit zwaar. Precies hoe een zondag hoort te voelen.",
      ],
      gallery: [
        images.brunch,
        images.longTable,
        images.restaurantDining,
        images.cheers,
        images.heroMain,
        images.restaurantInterior,
      ],
      duration: "Ongeveer 3 uur",
      included: "Welkomstdrankje, shared lunch of brunch en koffie of thee",
      faq: [
        {
          question: "Is dit een brunch of een lunch?",
          answer:
            "Dat verschilt per editie. Op de detailpagina en in je bevestiging lees je precies wat er op het menu staat.",
        },
        {
          question: "Kan ik met kinderen komen?",
          answer:
            "Onze Sunday Tables zijn gericht op volwassenen. Neem contact op als je een speciale vraag hebt.",
        },
        {
          question: "Hoe laat begint het?",
          answer:
            "Meestal rond het middaguur. De exacte starttijd staat op je boekingsbevestiging.",
        },
        {
          question: "Wat als ik te laat ben?",
          answer:
            "Meld het ons even. We proberen je te laten aansluiten, maar het menu loopt soms door volgens planning.",
        },
      ],
    },
    mysteryTables: {
      tagline: "De locatie blijft verrassing, de sfeer niet",
      experienceFlow: mysteryFlowNl,
      guestQuotes: mysteryQuotesNl,
      description:
        "Bij een Mystery Table weet je van tevoren niet waar je eet, maar wel dat het de moeite waard is. Wij selecteren een restaurant dat past bij de avond, onthullen de locatie kort voor aanvang en zorgen voor een tafel vol nieuw gezelschap. Het voelt als een mini-avontuur, met alle comfort van een MyTable-ervaring.",
      whatToExpect: [
        {
          title: "Locatie onthuld vlak van tevoren",
          description:
            "Je ontvangt de details enkele dagen voor de avond, genoeg tijd om je voor te bereiden zonder het mysterie te verliezen.",
        },
        {
          title: "Gecureerd restaurant",
          description:
            "Elke mystery-locatie is door ons bezocht en past bij onze standaard voor sfeer, kwaliteit en service.",
        },
        {
          title: "Gedeeld diner aan één tafel",
          description:
            "Je eet samen met de groep aan een lange tafel, net als bij onze andere dinerervaringen.",
        },
        {
          title: "Thema of stijl per editie",
          description:
            "Soms is het een verrassende keuken, soms een verborgen parel. Elke avond heeft een eigen karakter.",
        },
        {
          title: "Host die het geheim bewaakt",
          description:
            "Tot de onthulling weet alleen ons team waar je naartoe gaat. Jij hoeft alleen maar te verschijnen.",
        },
        {
          title: "Avond vol verwachting",
          description:
            "Het mysterie maakt de avond luchtig. Mensen praten over gissingen en genieten samen van de verrassing.",
        },
      ],
      socialParagraphs: [
        "Mystery Tables zijn voor mensen die graag iets onverwachts doen, maar wel met zekerheid over kwaliteit. Het geheim zorgt voor een speels begin van de avond, en zodra je binnenstapt voelt alles vertrouwd.",
        "Veel deelnemers komen met open houding en gaan naar huis met een nieuwe favoriete plek die ze zelf misschien nooit hadden gevonden. Dat is precies waarom we dit format maken, verrassing met goede smaak.",
      ],
      gallery: [
        images.mysteryDinner,
        images.restaurantInterior,
        images.cheers,
        images.restaurantDining,
        images.wineBar,
        images.heroMain,
      ],
      duration: "Ongeveer 3 uur",
      included: "Welkomstdrankje, driegangenmenu en locatieverrassing",
      faq: [
        {
          question: "Wanneer hoor ik waar het is?",
          answer:
            "Meestal drie tot vijf dagen voor de avond. Je ontvangt een mail met adres, tijd en praktische tips.",
        },
        {
          question: "Kan ik dieetwensen doorgeven?",
          answer:
            "Ja, geef het door bij boeken. Wij kiezen een locatie die daarmee kan werken en stemmen af met het restaurant.",
        },
        {
          question: "Wat als ik de keuken niet lekker vind?",
          answer:
            "We variëren stijlen per editie. Kijk naar eerdere edities of mail ons als je specifieke voorkeuren hebt.",
        },
        {
          question: "Is het veilig om alleen te komen?",
          answer:
            "Absoluut. Veel deelnemers komen solo. Je bent nooit alleen op straat, en aan tafel ben je direct onderdeel van de groep.",
        },
      ],
    },
  },
};
