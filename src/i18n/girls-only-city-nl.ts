import {
  GIRLS_ONLY_CITIES,
  GIRLS_ONLY_CITY_SLUGS,
  type GirlsOnlyCityDefinition,
  type GirlsOnlyCitySlug,
} from "@/data/girls-only-cities";
import type { GirlsOnlyCityPageLabels } from "@/i18n/girls-only-city.types";

const sharedStatus = {
  available: "Beschikbaar",
  almostFull: "Bijna vol",
  soldOut: "Uitverkocht",
  closed: "Gesloten",
  new: "Nieuw",
} as const;

function buildCityPageNl(
  city: GirlsOnlyCityDefinition,
): GirlsOnlyCityPageLabels {
  const name = city.cityName;

  return {
    meta: {
      title: `Girls-only wijnproeverij in ${name}`,
      description: `Girls-only wijnproeverij in ${name} op zondagmiddag. Boek solo of met vriendinnen. Vier wijnen, bites, één tafel. Geen datum? Wachtlijst.`,
    },
    breadcrumbHome: "Home",
    breadcrumbGirlsOnly: "Girls-only",
    hero: {
      regionLabel: city.regionNl,
      headline: `Girls-only wijnproeverij in ${name}`,
      subheadline: `Girls-only wijnspijs in ${name} zonder gedoe: jij boekt, MyTable regelt wijn, bites en een tafel vol meiden. Solo welkom. Met vriendinnen krijg je jullie eigen tafel.`,
      trustBullets: [
        `Solo welkom in ${name}`,
        "Geen dating",
        "25-45 · beginners oké",
      ],
      ctaBook: `Bekijk ${name}-tafels`,
      ctaPriority: "Op de wachtlijst",
      imageAlt: `Vrouwen genieten van wijn en bites tijdens een girls-only middag in ${name}`,
    },
    events: {
      eyebrow: "Agenda",
      title: `Aankomende girls-only tafels in ${name}`,
      subtitle: `Reserveer je plek voor de volgende girls-only zondag in ${name}.`,
      emptyTitle: `Nog geen girls-only tafel in ${name} gepland`,
      emptyBody: `Nieuwe ${name}-zondagen openen zodra de locatie rond is. Zet je op de wachtlijst. Jij hoort het als eerste.`,
      emptyCta: "Naar de wachtlijst",
      viewAll: "Bekijk alle zondagen",
    },
    priority: {
      eyebrow: "Wachtlijst",
      title: `Als eerste erbij in ${name}`,
      subtitle: `Laat je e-mail achter. Zodra er een girls-only tafel in ${name} opent, krijg jij als eerste bericht, vóór de open agenda.`,
      nameLabel: "Voornaam",
      namePlaceholder: "Je voornaam",
      emailLabel: "E-mail",
      emailPlaceholder: "jij@email.nl",
      cta: "Zet me op de lijst",
      success: `Je staat erop. We mailen je zodra ${name} opent.`,
      error: "Aanmelden mislukte. Probeer het later opnieuw.",
      privacyNote: "Geen spam. Alleen als er een tafel in jouw stad opent.",
    },
    included: {
      eyebrow: "Wat je krijgt",
      title: `Girls-only wijnspijs in ${name}`,
      subtitle: `Alles geregeld voor een zondagmiddag in ${name}: wijn, bites en de juiste tafelmix.`,
      items: [
        {
          title: "Vier wijnen",
          description:
            "Een begeleide proeverij met uitleg. Beginners en wijnfans zitten naast elkaar.",
        },
        {
          title: "Gepaaarde bites",
          description:
            "Kleine gerechtjes die bij de wijnen passen. Geen formeel diner, wel écht lekker.",
        },
        {
          title: "Solo of met vriendinnen",
          description: `Solo schuif je aan bij andere girls in ${name}. Met vriendinnen reserveer je jullie eigen tafel.`,
        },
        {
          title: "Partnerlocatie in de stad",
          description:
            "Eén restaurant, geen stadswandeling. Adres en tijd krijg je na je boeking.",
        },
      ],
    },
    local: {
      eyebrow: `Over ${name}`,
      title: `Girls-only wijnspijs zoeken in ${name}`,
      body: city.localNl.body,
      points: [...city.localNl.points],
    },
    howItWorks: {
      eyebrow: "Hoe het werkt",
      title: `Girls-only tafel boeken in ${name}`,
      steps: [
        {
          title: "Kies je zondag",
          description: `Bekijk open tafels in ${name}, of zet je op de wachtlijst als er nog geen datum openstaat.`,
        },
        {
          title: "Boek solo of als groep",
          description:
            "Solo zit je bij andere solo's en duo's. Met vriendinnen krijg je een eigen tafel.",
        },
        {
          title: "Kom aan en geniet",
          description:
            "Wij regelen wijn, bites en sfeer. Jij geniet van een middag zonder gedoe.",
        },
      ],
    },
    faq: {
      title: `Veelgestelde vragen over girls-only in ${name}`,
      items: [
        {
          question: `Wat is een girls-only wijnproeverij in ${name}?`,
          answer: `Een zondagmiddag met vier wijnen, gepaarde bites en een tafel vol vrouwen. MyTable regelt de locatie en tafelmix in ${name}. Jij boekt solo of met vriendinnen.`,
        },
        {
          question: `Kan ik solo een girls-only tafel in ${name} boeken?`,
          answer:
            "Ja. Solo is de standaard. Je zit aan bij andere girls die ook alleen of als duo komen, niet bij bestaande vriendinnengroepen.",
        },
        {
          question: `Waar in ${name} vindt de wijnproeverij plaats?`,
          answer: `Bij één partnerrestaurant in ${name}. De stad staat op de tafelkaart. Na je boeking sturen we adres, tijd en praktische info per mail.`,
        },
        {
          question: `Wat kost een girls-only tafel in ${name}?`,
          answer:
            "De prijs per persoon staat op de tafelkaart en in de checkout. Die dekt vier wijnen, bites en de begeleide middag. Geen verborgen bijkomende kosten.",
        },
        {
          question: `Wat als er geen ${name}-datum openstaat?`,
          answer: `Zet je op de wachtlijst. Zodra we een nieuwe girls-only zondag in ${name} openen, krijg jij als eerste een mail, vóór de open agenda.`,
        },
        {
          question: `Is girls-only in ${name} een dating-event?`,
          answer:
            "Nee. Het gaat om wijn, bites en een ontspannen middag. Geen speeddating en geen verplicht netwerken.",
        },
      ],
    },
    otherCities: {
      title: "Girls-only in andere steden",
      subtitle: "Ook actief elders in Nederland. Kies jouw stad.",
      nationalCta: "Bekijk alle steden",
    },
    finalCta: {
      title: `Klaar voor girls-only in ${name}?`,
      subtitle: `Boek een open tafel, of zet je op de wachtlijst voor de volgende ${name}-zondag.`,
      ctaBook: `Bekijk ${name}-tafels`,
      ctaPriority: "Op de wachtlijst",
    },
    status: sharedStatus,
    femaleOnlyBadge: "Girls only",
    reserveCta: "Reserveer",
    viewTableCta: "Bekijk tafel",
    perPersonFrom: "vanaf",
    socialPromise:
      "Vier wijnen, gepaarde bites, één tafel. Jij boekt, wij regelen de rest.",
  };
}

export const girlsOnlyCityPagesNl: Record<
  GirlsOnlyCitySlug,
  GirlsOnlyCityPageLabels
> = Object.fromEntries(
  GIRLS_ONLY_CITY_SLUGS.map((slug) => [
    slug,
    buildCityPageNl(GIRLS_ONLY_CITIES[slug]),
  ]),
) as Record<GirlsOnlyCitySlug, GirlsOnlyCityPageLabels>;
