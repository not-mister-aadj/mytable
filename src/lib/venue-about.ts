import type { Locale } from "@/i18n/config";
import type { VenueAbout } from "@/components/sunday-table-lp/SundayTableDateDetails";

/** "Over de locatie" per venue, written by hand like the photos above.
 * Sources for Juni: junirotterdam.nl and local press (Uitagenda Rotterdam,
 * De Havenloods). Unknown venues get no section rather than a guess. */
export function venueAbout(
  venueName: string,
  address: string,
  mapsHref: string,
  locale: Locale,
): { about: VenueAbout } | null {
  const en = locale === "en";
  // Sources for Vino Victoria: vinovictoria.nl and its Google Maps listing.
  if (venueName === "Vino Victoria") {
    return {
      about: {
        eyebrow: en ? "About the venue" : "Over de locatie",
        name: "Vino Victoria",
        body: en
          ? "Vino Victoria is a wine bar at the Victoriapark in the centre of Eindhoven, open since 2025. It pours a wide choice of wines by the glass, with cheese and charcuterie boards and small dishes on the menu. For Sunday Social, we keep a few tables for you."
          : "Vino Victoria is een wijnbar aan het Victoriapark, in het centrum van Eindhoven, open sinds 2025. Er staat een ruime keuze aan wijnen per glas op de kaart, met kaas- en vleesplanken en kleine gerechten. Voor Sunday Social houden we een paar tafels voor je vrij.",
        facts: [
          { label: en ? "Address" : "Adres", value: address, href: mapsHref },
          {
            label: en ? "Getting there" : "Bereikbaarheid",
            value: en
              ? "In the city centre, about 13 minutes' walk from Eindhoven Centraal"
              : "In het centrum, ongeveer 13 minuten lopen van Eindhoven Centraal",
          },
          {
            label: en ? "On the menu" : "Op de kaart",
            value: en
              ? "Wines by the glass, cheese and charcuterie boards, small bites"
              : "Wijnen per glas, kaas- en vleesplanken en kleine hapjes",
          },
          { label: en ? "Neighbourhood" : "Buurt", value: en ? "City centre" : "Centrum" },
        ],
      },
    };
  }
  // Sources for Bar Cava: barcava.nl and its Google Maps listing (walking
  // time from Utrecht Centraal: 9 minutes, 650 m).
  if (venueName === "Bar Cava") {
    return {
      about: {
        eyebrow: en ? "About the venue" : "Over de locatie",
        name: "Bar Cava",
        body: en
          ? "Bar Cava is a tapas and wine bar on the Ganzenmarkt, right in the old centre of Utrecht. Behind the bar is a wall of bottles with cava in the lead: from fresh and light to aged vintage, next to wines from Spain, France and Italy. The kitchen makes its own tapas, meant for sharing. A warm, easy-going place where you set the pace yourself. For Sunday Social, we keep a table for you."
          : "Bar Cava is een tapas- en wijnbar aan de Ganzenmarkt, midden in de Utrechtse binnenstad. Achter de bar staat een wand vol flessen, met cava in de hoofdrol: van fris en licht tot gerijpte vintage, naast wijnen uit Spanje, Frankrijk en Italië. De keuken maakt de tapas zelf, bedoeld om te delen. Een warme, ongedwongen zaak waar je zelf het tempo bepaalt. Voor Sunday Social houden we een tafel voor je vrij.",
        facts: [
          { label: en ? "Address" : "Adres", value: address, href: mapsHref },
          {
            label: en ? "Getting there" : "Bereikbaarheid",
            value: en
              ? "In the city centre, about 9 minutes' walk from Utrecht Centraal"
              : "In het centrum, ongeveer 9 minuten lopen van Utrecht Centraal",
          },
          {
            label: en ? "On the menu" : "Op de kaart",
            value: en
              ? "Cava and wines by the glass, home-made tapas to share"
              : "Cava en wijnen per glas, huisgemaakte tapas om te delen",
          },
          { label: en ? "Neighbourhood" : "Buurt", value: en ? "City centre" : "Centrum" },
        ],
      },
    };
  }
  if (venueName !== "Bar Juni Rotterdam") return null;
  return {
    about: {
      eyebrow: en ? "About the venue" : "Over de locatie",
      name: "Juni",
      body: en
        ? "Juni is Rotterdam's first wine and cheese bar, started by Puck and Nienke, who met working at restaurant OX. The cheese counter is full of Dutch cheeses from small makers, next to wines from France, Italy and Spain. A small, warm place with around 25 seats. Normally it's walk-in only. For Sunday Social, we keep a table for you."
        : "Juni is de eerste wijn- en kaasbar van Rotterdam, opgezet door Puck en Nienke, die elkaar leerden kennen bij restaurant OX. In de kaasvitrine liggen vooral Nederlandse kazen van kleine makers, met wijnen uit Frankrijk, Italië en Spanje ernaast. Een kleine, warme zaak met zo'n 25 plekken. Normaal loop je hier gewoon binnen. Voor Sunday Social houden we een tafel voor je vrij.",
      facts: [
        { label: en ? "Address" : "Adres", value: address, href: mapsHref },
        {
          label: en ? "Getting there" : "Bereikbaarheid",
          value: en
            ? "A few minutes' walk from Voorschoterlaan metro (lines A, B and C)"
            : "Een paar minuten lopen van metrostation Voorschoterlaan (lijn A, B en C)",
        },
        {
          label: en ? "On the menu" : "Op de kaart",
          value: en
            ? "Cheese boards and small seasonal dishes"
            : "Kaasplanken en kleine seizoensgerechten",
        },
        { label: en ? "Neighbourhood" : "Buurt", value: "Kralingen" },
      ],
    },
  };
}

/** "Een paar minuten lopen van ...": the "Getting there" line for a venue,
 * for the guest mails; null for venues without hand-written facts. */
export function venueTransit(venueName: string, locale: Locale): string | null {
  const about = venueAbout(venueName, "", "", locale)?.about;
  const fact = about?.facts.find((f) => f.label === (locale === "en" ? "Getting there" : "Bereikbaarheid"));
  return fact?.value ?? null;
}
