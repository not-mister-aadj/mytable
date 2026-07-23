import type { Locale } from "@/i18n/config";

export const GIRLS_ONLY_CITY_SLUGS = [
  "amsterdam",
  "rotterdam",
  "den-haag",
  "utrecht",
  "eindhoven",
  "groningen",
  "almere",
  "tilburg",
  "breda",
  "nijmegen",
  "arnhem",
] as const;

export type GirlsOnlyCitySlug = (typeof GIRLS_ONLY_CITY_SLUGS)[number];

export type GirlsOnlyCityLocalCopy = {
  body: string;
  points: [string, string, string];
};

export type GirlsOnlyCityDefinition = {
  slug: GirlsOnlyCitySlug;
  /** Matches `events.city` / waitlist city labels */
  cityName: string;
  regionNl: string;
  regionEn: string;
  heroImage: string;
  /** Short local hook for the image panel */
  hookNl: string;
  hookEn: string;
  localNl: GirlsOnlyCityLocalCopy;
  localEn: GirlsOnlyCityLocalCopy;
};

const IMAGES = {
  hero: "/girls-only/hero-poster.jpg",
  wine: "/girls-only/wine-moment.jpg",
  table: "/girls-only/table-group.jpg",
  laughing: "/girls-only/table-wine-laughing.jpg",
  glasses: "/girls-only/smiling-glasses.jpg",
  duo: "/girls-only/duo-table.jpg",
  bar: "/girls-only/laughing-bar.jpg",
  group: "/girls-only/group-bar.jpg",
  crowd: "/girls-only/crowd-evening.jpg",
  connect: "/girls-only/connecting.jpg",
  phone: "/girls-only/phone-moment.jpg",
} as const;

export const GIRLS_ONLY_CITIES: Record<
  GirlsOnlyCitySlug,
  GirlsOnlyCityDefinition
