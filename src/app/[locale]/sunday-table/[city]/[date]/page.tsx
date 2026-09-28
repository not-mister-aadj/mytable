import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SundayTableEventReveal } from "@/components/sunday-table-lp/SundayTableEventReveal";
import type {
  DateHighlights,
  DaySteps,
  VenueAbout,
} from "@/components/sunday-table-lp/SundayTableDateDetails";
import { JsonLd } from "@/components/seo/JsonLd";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  isValidLocale,
  localePath,
  sundayTableLocationPath,
  sundayTableLpCityPath,
  sundayTableLpPath,
  type Locale,
} from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { sundayTableLpCityFromSlug } from "@/data/sunday-table-lp-cities";
import { getSundayTableLocation } from "@/lib/sunday-table-locations";
import {
  formatSundayTableDate,
  formatSundayTableTime,
  parseAmsterdamDateIso,
} from "@/lib/sunday-wine-table";
import { breadcrumbJsonLd, organizationJsonLd } from "@/lib/seo/json-ld";
import { absoluteUrl } from "@/lib/seo/site";
import { images } from "@/data/images";
import { hasEnoughSoldToShowSpots } from "@/lib/experience-booking";
import { getSundayTableMotivationStats } from "@/lib/sunday-table-motivation-stats";
import { and, eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import { events } from "@/db/schema";

export const revalidate = 60;

type Props = {
  params: Promise<{ locale: string; city: string; date: string }>;
};

interface HeroImage {
  src: string;
  alt: string;
  position?: string;
}

/** Manually curated per-venue photos until Sunday Table locations get their
 * own image field. Other venues (including "Locatie volgt") show the photo
 * set on the event in admin, then a neutral stock photo. */
function buildVenueHeroImages(
  venueName: string,
  eventImageUrl: string | null,
  locale: Locale,
): HeroImage[] {
  if (venueName === "Bar Juni Rotterdam") {
    return [
      {
        src: "https://lh3.googleusercontent.com/grass-cs/ACvplmPKHPMZLbYmXXtC7a58PZZXLNLyYVbh6MRSFgUerRrfHIuVrFPWpbL6PJEEE7g98cQ-HZDirRJoY7D7WXBNHAZMPMDr3matKwDmgYtgoXZmnsoswO2hHtZNvhOCgJOql5VWJkywm4G80yYn=w1600-h1200-p-k-no",
        alt:
          locale === "en"
            ? "Inside Bar Juni's wine wall"
            : "De wijnmuur bij Bar Juni",
      },
      {
        src: "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWl9xDO-rYp6DZNrs2MrdV4c0CybHT7EDF0ziTlIBLN1n0t3aytKQZtz2g1EPdcNOSqBNaywC3GdDzXEXf6dUw0WJXxRxFjc_kh9ra9blHRJIExyhj37RIwGqlCo7av_3o3EZwgjR3wMEbo=s1600-k-no",
        alt:
          locale === "en"
            ? "The entrance of Bar Juni Rotterdam"
            : "De ingang van Bar Juni Rotterdam",
        position: "object-top",
      },
      {
        src: "/girls-only/wine-tasting-toast.jpg",
        alt:
          locale === "en"
            ? "A full table raises a toast during a MyTable wine tasting"
            : "Een volle tafel proost tijdens een MyTable wijnproeverij",
      },
    ];
  }
  if (eventImageUrl?.trim()) {
    return [
      {
        src: eventImageUrl.trim(),
        alt: locale === "en" ? "Wine at the table" : "Wijn aan tafel",
      },
    ];
  }
  return [
    {
      src: images.wineGlasses,
      alt: locale === "en" ? "A glass of wine being poured" : "Een glas wijn wordt ingeschonken",
    },
  ];
}

/** "Over de locatie" per venue, written by hand like the photos above.
 * Sources for Juni: junirotterdam.nl and local press (Uitagenda Rotterdam,
 * De Havenloods). Unknown venues get no section rather than a guess. */
function venueAbout(
  venueName: string,
  address: string,
  mapsHref: string,
  locale: Locale,
): { about: VenueAbout } | null {
  if (venueName !== "Bar Juni Rotterdam") return null;
  const en = locale === "en";
  return {
    about: {
      eyebrow: en ? "About the venue" : "Over de locatie",
      name: "Juni",
      body: en
        ? "Juni is Rotterdam's first wine and cheese bar, started by Puck and Nienke, who met working at restaurant OX. The cheese counter is full of Dutch cheeses from small makers, next to wines from France, Italy and Spain. A small, warm place with around 25 seats. Normally it's walk-in only. For Sunday Table, we keep a table for you."
        : "Juni is de eerste wijn- en kaasbar van Rotterdam, opgezet door Puck en Nienke, die elkaar leerden kennen bij restaurant OX. In de kaasvitrine liggen vooral Nederlandse kazen van kleine makers, met wijnen uit Frankrijk, Italië en Spanje ernaast. Een kleine, warme zaak met zo'n 25 plekken. Normaal loop je hier gewoon binnen. Voor Sunday Table houden we een tafel voor je vrij.",
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

/** Google rating per venue, curated by hand like the photos above. Venues
 * without a verified rating show none, so a new venue never borrows another
 * venue's reviews. */
function venueGoogleRating(venueName: string, locale: Locale) {
  if (venueName === "Bar Juni Rotterdam") {
    return {
      score: "4.9",
      label: locale === "en" ? "123 Google reviews" : "123 reviews op Google",
      href: "https://www.google.com/maps/search/?api=1&query=Juni+Rotterdam",
    };
  }
  return null;
}

async function loadTicketEvent(cityName: string, startsAt: Date) {
  if (!isDbConfigured()) return null;
  const db = getDb();
  const [row] = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.experienceType, "sunday-table"),
        eq(events.city, cityName),
        eq(events.startsAt, startsAt),
        eq(events.workflowStatus, "published"),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** "Sunday Table · 20-39" -> "20-39", so the bracket can be shown on its own
 * without repeating "Sunday Table" everywhere it's used on the page. */
function ageBracketFromEventName(name: string): string | null {
  const parts = name.split("·").map((part) => part.trim());
  return parts.length > 1 ? parts[parts.length - 1] : null;
}

async function loadLocation(citySlug: string, date: string) {
  const city = sundayTableLpCityFromSlug(citySlug);
  if (!city) return null;
  const table = parseAmsterdamDateIso(date);
  if (!table) return null;
  const location = await getSundayTableLocation({
    city: city.name,
    tableDate: date,
    tableType: "mixed",
  });
  if (!location) return null;
  return { city, table, location };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, city: citySlug, date } = await params;
  if (!isValidLocale(locale)) return {};
  const found = await loadLocation(citySlug, date);
  if (!found) return {};
  const { city, table, location } = found;
  const ticketEvent = await loadTicketEvent(city.name, table);
  const ageBracket = ticketEvent
    ? ageBracketFromEventName(
        locale === "en" ? ticketEvent.nameEn : ticketEvent.nameNl,
      )
    : null;
  const comingSoon = Boolean(ticketEvent?.extras?.comingSoon);
  const bracketSuffix = ageBracket ? ` · ${ageBracket}` : "";
  const dateLabel = formatSundayTableDate(table, locale as Locale);
  const title = comingSoon
    ? locale === "en"
      ? `Sunday Table${bracketSuffix} · ${dateLabel} in ${city.name} | MyTable`
      : `Sunday Table${bracketSuffix} · ${dateLabel} in ${city.name} | MyTable`
    : locale === "en"
      ? `Sunday Table${bracketSuffix} · ${dateLabel} at ${location.venueName} | MyTable`
      : `Sunday Table${bracketSuffix} · ${dateLabel} bij ${location.venueName} | MyTable`;
  const description = comingSoon
    ? locale === "en"
      ? `Sunday Table is coming to ${city.name} on ${dateLabel}. Venue announced soon.`
      : `Sunday Table komt naar ${city.name} op ${dateLabel}. Locatie volgt binnenkort.`
    : locale === "en"
      ? `Join Sunday Table in ${city.name} on ${dateLabel}, at ${location.venueName}.`
      : `Schuif aan bij Sunday Table in ${city.name} op ${dateLabel}, bij ${location.venueName}.`;
  return { title, description };
}

export default async function SundayTableEventPage({ params }: Props) {
  const { locale: localeParam, city: citySlug, date } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const found = await loadLocation(citySlug, date);
  if (!found) notFound();
  const { city, table, location } = found;
  const ticketEvent = await loadTicketEvent(city.name, table);
  if (!ticketEvent) notFound();
  const comingSoon = Boolean(ticketEvent.extras?.comingSoon);
  const spotsLeft = Math.max(0, ticketEvent.capacity - ticketEvent.spotsSold);
  const showSpotsCount = hasEnoughSoldToShowSpots(ticketEvent.spotsSold);
  const pricePerSeatEuros = Math.round(ticketEvent.priceCents / 100);
  const ageBracket = ageBracketFromEventName(
    locale === "en" ? ticketEvent.nameEn : ticketEvent.nameNl,
  );
  // A bare "35+" doesn't read as an age on its own, so spell that out here
  // rather than in the stored event name (which stays short for titles/URLs).
  const ageBracketLabel = ageBracket
    ? `${ageBracket} ${locale === "en" ? "yrs" : "jaar"}`
    : null;
  const mixedLabel = locale === "en" ? "Mixed" : "Gemengd";
  const tags = [ageBracketLabel, mixedLabel].filter(
    (tag): tag is string => Boolean(tag),
  );
  const motivationStats = await getSundayTableMotivationStats();

  const dict = getDictionary(locale);
  const dateLabel = formatSundayTableDate(table, locale);
  const capitalizedDate =
    dateLabel.charAt(0).toLocaleUpperCase(locale === "nl" ? "nl-NL" : "en-GB") +
    dateLabel.slice(1);
  const timeLabel = formatSundayTableTime(locale);
  const pageUrl = absoluteUrl(sundayTableLocationPath(locale, city.slug, date));
  const heroImages = buildVenueHeroImages(
    location.venueName,
    ticketEvent.imageUrl,
    locale,
  );
  const venue = venueAbout(
    location.venueName,
    location.address,
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${location.venueName}, ${location.address}`,
    )}`,
    locale,
  );
  const en = locale === "en";
  const cityName = en && city.name === "Den Haag" ? "The Hague" : city.name;

  const highlights: DateHighlights = {
    eyebrow: en ? "Highlights" : "Hoogtepunten",
    title: en ? "Why this will be a Sunday to remember" : "Waarom dit een zondag wordt om te onthouden",
    prevLabel: en ? "Previous" : "Vorige",
    nextLabel: en ? "Next" : "Volgende",
    items: [
      {
        title: en ? "A table full of new faces" : "Een tafel vol nieuwe gezichten",
        body: en
          ? "You join 4 to 6 new people. Two days before, we introduce everyone to each other."
          : "Je schuift aan bij 4 tot 6 nieuwe mensen. Twee dagen van tevoren stellen we iedereen aan elkaar voor.",
        image: {
          src: "/girls-only/wine-tasting-conversation.jpg",
          alt: en ? "Guests in conversation at a MyTable table" : "Gasten in gesprek aan een MyTable-tafel",
        },
      },
      {
        // Not "a place you didn't know yet": plenty of guests will know it.
        title: en ? "We pick the place" : "Wij kiezen de plek",
        // Same text for every Sunday Table; the venue itself is described in
        // "Over de locatie".
        body: en
          ? `A carefully chosen spot in ${cityName}. All you have to do is show up.`
          : `Een zorgvuldig gekozen adres in ${cityName}. Jij hoeft alleen te komen.`,
        image: venue
          ? heroImages[0]!
          : {
              src: "/girls-only/table-group.jpg",
              alt: en ? "A full MyTable table" : "Een volle MyTable-tafel",
            },
      },
      {
        title: en ? "Wine without the snobbery" : "Wijn zonder snobisme",
        body: en
          ? "Order whatever you like. Our picks from the menu help you choose."
          : "Bestel wat jij lekker vindt. Onze aanraders van de kaart helpen je kiezen.",
        image: {
          src: "/girls-only/wine-tasting-toast.jpg",
          alt: en ? "A table raising their glasses" : "Een tafel die het glas heft",
        },
      },
      {
        title: en ? "Coming alone is normal" : "Alleen komen is normaal",
        body: en
          ? "Many guests come solo. You're in good company."
          : "Veel gasten komen solo. Je bent dus in goed gezelschap.",
        image: {
          src: "/girls-only/smiling-glasses.jpg",
          alt: en ? "A guest laughing with a glass of wine" : "Een lachende gast met een glas wijn",
        },
      },
    ],
  };

  const venueLabel = venue ? venue.about.name : null;
  const daySteps: DaySteps = {
    eyebrow: en ? "On the day" : "Op de dag zelf",
    title: en ? "How it works" : "Zo werkt het",
    steps: [
      {
        title: en ? "Walk in, your table is ready" : "Kom binnen, je tafel staat klaar",
        body: en
          ? `At 2:00 PM a table is reserved for you${venueLabel ? ` at ${venueLabel}` : ""}. You already know who's joining, so the ice is half broken.`
          : `Om 14:00 staat er${venueLabel ? ` bij ${venueLabel}` : ""} een tafel voor je gereserveerd. Je weet al wie er aanschuiven, dus het ijs is half gebroken.`,
      },
      {
        title: en ? "Taste, talk and discover" : "Proeven, praten en ontdekken",
        body: en
          ? "Order whatever you fancy from the menu and take your time. Plan for two to three hours. Staying longer is fine."
          : "Bestel van de kaart waar je zin in hebt en neem de tijd. Reken op twee tot drie uur. Langer blijven mag.",
      },
      {
        title: en ? "And after? That's up to you." : "En daarna? Dat bepalen jullie.",
        body: en
          ? "Stay a little longer or go for dinner together. Who knows where the afternoon ends."
          : "Blijf nog even hangen of ga samen ergens eten. Wie weet waar de middag eindigt.",
      },
    ],
  };

  // Under the buy button, so its length never pushes the button out of view.
  // Four ticks plus the note, one thing per line.
  const included = en
    ? {
        title: `What you get for €${pricePerSeatEuros}`,
        items: [
          "A seat at a table with 4 to 6 new people",
          "A place we picked for you",
          "An email two days before with who's joining",
          "Our tips from the menu",
        ],
        note: "Food and drinks you pay for yourself at the venue.",
      }
    : {
        title: `Wat je krijgt voor €${pricePerSeatEuros}`,
        items: [
          "Een plek aan tafel met 4 tot 6 nieuwe mensen",
          "Een zaak die wij voor je uitkozen",
          "Twee dagen vooraf een mail met wie er aanschuiven",
          "Onze tips van de kaart",
        ],
        note: "Eten en drinken reken je zelf af bij de zaak.",
      };

  const copy =
    locale === "en"
      ? {
          eyebrow: `Sunday Table · ${city.name}${ageBracket ? ` · ${ageBracket}` : ""}`,
          intro:
            "Most people join MyTable for two things: discovering the tastiest new places, and meeting new people. At Sunday Table, you sit down at a table of 4 to 6 people you don't know yet, at one of the city's best spots. Some Sundays there are several of these tables running at the same venue.",
          detailsLabel: "Details",
          dateFieldLabel: "Date",
          venueFieldLabel: "Venue",
          ticketsLeftLabel: "{count} spots left",
          availableChipLabel: "Available",
          soldOutChipLabel: "Sold out",
          comingSoonChipLabel: "Coming soon",
          comingSoonTitle: "Registration opens soon",
          comingSoonBody:
            "We're finalizing the venue for this table. Leave your email and we'll let you know the moment registration opens.",
          comingSoonEmailLabel: "Email",
          comingSoonSubmitLabel: "Notify me",
          comingSoonSuccessLabel: "Done. We'll email you as soon as it's open.",
          comingSoonErrorLabel: "Something went wrong. Please try again.",
          bookingEmailLabel: "Email",
          bookingNameLabel: "Name",
          bookingSeatsLabel: "Tickets",
          bookingSeatOneLabel: "1 ticket",
          bookingSeatTwoLabel: "2 tickets",
          bookingLanguageLabel: "Table language",
          bookingLanguageDutchLabel: "Dutch",
          bookingLanguageEnglishLabel: "English",
          bookingLanguageBothLabel: "No preference",
          bookingCtaLabel: "Buy your ticket",
          bookingCtaLabelPlural: "Buy your tickets",
          bookingSoldOutLabel: "This table is fully booked.",
          bookingGuarantees: ["Secure payment via iDEAL", "Free rescheduling up to 48 hours before"],
          bookingErrorLabel: "Something went wrong. Please try again.",
          englishComingSoon: {
            title: "English-speaking tables are coming",
            body: `This table is held in Dutch. Speak Dutch too? Pick "No preference" and join us. Prefer English? We'll let you know first when the first English-speaking table in ${city.name === "Den Haag" ? "The Hague" : city.name} opens.`,
            cta: "Keep me posted",
            success: "Great, you'll be the first to know.",
            error: "Something went wrong. Please try again.",
          },
          shareLabel: "Share",
          shareCopiedLabel: "Link copied",
          shareTitle: `Sunday Table · ${dateLabel} at ${location.venueName}`,
          statsEyebrow: "Why people come to MyTable",
          statsTitle: "Sound familiar? Here's what we see across all our events",
          stats: [
            { value: `${motivationStats.meetNewPeople}%`, label: "come to meet new people" },
            { value: `${motivationStats.solo}%`, label: "come solo" },
            { value: `${motivationStats.discoverPlaces}%`, label: "want to discover a new place" },
            { value: `${motivationStats.justForFun}%`, label: "just come for good company" },
          ],
          faqEyebrow: "Questions",
          faqTitle: "Still on the fence? Here are the answers",
          faqItems: [
            {
              question: "What is Sunday Table?",
              answer:
                "One table full of new faces, at one of the best spots in the city. You book a seat, sit down with people you don't know yet, and discover a new place together. Along the way, we share our own wine and food pairing picks.",
            },
            {
              question: "Who's this table for?",
              answer:
                "Wine lovers and curious tasters up for good conversation. You don't need to bring anyone either: most guests come solo.",
            },
            {
              question: "What does it cost?",
              answer:
                "€10 for your seat. That's it. Drinks and bites you order and pay for yourself, straight from the menu. That menu changes regularly, so the day before, we email our own picks.",
            },
            {
              question: "Do I need to worry about allergies or dietary needs?",
              answer:
                "Not in advance. You order your own dishes from Bar Juni's menu, so you simply pick what works for you. Need something specific? Just let the staff know on the spot.",
            },
            {
              question: "What if I don't click with anyone at the table?",
              answer:
                "Give it a chance, more often than not it turns out to be a lot of fun, especially after the first glass of wine. Really doesn't click? Let us know within 48 hours and we'll find a solution together.",
            },
            {
              question: "How long does it last?",
              answer:
                "Plan for 2 to 3 hours. Some groups stay longer or head out to eat together afterward, as long as the venue's fine with it. Want to leave early, for whatever reason? That's fine too.",
            },
            {
              question: "Can I cancel or reschedule?",
              answer:
                "Cancelling isn't possible. You can reschedule to a different Sunday Table edition for free up to 48 hours in advance. Email us at info@mytable.club to arrange it.",
            },
          ],
        }
      : {
          eyebrow: `Sunday Table · ${city.name}${ageBracket ? ` · ${ageBracket}` : ""}`,
          intro:
            "De meeste mensen komen bij MyTable voor twee dingen: de lekkerste nieuwe plekken ontdekken en nieuwe mensen ontmoeten. Bij Sunday Table schuif je aan bij een tafel van 4 tot 6 mensen die je nog niet kent, bij een van de leukste plekken van de stad. Soms staan er die middag meerdere van deze tafels bij dezelfde venue.",
          detailsLabel: "Details",
          dateFieldLabel: "Datum",
          venueFieldLabel: "Locatie",
          ticketsLeftLabel: "Nog {count} plekken",
          availableChipLabel: "Beschikbaar",
          soldOutChipLabel: "Uitverkocht",
          comingSoonChipLabel: "Binnenkort bekend",
          comingSoonTitle: "Aanmelden opent binnenkort",
          comingSoonBody:
            "We ronden de locatie voor deze tafel nog af. Laat je e-mail achter, dan laten we je weten zodra het aanmelden open gaat.",
          comingSoonEmailLabel: "E-mail",
          comingSoonSubmitLabel: "Hou me op de hoogte",
          comingSoonSuccessLabel: "Gelukt. We mailen je zodra het open gaat.",
          comingSoonErrorLabel: "Er ging iets mis. Probeer het opnieuw.",
          bookingEmailLabel: "E-mail",
          bookingNameLabel: "Naam",
          bookingSeatsLabel: "Tickets",
          bookingSeatOneLabel: "1 ticket",
          bookingSeatTwoLabel: "2 tickets",
          bookingLanguageLabel: "Taal aan tafel",
          bookingLanguageDutchLabel: "Nederlands",
          bookingLanguageEnglishLabel: "Engels",
          bookingLanguageBothLabel: "Maakt niet uit",
          bookingCtaLabel: "Koop je ticket",
          bookingCtaLabelPlural: "Koop je tickets",
          bookingSoldOutLabel: "Deze tafel zit vol.",
          bookingGuarantees: ["Veilig betalen via iDEAL", "Kosteloos verplaatsen tot 48 uur vooraf"],
          bookingErrorLabel: "Er ging iets mis. Probeer het opnieuw.",
          // In English on the Dutch page too: whoever sees this just said
          // they'd rather speak English. Only the button name stays Dutch,
          // since that's what the button on this page says.
          englishComingSoon: {
            title: "English-speaking tables are coming",
            body: `This table is held in Dutch. Speak Dutch too? Pick "Maakt niet uit" (no preference) and join us. Prefer English? We'll let you know first when the first English-speaking table in ${city.name === "Den Haag" ? "The Hague" : city.name} opens.`,
            cta: "Keep me posted",
            success: "Great, you'll be the first to know.",
            error: "Something went wrong. Please try again.",
          },
          shareLabel: "Delen",
          shareCopiedLabel: "Link gekopieerd",
          shareTitle: `Sunday Table · ${dateLabel} bij ${location.venueName}`,
          statsEyebrow: "Waarom mensen bij MyTable komen",
          statsTitle: "Herkenbaar? Dit blijkt uit de data van al onze events",
          stats: [
            { value: `${motivationStats.meetNewPeople}%`, label: "komt om nieuwe mensen te ontmoeten" },
            { value: `${motivationStats.solo}%`, label: "komt in z'n eentje" },
            { value: `${motivationStats.discoverPlaces}%`, label: "wil een nieuwe plek ontdekken" },
            { value: `${motivationStats.justForFun}%`, label: "komt gewoon voor de gezelligheid" },
          ],
          faqEyebrow: "Vragen",
          faqTitle: "Nog twijfels? Hier zijn de antwoorden",
          faqItems: [
            {
              question: "Wat is Sunday Table?",
              answer:
                "Eén tafel vol nieuwe gezichten, bij een van de leukste plekken van de stad. Je boekt een plek, schuift aan met mensen die je nog niet kent, en ontdekt samen een nieuwe plek. Onderweg geven wij onze eigen wijnspijs-aanraders mee.",
            },
            {
              question: "Voor wie is deze tafel?",
              answer:
                "Voor wijnliefhebbers en nieuwsgierige proevers die zin hebben in een goed gesprek. Je hoeft niemand mee te nemen: de meeste gasten komen solo.",
            },
            {
              question: "Wat kost het?",
              answer:
                "€10 voor je plek aan tafel. Meer niet. Drankjes en bites bestel en betaal je zelf ter plekke, rechtstreeks van de kaart. Die kaart wisselt regelmatig, dus een dag van tevoren mailen we onze aanraders.",
            },
            {
              question: "Moet ik rekening houden met allergieën of dieetwensen?",
              answer:
                "Nee, dat hoeft niet vooraf. Je bestelt je eigen gerechten van de kaart bij Bar Juni, dus je kiest gewoon wat bij jou past. Heb je toch iets bijzonders nodig? Geef het gerust aan bij de bediening ter plekke.",
            },
            {
              question: "Wat als ik niemand tof vind aan tafel?",
              answer:
                "Geef het een kans: vaak merk je dat het toch gezellig is, zeker na het eerste wijntje. Klikt het echt niet? Laat het ons binnen 48 uur weten, dan zoeken we samen naar een oplossing.",
            },
            {
              question: "Hoe lang duurt het?",
              answer:
                "Reken op 2 tot 3 uur. Sommige groepen blijven langer hangen of gaan samen nog ergens eten, zolang de bar dat prima vindt. Wil je eerder weg, om wat voor reden dan ook? Dat kan gewoon.",
            },
            {
              question: "Kan ik annuleren of verplaatsen?",
              answer:
                "Annuleren is niet mogelijk. Wel kun je tot 48 uur van tevoren gratis verplaatsen naar een andere Sunday Table editie. Mail ons daarvoor op info@mytable.club.",
            },
          ],
        };

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(),
          breadcrumbJsonLd(pageUrl, [
            { name: "Home", path: localePath(locale) },
            { name: "Sunday Table", path: sundayTableLpPath(locale) },
            { name: city.name, path: sundayTableLpCityPath(locale, city.slug) },
            { name: capitalizedDate, path: sundayTableLocationPath(locale, city.slug, date) },
          ]),
        ]}
      />
      <Header dict={dict.header} locale={locale} />
      <main className="bg-cream">
        <SundayTableEventReveal
          locale={locale}
          dateLabel={capitalizedDate}
          timeLabel={timeLabel}
          venueName={location.venueName}
          address={location.address}
          heroImages={heroImages}
          intro={copy.intro}
          eyebrow={copy.eyebrow}
          tags={tags}
          detailsLabel={copy.detailsLabel}
          dateFieldLabel={copy.dateFieldLabel}
          venueFieldLabel={copy.venueFieldLabel}
          shareUrl={pageUrl}
          shareLabel={copy.shareLabel}
          shareCopiedLabel={copy.shareCopiedLabel}
          shareTitle={copy.shareTitle}
          statsEyebrow={copy.statsEyebrow}
          statsTitle={copy.statsTitle}
          stats={copy.stats}
          faqEyebrow={copy.faqEyebrow}
          faqTitle={copy.faqTitle}
          faqItems={copy.faqItems}
          eventId={ticketEvent.id}
          spotsLeft={spotsLeft}
          showSpotsCount={showSpotsCount}
          pricePerSeatEuros={pricePerSeatEuros}
          comingSoon={comingSoon}
          ticketsLeftLabel={copy.ticketsLeftLabel}
          availableChipLabel={copy.availableChipLabel}
          soldOutChipLabel={copy.soldOutChipLabel}
          comingSoonChipLabel={copy.comingSoonChipLabel}
          comingSoonTitle={copy.comingSoonTitle}
          comingSoonBody={copy.comingSoonBody}
          comingSoonEmailLabel={copy.comingSoonEmailLabel}
          comingSoonSubmitLabel={copy.comingSoonSubmitLabel}
          comingSoonSuccessLabel={copy.comingSoonSuccessLabel}
          comingSoonErrorLabel={copy.comingSoonErrorLabel}
          bookingEmailLabel={copy.bookingEmailLabel}
          bookingNameLabel={copy.bookingNameLabel}
          bookingSeatsLabel={copy.bookingSeatsLabel}
          bookingSeatOneLabel={copy.bookingSeatOneLabel}
          bookingSeatTwoLabel={copy.bookingSeatTwoLabel}
          bookingLanguageLabel={copy.bookingLanguageLabel}
          bookingLanguageDutchLabel={copy.bookingLanguageDutchLabel}
          bookingLanguageEnglishLabel={copy.bookingLanguageEnglishLabel}
          bookingLanguageBothLabel={copy.bookingLanguageBothLabel}
          bookingCtaLabel={copy.bookingCtaLabel}
          bookingCtaLabelPlural={copy.bookingCtaLabelPlural}
          bookingSoldOutLabel={copy.bookingSoldOutLabel}
          bookingGuarantees={copy.bookingGuarantees}
          bookingErrorLabel={copy.bookingErrorLabel}
          perSeatLabel={locale === "en" ? "per seat" : "per plek"}
          cityName={city.name}
          englishComingSoon={copy.englishComingSoon}
          googleRating={venueGoogleRating(location.venueName, locale)}
          highlights={highlights}
          daySteps={daySteps}
          venueAbout={venue?.about ?? null}
          included={included}
          sectionNavLabels={
            en
              ? {
                  overview: "Overview",
                  highlights: "Highlights",
                  howItWorks: "How it works",
                  venue: "Venue",
                  reviews: "Reviews",
                  faq: "FAQ",
                  share: "Share",
                  copied: "Link copied",
                }
              : {
                  overview: "Overzicht",
                  highlights: "Hoogtepunten",
                  howItWorks: "Zo werkt het",
                  venue: "Locatie",
                  reviews: "Ervaringen",
                  faq: "Vragen",
                  share: "Delen",
                  copied: "Link gekopieerd",
                }
          }
        />
      </main>
      <Footer dict={dict.footer} locale={locale} />
    </>
  );
}
