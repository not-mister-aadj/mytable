import type { Locale } from "@/i18n/config";
import { blogGuidePosts } from "./blog-guides";
import type { BlogCategoryId, BlogBlock, BlogPost } from "./blog-types";

export type { BlogCategoryId, BlogBlock, BlogPost } from "./blog-types";

export const BLOG_CATEGORIES: Record<
  BlogCategoryId,
  { nl: string; en: string }
> = {
  tips: { nl: "Tips", en: "Tips" },
  "girls-only": { nl: "Girls-only", en: "Girls-only" },
  cities: { nl: "Steden", en: "Cities" },
  "how-it-works": { nl: "Zo werkt het", en: "How it works" },
};

export const BLOG_CATEGORY_ORDER: BlogCategoryId[] = [
  "tips",
  "girls-only",
  "cities",
  "how-it-works",
];

export function isBlogCategoryId(value: string): value is BlogCategoryId {
  return BLOG_CATEGORY_ORDER.includes(value as BlogCategoryId);
}

export function getBlogCategoryCounts(): Record<BlogCategoryId, number> {
  const counts = Object.fromEntries(
    BLOG_CATEGORY_ORDER.map((id) => [id, 0]),
  ) as Record<BlogCategoryId, number>;
  for (const post of blogPosts) {
    counts[post.category] += 1;
  }
  return counts;
}