> = {
  amsterdam: {
    slug: "amsterdam",
    cityName: "Amsterdam",
    regionNl: "Noord-Holland",
    regionEn: "North Holland",
    heroImage: IMAGES.hero,
    hookNl: "Als eerste erbij zodra er een tafel opent.",
    hookEn: "First in line when a table opens.",
    localNl: {
      body: "Amsterdam hoort bij Noord-Holland en is een van de drukste social cities van Nederland. Van Jordaan tot Zuid: veel vrouwen willen een zondagmiddag met wijn en nieuw gezelschap, zonder dating-agenda. MyTable organiseert girls-only wijnproeverijen in Amsterdam bij één partnerlocatie. Jij komt voor vier wijnen, bites en een tafelmix die klopt, solo of met vriendinnen.",
      points: [
        "Centraal in Amsterdam, makkelijk bereikbaar met OV",
        "Kleine tafels, geen grote zaal-energie",
        "Solo boeken is hier de standaard, niet awkward",
      ],
    },
    localEn: {
      body: "Amsterdam is in North Holland and one of the most social cities in the Netherlands. From Jordaan to Zuid, many women want a Sunday afternoon with wine and new company, without a dating agenda. MyTable hosts girls-only wine tastings in Amsterdam at one partner venue. You come for four wines, bites, and a table mix that works, solo or with friends.",
      points: [
        "Central Amsterdam, easy by public transport",
        "Small tables, no big-hall energy",
        "Booking solo is the default here, not awkward",
      ],
    },
  },
  rotterdam: {
    slug: "rotterdam",
    cityName: "Rotterdam",
    regionNl: "Zuid-Holland",
    regionEn: "South Holland",
    heroImage: IMAGES.table,
    hookNl: "Als eerste erbij zodra er een tafel opent.",
    hookEn: "First in line when a table opens.",
    localNl: {
      body: "Rotterdam ligt in Zuid-Holland: raw, open en sociaal. Van Kop van Zuid tot Centrum zoeken vrouwen een zondagmiddag met wijn zonder gedoe. MyTable organiseert girls-only wijnproeverijen in Rotterdam bij één partnerlocatie. Jij komt voor vier wijnen, bites en nieuw gezelschap, solo of met vriendinnen.",
      points: [
        "Centraal in Rotterdam, goed bereikbaar met metro en trein",
        "Intieme tafels, geen festival-energie",
        "Solo welkom: jij komt alleen, wij regelen de tafelmix",
      ],
    },
    localEn: {
      body: "Rotterdam sits in South Holland: bold, open, and social. From Kop van Zuid to the centre, women want a Sunday afternoon with wine without the logistics. MyTable hosts girls-only wine tastings in Rotterdam at one partner venue. You come for four wines, bites, and new company, solo or with friends.",
      points: [
        "Central Rotterdam, easy by metro and train",
        "Intimate tables, no festival energy",
        "Solo welcome: you show up, we handle the table mix",
      ],
    },
  },
  "den-haag": {
    slug: "den-haag",
    cityName: "Den Haag",
    regionNl: "Zuid-Holland",
    regionEn: "South Holland",
    heroImage: IMAGES.glasses,
    hookNl: "Als eerste erbij zodra er een tafel opent.",
    hookEn: "First in line when a table opens.",
    localNl: {
      body: "Den Haag hoort bij Zuid-Holland: internationaal, groen en dicht bij zee. Perfect voor een zondagmiddag girls-only wijnspijs zonder dating-druk. MyTable organiseert tafels in Den Haag bij één partnerlocatie. Jij boekt solo of met vriendinnen; wij regelen wijn, bites en sfeer.",
      points: [
        "Goed bereikbaar vanuit Den Haag, Delft en Leiden",
        "Warme tafels, geen netwerkborrel-sfeer",
        "Solo of vriendinnengroep: jij kiest de setting",
      ],
    },
    localEn: {
      body: "The Hague is in South Holland: international, green, and close to the sea. Perfect for a Sunday girls-only wine afternoon without dating pressure. MyTable hosts tables in The Hague at one partner venue. You book solo or with friends; we handle wine, bites, and atmosphere.",
      points: [
        "Easy to reach from The Hague, Delft, and Leiden",
        "Warm tables, no networking-event vibe",
        "Solo or friend group: you choose the setup",
      ],
    },
  },
  utrecht: {
    slug: "utrecht",
    cityName: "Utrecht",
    regionNl: "Utrecht",
    regionEn: "Utrecht",
    heroImage: IMAGES.wine,
    hookNl: "Als eerste erbij zodra er een tafel opent.",
    hookEn: "First in line when a table opens.",
    localNl: {
      body: "Utrecht ligt centraal in Nederland en is makkelijk bereikbaar vanuit Amsterdam, Rotterdam, Den Haag en de provincie. De stad is compact: ideaal voor een zondagmiddag zonder reis-stress. MyTable organiseert girls-only wijnproeverijen in Utrecht bij één partnerlocatie. Jij komt voor vier wijnen, bites en nieuw gezelschap, solo of met vriendinnen.",
      points: [
        "Centraal bereikbaar vanuit heel Midden-Nederland",
        "Intieme tafels, geen grote zaal-energie",
        "Solo of vriendinnengroep: jij kiest de setting",
      ],
    },
    localEn: {
      body: "Utrecht sits in the centre of the Netherlands and is easy to reach from Amsterdam, Rotterdam, The Hague, and the wider region. The city is compact: ideal for a Sunday afternoon without travel stress. MyTable hosts girls-only wine tastings in Utrecht at one partner venue. You come for four wines, bites, and new company, solo or with friends.",
      points: [
        "Easy to reach from across the central Netherlands",
        "Intimate tables, no big-hall energy",
        "Solo or friend group: you choose the setup",
      ],
    },
  },
  eindhoven: {
    slug: "eindhoven",
    cityName: "Eindhoven",
    regionNl: "Noord-Brabant",
    regionEn: "North Brabant",
    heroImage: IMAGES.laughing,
    hookNl: "Als eerste erbij zodra er een tafel opent.",
    hookEn: "First in line when a table opens.",
    localNl: {
      body: "Eindhoven ligt in Noord-Brabant: design, tech en een jonge vibe. Ideaal voor girls die een zondagmiddag wijnspijs willen zonder planningsgedoe. MyTable organiseert girls-only tafels in Eindhoven bij één partnerlocatie. Solo welkom, vriendinnen ook.",
      points: [
        "Bereikbaar vanuit Eindhoven, Helmond en de Brainport-regio",
        "Kleine groepen, max intimiteit aan tafel",
        "Geen dating, wel nieuw gezelschap",
      ],
    },
    localEn: {
      body: "Eindhoven is in North Brabant: design, tech, and a young energy. Ideal for women who want a Sunday wine afternoon without planning stress. MyTable hosts girls-only tables in Eindhoven at one partner venue. Solo welcome, friends too.",
      points: [
        "Easy from Eindhoven, Helmond, and the Brainport region",
        "Small groups, intimate table energy",
        "Not dating, still new company",
      ],
    },
  },
  groningen: {
    slug: "groningen",
    cityName: "Groningen",
    regionNl: "Groningen",
    regionEn: "Groningen",
    heroImage: IMAGES.duo,
    hookNl: "Als eerste erbij zodra er een tafel opent.",
    hookEn: "First in line when a table opens.",
    localNl: {
      body: "Groningen is de hub van het Noorden: studentikoos, warm en sociaal. Perfect voor een girls-only zondagmiddag met wijn en bites. MyTable brengt tafels naar Groningen bij één partnerlocatie. Jij boekt, wij regelen de rest.",
      points: [
        "Centrum van Noord-Nederland, goed met trein bereikbaar",
        "Gezellige tafels, geen stijve proeverij",
        "Solo boeken voelt hier normaal",
      ],
    },
    localEn: {
      body: "Groningen is the hub of the North: student-friendly, warm, and social. Perfect for a girls-only Sunday with wine and bites. MyTable brings tables to Groningen at one partner venue. You book, we handle the rest.",
      points: [
        "Northern hub, easy by train",
        "Cosy tables, not a stiff tasting",
        "Booking solo feels normal here",
      ],
    },
  },
  almere: {
    slug: "almere",
    cityName: "Almere",
    regionNl: "Flevoland",
    regionEn: "Flevoland",
    heroImage: IMAGES.connect,
    hookNl: "Als eerste erbij zodra er een tafel opent.",
    hookEn: "First in line when a table opens.",
    localNl: {
      body: "Almere ligt in Flevoland, dicht bij Amsterdam maar met meer ruimte. Ideaal als je girls-only wijnspijs wilt zonder de drukte van de hoofdstad. MyTable organiseert tafels in Almere bij één partnerlocatie. Solo of met vriendinnen.",
      points: [
        "Snel bereikbaar vanuit Almere, Weesp en Amsterdam",
        "Rustige setting, warme tafelenergie",
        "Wachtlijst als er nog geen datum openstaat",
      ],
    },
    localEn: {
      body: "Almere is in Flevoland, close to Amsterdam but with more space. Ideal if you want girls-only wine & bites without big-city rush. MyTable hosts tables in Almere at one partner venue. Solo or with friends.",
      points: [
        "Quick from Almere, Weesp, and Amsterdam",
        "Calm setting, warm table energy",
        "Waitlist when no date is open yet",
      ],
    },
  },
  tilburg: {
    slug: "tilburg",
    cityName: "Tilburg",
    regionNl: "Noord-Brabant",
    regionEn: "North Brabant",
    heroImage: IMAGES.bar,
    hookNl: "Als eerste erbij zodra er een tafel opent.",
    hookEn: "First in line when a table opens.",
    localNl: {
      body: "Tilburg is Brabant op z’n best: informeel, warm en sociaal. MyTable organiseert girls-only wijnproeverijen in Tilburg bij één partnerlocatie. Kom solo of claim een tafel met vriendinnen.",
      points: [
        "Bereikbaar vanuit Tilburg, Breda en Den Bosch",
        "Geen formaliteiten, wel goede wijn",
        "Kleine tafels, echte gesprekken",
      ],
    },
    localEn: {
      body: "Tilburg is Brabant at its best: informal, warm, and social. MyTable hosts girls-only wine tastings in Tilburg at one partner venue. Come solo or claim a table with friends.",
      points: [
        "Easy from Tilburg, Breda, and Den Bosch",
        "No formalities, just good wine",
        "Small tables, real conversation",
      ],
    },
  },
  breda: {
    slug: "breda",
    cityName: "Breda",
    regionNl: "Noord-Brabant",
    regionEn: "North Brabant",
    heroImage: IMAGES.group,
    hookNl: "Als eerste erbij zodra er een tafel opent.",
    hookEn: "First in line when a table opens.",
    localNl: {
      body: "Breda ligt in Noord-Brabant: historisch centrum, gezellige terrassen, makkelijk bereikbaar. MyTable brengt girls-only wijnspijs naar Breda bij één partnerlocatie. Jij boekt solo of met vriendinnen; wij regelen wijn, bites en de tafelmix.",
      points: [
        "Centraal in West-Brabant",
        "Intieme setting, geen grote zaal",
        "Solo welkom zonder awkward vibe",
      ],
    },
    localEn: {
      body: "Breda is in North Brabant: historic centre, lively terraces, easy to reach. MyTable brings girls-only wine & bites to Breda at one partner venue. You book solo or with friends; we handle wine, bites, and the table mix.",
      points: [
        "Central in West Brabant",
        "Intimate setting, no big hall",
        "Solo welcome without awkward vibes",
      ],
    },
  },
  nijmegen: {
    slug: "nijmegen",
    cityName: "Nijmegen",
    regionNl: "Gelderland",
    regionEn: "Gelderland",
    heroImage: IMAGES.crowd,
    hookNl: "Als eerste erbij zodra er een tafel opent.",
    hookEn: "First in line when a table opens.",
    localNl: {
      body: "Nijmegen is de oudste stad van Nederland en ligt in Gelderland aan de Waal. Studentikoos, groen en sociaal: perfect voor girls-only op zondag. MyTable organiseert tafels in Nijmegen bij één partnerlocatie.",
      points: [
        "Bereikbaar vanuit Nijmegen, Arnhem en de regio",
        "Warme sfeer, geen speeddating",
        "Boek solo of met je vriendinnengroep",
      ],
    },
    localEn: {
      body: "Nijmegen is the oldest city in the Netherlands, in Gelderland on the Waal. Student-friendly, green, and social: perfect for girls-only on Sunday. MyTable hosts tables in Nijmegen at one partner venue.",
      points: [
        "Easy from Nijmegen, Arnhem, and the region",
        "Warm vibe, no speed dating",
        "Book solo or with your friend group",
      ],
    },
  },
  arnhem: {
    slug: "arnhem",
    cityName: "Arnhem",
    regionNl: "Gelderland",
    regionEn: "Gelderland",
    heroImage: IMAGES.phone,
    hookNl: "Als eerste erbij zodra er een tafel opent.",
    hookEn: "First in line when a table opens.",
    localNl: {
      body: "Arnhem ligt in Gelderland, dicht bij Park Sonsbeek en goed bereikbaar vanuit de regio. MyTable organiseert girls-only wijnproeverijen in Arnhem bij één partnerlocatie. Vier wijnen, bites, één tafel. Solo of met vriendinnen.",
      points: [
        "Goed bereikbaar vanuit Arnhem, Nijmegen en Apeldoorn",
        "Intieme tafels, geen nette netwerkpraat",
        "Wachtlijst als de agenda nog leeg is",
      ],
    },
    localEn: {
      body: "Arnhem is in Gelderland, near Park Sonsbeek and easy to reach from the region. MyTable hosts girls-only wine tastings in Arnhem at one partner venue. Four wines, bites, one table. Solo or with friends.",
      points: [
        "Easy from Arnhem, Nijmegen, and Apeldoorn",
        "Intimate tables, no stiff networking talk",
        "Waitlist when the agenda is still empty",
      ],
    },
  },
};

export function isGirlsOnlyCitySlug(value: string): value is GirlsOnlyCitySlug {
  return (GIRLS_ONLY_CITY_SLUGS as readonly string[]).includes(value);
}

export function getGirlsOnlyCity(
  slug: string,
): GirlsOnlyCityDefinition | undefined {
  if (!isGirlsOnlyCitySlug(slug)) return undefined;
  return GIRLS_ONLY_CITIES[slug];
}

export function listGirlsOnlyCities(): GirlsOnlyCityDefinition[] {
  return GIRLS_ONLY_CITY_SLUGS.map((slug) => GIRLS_ONLY_CITIES[slug]);
}

/** City names for waitlist / priority multi-select (stable order). */
export function listGirlsOnlyCityNames(): string[] {
  return listGirlsOnlyCities().map((city) => city.cityName);
}

export function girlsOnlyCityDisplayRegion(
  city: GirlsOnlyCityDefinition,
  locale: Locale,
): string {
  return locale === "en" ? city.regionEn : city.regionNl;
}