export const blogPosts: BlogPost[] = [
  ...blogGuidePosts,
  {
    slug: "wijnproeverij-in-rotterdam",
    category: "cities",
    publishedAt: "2026-07-21",
    readMinutes: 9,
    image: "/blog/wijnproeverij-in-rotterdam.png",
    relatedPaths: [
      {
        path: "/girls-only/rotterdam",
        label: {
          nl: "Girls-only in Rotterdam",
          en: "Girls-only in Rotterdam",
        },
      },
      {
        path: "/agenda",
        label: {
          nl: "Bekijk beschikbare tafels",
          en: "See available tables",
        },
      },
    ],
    title: {
      nl: "Wijnproeverij in Rotterdam: sfeer, prijs en hoe te boeken",
      en: "Wine tasting in Rotterdam: vibe, price and how to book",
    },
    excerpt: {
      nl: "Wijnbar, begeleide proeverij of aanschuiven aan een gedeelde tafel? Zo kies je het juiste format in Rotterdam, wat het kost, en wanneer MyTable de slimste optie is.",
      en: "Wine bar, guided tasting or a shared table? How to pick the right format in Rotterdam, what it costs, and when MyTable is the smartest choice.",
    },
    metaDescription: {
      nl: "Wijnproeverij Rotterdam vergeleken: formats, prijzen van €15 tot €80, en waarom MyTable vanaf €39 de makkelijkste girls-only optie is op zondag.",
      en: "Wine tasting Rotterdam compared: formats, prices from €15 to €80, and why MyTable from €39 is the easiest girls-only Sunday option.",
    },
    body: {
      nl: [
        {
          type: "p",
          text: "Op zoek naar een wijnproeverij in Rotterdam, maar weet je niet waar te beginnen? Het aanbod is groter dan je denkt: wijnbars, begeleide groepsproeverijen, thuisproeverijen én een format waarbij je gewoon aanschuift zonder iets te organiseren. Dit artikel zet de opties naast elkaar, zodat je snel weet wat bij jouw gezelschap en budget past.",
        },
        {
          type: "p",
          text: "Het verschil zit zelden in de wijn alleen. Het zit in sfeer, structuur en hoeveel je zelf wilt regelen. Wil je vrijheid aan de bar, uitleg van een sommelier, of een vaste zondagmiddag waar solo aanschuiven volkomen normaal is? Dan weet je straks precies waar je moet zijn.",
        },
        {
          type: "h2",
          text: "Welk format past bij jou?",
        },
        {
          type: "p",
          text: "Niet elke wijnproeverij in Rotterdam voelt hetzelfde. Grofweg zijn er drie smaken.",
        },
        {
          type: "h3",
          text: "Open proeverijen en wijnbars",
        },
        {
          type: "p",
          text: "Jij bepaalt het tempo. Je loopt binnen, kiest wat je proeft en gaat weer wanneer je wilt. Walsjérôt in Blijdorp werkt met wijntaps: een proefslok, een half glas of een vol glas, uit zo'n 70 open wijnen. Geen vaste tijdsindeling, geen groepsdruk. Ideaal als je zonder afspraak wilt ontdekken.",
        },
        {
          type: "h3",
          text: "Begeleide groepsproeverijen",
        },
        {
          type: "p",
          text: "Wil je structuur en uitleg? Dan volg je een vaste wijnlijn met toelichting per glas, vaak met hapjes tussendoor. De meeste aanbieders in Rotterdam vragen een minimumgroep van vier tot vijftien personen. Geschikt voor een vriendinnengroep, verjaardag of bedrijfsuitje. Duur: meestal anderhalf tot twee uur.",
        },
        {
          type: "h3",
          text: "Aanschuiven aan een gedeelde tafel",
        },
        {
          type: "p",
          text: "De derde categorie kennen veel mensen niet: een georganiseerde sociale tafel. Geen wijnbar, geen workshop. Je boekt een plek, verschijnt op tijd, en wijn, bites en tafelmix staan klaar. Dat is wat MyTable doet: girls-only, elke zondagmiddag, in Rotterdam en andere steden.",
        },
        {
          type: "h2",
          text: "Wijnproeverijen in Rotterdam vergeleken",
        },
        {
          type: "h3",
          text: "Walsjérôt: relaxed in je eigen tempo",
        },
        {
          type: "p",
          text: "Walsjérôt op het Bentinckplein komt vaak terug als laagdrempelig én chique. Je koopt een oplaadbare kaart, tapt zelf en leest de uitlegkaartjes bij elk vat. Open woensdag tot vrijdag vanaf 16:00, zaterdag vanaf 14:00 en zondag 14:00 tot 21:00. Check altijd de actuele tijden, die kunnen wijzigen.",
        },
        {
          type: "h3",
          text: "LenselinQ en Het Wijnpakhuis: structuur en verhaal",
        },
        {
          type: "p",
          text: "LenselinQ begeleidt groepen tot twaalf personen, met niveaus van basis tot bijzonder. Denk aan bubbels, zes wijnen en zoute snacks in ongeveer twee uur. Het Wijnpakhuis legt meer nadruk op een Rotterdams verhaal rond wijn en eten, met een minimum rond de vijftien personen. Sterk voor grotere gezelschappen die een avond met verhaal willen.",
        },
        {
          type: "h3",
          text: "Ocean Wine Bar op de ss Rotterdam",
        },
        {
          type: "p",
          text: "Op het historische schip de ss Rotterdam begeleidt een sommelier je langs vier glazen, met uitleg en scoreformulier. Prijs: ongeveer €15 per persoon. Reserveren voor max zes personen, minimaal 24 uur van tevoren. Let op: tot en met 30 augustus 2026 is de Ocean Wine Bar op zondagen gesloten.",
        },
        {
          type: "h2",
          text: "Wat kost een wijnproeverij in Rotterdam?",
        },
        {
          type: "p",
          text: "Van een snelle introductie tot een avondvullend arrangement: er is voor elk budget iets. Reken grofweg op €15 tot ruim €75 per persoon.",
        },
        {
          type: "h3",
          text: "Budgetvriendelijk: €15 tot €35",
        },
        {
          type: "p",
          text: "Open proeverijen en basistastings zonder uitgebreide hapjes. Ocean Wine Bar rond €15 voor vier glazen met sommeliertoelichting. Vineum start basisproeverijen rond €20. Diepgaande uitleg of bites zijn hier vaak niet inbegrepen.",
        },
        {
          type: "h3",
          text: "Middenklasse en premium: €39 tot €80",
        },
        {
          type: "p",
          text: "Hier krijg je meestal sommelier of host, hapjes en een samenhangende wijnlijn. WINESTABRAM zit rond €55 voor zes wijnen. Nursia en Casa Reinders bewegen tussen ongeveer €45 en €75, afhankelijk van het pakket. MyTable valt in dit segment met all-in prijzen vanaf €39 per persoon: vier wijnen, vier chef's special bites, begeleiding aan tafel. Solo is €49, duo vanaf €39, groep vanaf €44. Geen rekening splitsen achteraf.",
        },
        {
          type: "h3",
          text: "Thuisproeverij",
        },
        {
          type: "p",
          text: "Wil je thuis vieren? Aanbieders zoals Kasteelhoeve komen naar jouw locatie in Rotterdam met een grotere wijnlijn en een adviseur. Prijs hangt af van aantal gasten en datum. Handig voor een verjaardag zonder externe logistiek.",
        },
        {
          type: "h2",
          text: "MyTable in Rotterdam: aanschuiven zonder gedoe",
        },
        {
          type: "p",
          text: "MyTable is geen wijnbar en geen workshop. Het is een girls-only tafelervaring op zondag van 14:00 tot 17:00, op een vaste partnerlocatie in Rotterdam. Je boekt online, verschijnt, en de rest is geregeld.",
        },
        {
          type: "h3",
          text: "Vier wijnen, vier bites, één tafel",
        },
        {
          type: "ul",
          items: [
            "Vier wijnen met korte, heldere uitleg",
            "Vier chef's special bites die bij die wijnen passen",
            "Een host die het gesprek op gang houdt",
            "All-in betaald: geen verrassingen op de rekening",
          ],
        },
        {
          type: "h3",
          text: "Solo is hier de standaard",
        },
        {
          type: "p",
          text: "Bij veel Rotterdamse proeverijen heb je minimaal vier of acht personen nodig. Bij MyTable boek je één plek, of je alleen komt of met een vriendin. Solo's en duo's worden bewust gematcht. Grote vriendinnengroepen kunnen een eigen tafel nemen. Geen dating-event: wel nieuw gezelschap en een makkelijke zondagmiddag.",
        },
        {
          type: "h3",
          text: "Past bij het Rotterdamse weekend",
        },
        {
          type: "p",
          text: "Om 17:00 ben je klaar. Daarna heb je de avond nog vrij. Geen datumprikker, geen mailwisseling, geen weken wachten op bevestiging. In twee minuten online geregeld.",
        },
        {
          type: "h2",
          text: "Zo kies je de juiste wijnproeverij",
        },
        {
          type: "p",
          text: "Drie vragen brengen je al ver: met hoeveel ga je, hoeveel begeleiding wil je, en wat wil je per persoon uitgeven?",
        },
        {
          type: "ul",
          items: [
            "Alleen of met één iemand, maximale vrijheid: loop binnen bij een wijnbar zoals Walsjérôt",
            "Groep van 4 tot 12, behoefte aan uitleg: kijk naar begeleide proeverijen zoals LenselinQ",
            "Vijftien of meer, graag een verhaal: Het Wijnpakhuis past beter",
            "Thuis vieren: check een thuisproeverij op maat",
            "Solo of klein gezelschap, vaste prijs, niks organiseren: MyTable op zondag",
          ],
        },
        {
          type: "p",
          text: "Voor elk gezelschap en budget is er een wijnproeverij in Rotterdam die klopt. Wil je gewoon aanschuiven zonder nadenken? Reserveer een girls-only tafel bij MyTable, kies een datum in de agenda, en loop zondag binnen alsof het al voor je klaarstond.",
        },
      ],
      en: [
        {
          type: "p",
          text: "Looking for a wine tasting in Rotterdam but not sure where to start? The options go further than you think: wine bars, guided group tastings, at-home tastings, and a format where you simply take a seat without organising a thing. This guide puts them side by side so you can match format, budget and company fast.",
        },
        {
          type: "p",
          text: "The difference is rarely the wine alone. It is vibe, structure and how much you want to arrange yourself. Freedom at the bar, a sommelier walking you through each glass, or a fixed Sunday afternoon where showing up solo is completely normal? You will know where to go.",
        },
        {
          type: "h2",
          text: "Which format fits you?",
        },
        {
          type: "p",
          text: "Not every wine tasting in Rotterdam feels the same. Broadly, there are three flavours.",
        },
        {
          type: "h3",
          text: "Open tastings and wine bars",
        },
        {
          type: "p",
          text: "You set the pace. Walk in, choose what you taste, leave when you want. Walsjérôt in Blijdorp uses wine taps: a sip, a half glass or a full glass from around 70 open wines. No fixed schedule, no group pressure. Ideal if you want to explore without a booking.",
        },
        {
          type: "h3",
          text: "Guided group tastings",
        },
        {
          type: "p",
          text: "Want structure and explanation? You follow a set wine line with notes per glass, often with snacks in between. Most Rotterdam hosts ask for a minimum group of four to fifteen people. Great for friends, birthdays or a work outing. Usually one and a half to two hours.",
        },
        {
          type: "h3",
          text: "Joining a shared table",
        },
        {
          type: "p",
          text: "The third category is easy to miss: an organised social table. Not a wine bar, not a workshop. You book a seat, show up on time, and wine, bites and table mix are ready. That is MyTable: girls-only, every Sunday afternoon, in Rotterdam and other cities.",
        },
        {
          type: "h2",
          text: "Wine tastings in Rotterdam compared",
        },
        {
          type: "h3",
          text: "Walsjérôt: relaxed at your own pace",
        },
        {
          type: "p",
          text: "Walsjérôt on Bentinckplein often comes up as both approachable and chic. You top up a card, pour yourself and read the info cards by each tap. Open Wednesday to Friday from 16:00, Saturday from 14:00 and Sunday 14:00 to 21:00. Always check current hours.",
        },
        {
          type: "h3",
          text: "LenselinQ and Het Wijnpakhuis: structure and story",
        },
        {
          type: "p",
          text: "LenselinQ guides groups up to twelve, from basic to more special. Think bubbles, six wines and salty snacks in about two hours. Het Wijnpakhuis leans into a Rotterdam story around wine and food, with a minimum around fifteen people. Strong for larger groups who want an evening with narrative.",
        },
        {
          type: "h3",
          text: "Ocean Wine Bar on ss Rotterdam",
        },
        {
          type: "p",
          text: "On the historic ss Rotterdam ship, a sommelier walks you through four glasses with notes and a score sheet. About €15 per person. Book for up to six people, at least 24 hours ahead. Note: through 30 August 2026 the Ocean Wine Bar is closed on Sundays.",
        },
        {
          type: "h2",
          text: "What does a wine tasting in Rotterdam cost?",
        },
        {
          type: "p",
          text: "From a quick intro to a full evening: expect roughly €15 to well over €75 per person.",
        },
        {
          type: "h3",
          text: "Budget-friendly: €15 to €35",
        },
        {
          type: "p",
          text: "Open tastings and basic sessions without heavy food. Ocean Wine Bar around €15 for four glasses with sommelier notes. Vineum starts basic tastings around €20. Deeper guidance or bites are often extra here.",
        },
        {
          type: "h3",
          text: "Mid-range and premium: €39 to €80",
        },
        {
          type: "p",
          text: "Usually a sommelier or host, snacks and a coherent wine line. WINESTABRAM sits around €55 for six wines. Nursia and Casa Reinders move between about €45 and €75 depending on the package. MyTable sits here with all-in pricing from €39 per person: four wines, four chef's special bites, table host. Solo is €49, duo from €39, group from €44. No splitting the bill afterwards.",
        },
        {
          type: "h3",
          text: "At-home tasting",
        },
        {
          type: "p",
          text: "Prefer celebrating at home? Hosts like Kasteelhoeve come to your Rotterdam location with a longer wine line and an advisor. Price depends on guest count and date. Handy for a birthday without venue logistics.",
        },
        {
          type: "h2",
          text: "MyTable in Rotterdam: take a seat without the hassle",
        },
        {
          type: "p",
          text: "MyTable is not a wine bar and not a workshop. It is a girls-only table experience on Sunday from 14:00 to 17:00, at a fixed partner venue in Rotterdam. Book online, show up, and the rest is handled.",
        },
        {
          type: "h3",
          text: "Four wines, four bites, one table",
        },
        {
          type: "ul",
          items: [
            "Four wines with short, clear notes",
            "Four chef's special bites paired to those wines",
            "A host who keeps conversation moving",
            "Paid all-in: no surprises on the bill",
          ],
        },
        {
          type: "h3",
          text: "Solo is the default here",
        },
        {
          type: "p",
          text: "Many Rotterdam tastings need four or eight people minimum. At MyTable you book one seat, whether you come alone or with a friend. Solos and duos are matched on purpose. Larger friend groups can take their own table. Not a dating event: just easy new company on a Sunday afternoon.",
        },
        {
          type: "h3",
          text: "Fits the Rotterdam weekend",
        },
        {
          type: "p",
          text: "You wrap up at 17:00 with the evening still free. No date picker chaos, no email thread, no weeks waiting for confirmation. Sorted online in two minutes.",
        },
        {
          type: "h2",
          text: "How to choose the right tasting",
        },
        {
          type: "p",
          text: "Three questions get you most of the way: how many people, how much guidance, and what you want to spend per person.",
        },
        {
          type: "ul",
          items: [
            "Alone or with one person, maximum freedom: walk into a wine bar like Walsjérôt",
            "Group of 4 to 12, want explanation: look at guided tastings like LenselinQ",
            "Fifteen or more, prefer a story: Het Wijnpakhuis fits better",
            "Celebrate at home: check an at-home tasting",
            "Solo or small group, fixed price, zero organising: MyTable on Sunday",
          ],
        },
        {
          type: "p",
          text: "For every group size and budget there is a wine tasting in Rotterdam that fits. Want to simply take a seat without overthinking it? Book a girls-only table with MyTable, pick a date on the agenda, and walk in on Sunday like it was already waiting for you.",
        },
      ],
    },
  },
  {
    slug: "solo-naar-een-girls-only-wijnproeverij",
    category: "girls-only",
    publishedAt: "2026-07-10",
    readMinutes: 7,
    image: "/blog/solo-naar-een-girls-only-wijnproeverij.png",
    featured: false,
    title: {
      nl: "Solo naar een girls-only wijnproeverij: zo werkt het echt",
      en: "Going solo to a girls-only wine tasting: how it really works",
    },
    excerpt: {
      nl: "Alleen komen voelt groot, tot je eenmaal aan tafel zit. Wat je kunt verwachten, hoe de tafelmix werkt en waarom solo juist de makkelijkste manier is om mee te doen.",
      en: "Showing up alone feels big until you sit down. What to expect, how table matching works, and why solo is often the easiest way in.",
    },
    metaDescription: {
      nl: "Solo naar een girls-only wijnproeverij van MyTable? Zo werkt de tafelmix, wat je kunt verwachten en waarom alleen komen juist chill is.",
      en: "Going solo to a MyTable girls-only wine tasting? How table matching works, what to expect, and why arriving alone is easy.",
    },
    body: {
      nl: [
        {
          type: "p",
          text: "De meeste women die solo boeken bij MyTable zeggen achteraf hetzelfde: de drempel zat in de klik op reserveren, niet in de middag zelf. Je komt binnen, krijgt een plek aan een tafel met andere solo's en duo's, en binnen tien minuten praat je over wijn, werk of de stad.",
        },
        { type: "h2", text: "Je zit niet tussen een bestaande vriendinnengroep" },
        {
          type: "p",
          text: "Solo-gasten worden gematcht met andere solo's en kleine duo's. Grote vriendinnengroepen krijgen hun eigen tafel. Zo schuif je niet ongevraagd aan bij een feestje waar iedereen elkaar al kent.",
        },
        { type: "h2", text: "Wat er al geregeld is" },
        {
          type: "ul",
          items: [
            "Vier wijnen met korte uitleg",
            "Gepaaarde bites",
            "Een vaste locatie in de stad",
            "Een tafelmix die vooraf is nagedacht",
          ],
        },
        { type: "h2", text: "Kleine tips voor je eerste keer" },
        {
          type: "p",
          text: "Kom op tijd, laat je telefoon even liggen en begin met iets simpels: waar kom je vandaan, wat drink je normaal, wat wil je vandaag proberen. De rest volgt vanzelf. En nee: het is geen dating-event.",
        },
      ],
      en: [
        {
          type: "p",
          text: "Most women who book solo with MyTable say the same afterwards: the hard part was clicking reserve, not the afternoon itself. You arrive, get a seat with other solos and duos, and within ten minutes you are talking about wine, work or the city.",
        },
        { type: "h2", text: "You are not dropped into an existing friend group" },
        {
          type: "p",
          text: "Solo guests are matched with other solos and small duos. Larger friend groups get their own table. That way you never crash a party where everyone already knows each other.",
        },
        { type: "h2", text: "What is already taken care of" },
        {
          type: "ul",
          items: [
            "Four wines with short guidance",
            "Paired bites",
            "One fixed venue in the city",
            "A table mix planned in advance",
          ],
        },
        { type: "h2", text: "Small tips for your first time" },
        {
          type: "p",
          text: "Arrive on time, put your phone away for a bit, and start simple: where are you from, what do you usually drink, what do you want to try today. The rest follows. And no: this is not a dating event.",
        },
      ],
    },
  },
  {
    slug: "wat-is-een-wijnspijs-proeverij",
    category: "how-it-works",
    publishedAt: "2026-07-08",
    readMinutes: 6,
    image: "/blog/wat-is-een-wijnspijs-proeverij.png",
    title: {
      nl: "Wat is een wijnspijs-proeverij? De MyTable-uitleg",
      en: "What is a wine-and-food tasting? The MyTable explanation",
    },
    excerpt: {
      nl: "Geen wijncollege, geen formeel diner. Wel vier wijnen, passende bites en één tafel. Dit is wat je boekt als je een MyTable-proeverij reserveert.",
      en: "Not a wine lecture, not a formal dinner. Four wines, matching bites and one table. This is what you book with a MyTable tasting.",
    },
    metaDescription: {
      nl: "Wat is een wijnspijs-proeverij bij MyTable? Vier wijnen, bites, één tafel. Zo werkt de middag van begin tot eind.",
      en: "What is a MyTable wine-and-food tasting? Four wines, bites, one table. How the afternoon works from start to finish.",
    },
    body: {
      nl: [
        {
          type: "p",
          text: "Een wijnspijs-proeverij is een begeleide middag waarin wijn en kleine gerechtjes bij elkaar horen. Bij MyTable betekent dat: vier wijnen, gepaarde bites, uitleg zonder poespas, en een tafel waar je meteen kunt aansluiten.",
        },
        { type: "h2", text: "Hoe lang duurt het?" },
        {
          type: "p",
          text: "Meestal zo'n drie uur op zondagmiddag. Genoeg tijd om te proeven en te praten, zonder dat de avond verdwijnt.",
        },
        { type: "h2", text: "Wat zit er in de prijs?" },
        {
          type: "ul",
          items: [
            "Vier wijnen",
            "Bites die bij die wijnen passen",
            "Begeleiding aan tafel",
            "Alles vooraf betaald: geen verrassingen achteraf",
          ],
        },
        { type: "h2", text: "Voor wie is het?" },
        {
          type: "p",
          text: "Voor beginners én voor mensen die al graag wijn drinken. Je hoeft geen sommelier te zijn. Nieuwsgierigheid is genoeg.",
        },
      ],
      en: [
        {
          type: "p",
          text: "A wine-and-food tasting is a guided afternoon where wines and small dishes belong together. At MyTable that means four wines, paired bites, clear guidance without fuss, and a table you can join right away.",
        },
        { type: "h2", text: "How long does it take?" },
        {
          type: "p",
          text: "Usually about three hours on a Sunday afternoon. Enough time to taste and talk without losing the evening.",
        },
        { type: "h2", text: "What is included?" },
        {
          type: "ul",
          items: [
            "Four wines",
            "Bites that match those wines",
            "Guidance at the table",
            "Everything paid upfront: no surprises later",
          ],
        },
        { type: "h2", text: "Who is it for?" },
        {
          type: "p",
          text: "For beginners and for people who already enjoy wine. You do not need to be a sommelier. Curiosity is enough.",
        },
      ],
    },
  },
  {
    slug: "met-vriendinnen-een-eigen-tafel",
    category: "tips",
    publishedAt: "2026-07-05",
    readMinutes: 5,
    image: "/blog/met-vriendinnen-een-eigen-tafel.png",
    title: {
      nl: "Met vriendinnen een eigen tafel boeken: zo doe je dat",
      en: "Booking your own table with friends: how to do it",
    },
    excerpt: {
      nl: "Duo of groep? Bij MyTable kun je aanschuiven of een eigen tafel nemen. Dit is hoe je samen boekt zonder gedoe.",
      en: "Duo or group? At MyTable you can join others or take your own table. Here is how to book together without hassle.",
    },
    metaDescription: {
      nl: "Boek met vriendinnen een eigen tafel bij MyTable. Solo, duo of groep: zo kies je de juiste ticketoptie.",
      en: "Book your own table with friends at MyTable. Solo, duo or group: how to pick the right ticket option.",
    },
    body: {
      nl: [
        {
          type: "p",
          text: "Soms wil je nieuwe mensen ontmoeten. Soms wil je juist met je eigen club komen. Beide kan. De truc zit in het tickettype bij het boeken.",
        },
        { type: "h2", text: "Solo en duo" },
        {
          type: "p",
          text: "Solo en duo schuiven aan bij anderen. Ideaal als je openstaat voor nieuwe gezichten, of met z'n tweeën komt zonder een hele tafel te willen claimen.",
        },
        { type: "h2", text: "Groep: eigen tafel" },
        {
          type: "p",
          text: "Kom je met meer vriendinnen, kies dan de groep-optie. Jullie krijgen een eigen tafel, met dezelfde wijnen en bites als de rest van de middag.",
        },
        { type: "h2", text: "Praktisch" },
        {
          type: "ul",
          items: [
            "Eén persoon boekt en betaalt vooraf",
            "Allergieën kun je tijdens het boeken doorgeven",
            "Adres en details volgen per mail na de reservering",
          ],
        },
      ],
      en: [
        {
          type: "p",
          text: "Sometimes you want to meet new people. Sometimes you want to come with your own group. Both work. The key is the ticket type when you book.",
        },
        { type: "h2", text: "Solo and duo" },
        {
          type: "p",
          text: "Solo and duo guests join others. Ideal if you are open to new faces, or you are coming as two without needing a full private table.",
        },
        { type: "h2", text: "Group: your own table" },
        {
          type: "p",
          text: "Coming with more friends? Choose the group option. You get your own table, with the same wines and bites as the rest of the afternoon.",
        },
        { type: "h2", text: "Practical" },
        {
          type: "ul",
          items: [
            "One person books and pays upfront",
            "You can share allergies while booking",
            "Address and details follow by email after the reservation",
          ],
        },
      ],
    },
  },
  {
    slug: "girls-only-in-welke-stad",
    category: "cities",
    publishedAt: "2026-07-01",
    readMinutes: 6,
    image: "/blog/girls-only-in-welke-stad.png",
    title: {
      nl: "Girls-only in welke stad? Zo kies je jouw MyTable-middag",
      en: "Girls-only in which city? How to pick your MyTable afternoon",
    },
    excerpt: {
      nl: "Amsterdam, Rotterdam, Utrecht of dichterbij huis: MyTable organiseert girls-only zondagen in meerdere steden. Zo kies je slim.",
      en: "Amsterdam, Rotterdam, Utrecht or closer to home: MyTable runs girls-only Sundays in multiple cities. How to choose well.",
    },
    metaDescription: {
      nl: "In welke stad boek je een girls-only wijnproeverij van MyTable? Zo kies je tussen Amsterdam, Rotterdam, Utrecht en meer.",
      en: "Which city should you book for a MyTable girls-only wine tasting? How to choose between Amsterdam, Rotterdam, Utrecht and more.",
    },
    body: {
      nl: [
        {
          type: "p",
          text: "De formule is overal hetzelfde: girls-only, wijnspijs, één tafel. Het verschil zit in de stad, de datum en of er nog plek is. Begin dus bij jouw voorkeursstad en check daarna de agenda.",
        },
        { type: "h2", text: "Geen datum open?" },
        {
          type: "p",
          text: "Zet je op de priority list voor die stad. Zodra er een nieuwe zondag opent, krijg jij als eerste bericht, vóór de open agenda.",
        },
        { type: "h2", text: "Slim kiezen" },
        {
          type: "ul",
          items: [
            "Kies de stad die je makkelijk bereikt",
            "Check of er nog tickets zijn",
            "Boek vroeg bij populaire data",
            "Of combineer met een weekendje in een andere stad",
          ],
        },
      ],
      en: [
        {
          type: "p",
          text: "The format is the same everywhere: girls-only, wine and bites, one table. The difference is the city, the date and whether seats remain. Start with your preferred city, then check the agenda.",
        },
        { type: "h2", text: "No date open?" },
        {
          type: "p",
          text: "Join the priority list for that city. When a new Sunday opens, you hear first, before the public agenda.",
        },
        { type: "h2", text: "Choose smart" },
        {
          type: "ul",
          items: [
            "Pick a city you can reach easily",
            "Check remaining tickets",
            "Book early for popular dates",
            "Or combine it with a weekend in another city",
          ],
        },
      ],
    },
  },
  {
    slug: "priority-list-uitgelegd",
    category: "how-it-works",
    publishedAt: "2026-06-28",
    readMinutes: 4,
    image: "/blog/priority-list-uitgelegd.png",
    title: {
      nl: "De priority list uitgelegd: als eerste erbij",
      en: "The priority list explained: first in line",
    },
    excerpt: {
      nl: "Geen open tafel in jouw stad? De priority list zorgt dat jij als eerste hoort wanneer er een nieuwe girls-only zondag opent.",
      en: "No open table in your city? The priority list means you hear first when a new girls-only Sunday opens.",
    },
    metaDescription: {
      nl: "Wat is de MyTable priority list? Zo krijg je als eerste bericht over nieuwe girls-only tafels in jouw stad.",
      en: "What is the MyTable priority list? How you get first access to new girls-only tables in your city.",
    },
    body: {
      nl: [
        {
          type: "p",
          text: "Populaire zondagen raken snel vol. Daarom hebben we een priority list: een korte aanmelding per stad, zodat we je kunnen mailen zodra er iets opent.",
        },
        { type: "h2", text: "Wat je wel en niet krijgt" },
        {
          type: "ul",
          items: [
            "Wel: een vroege mail als er een tafel in jouw stad opent",
            "Wel: voorrang vóór de open agenda",
            "Niet: spam, wekelijkse nieuwsbrieven of verborgen kosten",
          ],
        },
        { type: "h2", text: "Hoe meld je je aan?" },
        {
          type: "p",
          text: "Op de homepage of op de stadspagina van jouw stad. Voornaam, e-mail, klaar. Zodra er plek is, weet je het.",
        },
      ],
      en: [
        {
          type: "p",
          text: "Popular Sundays sell out quickly. That is why we have a priority list: a short signup per city, so we can email you as soon as something opens.",
        },
        { type: "h2", text: "What you do and do not get" },
        {
          type: "ul",
          items: [
            "Yes: an early email when a table opens in your city",
            "Yes: access before the public agenda",
            "No: spam, weekly newsletters or hidden fees",
          ],
        },
        { type: "h2", text: "How do you join?" },
        {
          type: "p",
          text: "On the homepage or on your city page. First name, email, done. When there is space, you will know.",
        },
      ],
    },
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getBlogPostsSorted(): BlogPost[] {
  return [...blogPosts].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export function getFeaturedBlogPost(): BlogPost | undefined {
  return (
    getBlogPostsSorted().find((post) => post.featured) ?? getBlogPostsSorted()[0]
  );
}

export function getRelatedBlogPosts(slug: string, limit = 3): BlogPost[] {
  const current = getBlogPost(slug);
  if (!current) return getBlogPostsSorted().slice(0, limit);
  return getBlogPostsSorted()
    .filter((post) => post.slug !== slug)
    .sort((a, b) => {
      const aSame = a.category === current.category ? 0 : 1;
      const bSame = b.category === current.category ? 0 : 1;
      return aSame - bSame;
    })
    .slice(0, limit);
}

export function localizeBlogPost(post: BlogPost, locale: Locale) {
  const lang = locale === "en" ? "en" : "nl";
  return {
    ...post,
    title: post.title[lang],
    excerpt: post.excerpt[lang],
    metaDescription: post.metaDescription[lang],
    body: post.body[lang],
    categoryLabel: BLOG_CATEGORIES[post.category][lang],
    relatedLinks: (post.relatedPaths ?? []).map((item) => ({
      href: locale === "en" ? `/en${item.path}` : item.path,
      label: item.label[lang],
    })),
  };
}

export function getBlogPostUpdatedAt(post: BlogPost): string {
  return post.updatedAt ?? post.publishedAt;
}

export function estimateBlogWordCount(post: BlogPost, locale: Locale): number {
  const lang = locale === "en" ? "en" : "nl";
  const parts: string[] = [
    post.title[lang],
    post.excerpt[lang],
    ...post.body[lang].flatMap((block) => {
      if (block.type === "ul") return block.items;
      return [block.text];
    }),
  ];
  return parts
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function getBlogCategorySeo(
  category: BlogCategoryId,
  locale: Locale,
): { title: string; description: string } {
  const label = BLOG_CATEGORIES[category][locale === "en" ? "en" : "nl"];
  if (locale === "en") {
    return {
      title: `${label} | MyTable blog`,
      description: `Articles in ${label.toLowerCase()}: practical guides to girls-only wine tastings, tables and Sundays with MyTable.`,
    };
  }
  return {
    title: `${label} | MyTable blog`,
    description: `Artikelen in ${label.toLowerCase()}: praktische gidsen over girls-only wijnproeverijen, tafels en zondagen bij MyTable.`,
  };
}

export function formatBlogDate(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${isoDate}T12:00:00Z`));
}

export function formatReadTime(minutes: number, locale: Locale): string {
  return locale === "en" ? `${minutes} min read` : `${minutes} min leestijd`;
}
