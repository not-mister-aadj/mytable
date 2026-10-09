// The table page and the reserve step after "Kies je zondag", Dutch and
// English. Facts follow the Sunday Social date page (2 to 3 hours, 4 to 6
// people, drinks ordered and paid yourself, our picks the day before), the
// landing FAQ and the terms (7 days to move, goes ahead from 4 guests,
// 18+). Never a venue: the bar is known a week ahead. No em dashes, no
// exclamation marks.

type Locale = "nl" | "en";

export type TableCopy = {
  metaTitle: string;
  back: string;
  imageAlt: string;
  title: string;
  dateLine: (date: string, time: string, city: string) => string;
  how: { title: string; steps: (time: string) => string[] };
  /** The button on a table this person already has a seat at. */
  bookedCta: string;
  expect: { title: string; items: string[] };
  good: { title: string; items: string[] };
  /** The pill under the title. */
  sizeTag: string;
  /** "Waarom mensen bij MyTable komen": real numbers from the waitlist. */
  stats: { eyebrow: string; title: string; labels: [string, string, string, string] };
  /** "Nog twijfels?": the questions at the bottom of the table page. */
  faq: { eyebrow: string; title: string; items: { q: string; a: string }[] };
  cta: {
    reserve: string;
    notify: string;
    notifyBusy: string;
    notifyDone: string;
    notifyFailed: string;
    closed: string;
  };
  reserve: {
    metaTitle: string;
    title: string;
    seats: string;
    seatOption: (n: 1 | 2) => string;
    onlyOneLeft: string;
    perSeat: (price: string) => string;
    total: string;
    pay: string;
    paying: string;
    error: string;
  };
};

const nl: TableCopy = {
  metaTitle: "Sunday Social | MyTable",
  back: "Terug naar Kies je zondag",
  imageAlt: "Een tafel die het glas heft",
  title: "Sunday Social",
  bookedCta: "Bekijk je reservering",
  sizeTag: "4 tot 6 personen",
  stats: {
    eyebrow: "Waarom mensen bij MyTable komen",
    title: "Herkenbaar? Dit blijkt uit de data van al onze events",
    labels: [
      "komt om nieuwe mensen te ontmoeten",
      "komt in z'n eentje",
      "wil een nieuwe plek ontdekken",
      "komt gewoon voor de gezelligheid",
    ],
  },
  dateLine: (date, time, city) => `${date} · ${time} · ${city}`,
  how: {
    title: "Zo werkt het",
    steps: (time) => [
      "Je reserveert je plek.",
      "Een week van tevoren hoor je in welke wijnbar je aanschuift.",
      `Om ${time} schuif je aan bij 4 tot 6 mensen.`,
      "Vaak zitten er meer tafels in dezelfde wijnbar. Zo ontmoet je nog meer mensen.",
    ],
  },
  expect: {
    title: "Wat je kunt verwachten",
    items: [
      "Een goede wijnbar in de stad, waar wij zelf graag zitten.",
      "Een tafel met mensen die net als jij zin hebben in een gezellige zondag.",
      "Je bestelt zelf wat je wilt drinken en eten van de kaart. Een dag van tevoren mailen we onze aanraders.",
      "Reken op twee tot drie uur. Of langer, als het klikt.",
      "Soms blijft een tafel daarna nog samen eten.",
    ],
  },
  good: {
    title: "Goed om te weten",
    items: [
      "We stellen de tafels samen op basis van ieders voorkeuren.",
      "De meeste gasten komen alleen.",
      "Gratis verzetten tot 7 dagen vooraf.",
      "Een tafel gaat door vanaf 4 gasten. Zo niet, dan krijg je je geld terug.",
      "Je drankjes betaal je zelf aan tafel.",
    ],
  },
  faq: {
    eyebrow: "Vragen",
    title: "Nog twijfels? Hier zijn de antwoorden",
    items: [
      {
        q: "Wat is Sunday Social?",
        a: "Een tafel van 4 tot 6 mensen die je nog niet kent, in een goede wijnbar in jouw stad. Je boekt een plek, schuift aan en ontdekt samen een nieuwe plek. Wij geven onze eigen wijnaanraders mee.",
      },
      {
        q: "Voor wie is deze tafel?",
        a: "Voor wie houdt van een goed glas en een goed gesprek. Je hoeft niemand mee te nemen: de meeste gasten komen alleen.",
      },
      {
        q: "Wat kost het?",
        a: "€10 voor je plek aan tafel. Drankjes en bites bestel en betaal je zelf aan tafel, van de kaart van de wijnbar.",
      },
      {
        q: "Hoe groot is een tafel?",
        a: "4 tot 6 mensen. Vaak zitten er meer tafels in dezelfde wijnbar.",
      },
      {
        q: "Waar is het?",
        a: "Altijd in een goede wijnbar in jouw stad. Zodra we weten met hoeveel jullie zijn, kiezen we de plek. Een week van tevoren hoor je waar.",
      },
      {
        q: "Wanneer kan ik boeken?",
        a: "Vanaf ongeveer 4 weken van tevoren. Bij de tafel zie je vanaf welke dag.",
      },
      {
        q: "Wat is Ladies only?",
        a: "Kies je bij Kies je zondag voor Ladies only, dan zetten we je aan een tafel met alleen vrouwen. Heb je aangevinkt dat een mixed table ook goed is, dan schuif je aan bij een mixed table als het een keer niet lukt.",
      },
      {
        q: "Moet ik allergieën of dieetwensen doorgeven?",
        a: "Nee, dat hoeft niet vooraf. Je bestelt zelf van de kaart, dus je kiest wat bij je past.",
      },
      {
        q: "Hoe lang duurt het?",
        a: "Reken op 2 tot 3 uur. Soms blijft een tafel daarna nog samen eten. Wil je eerder weg? Dat kan gewoon.",
      },
      {
        q: "Gaat het altijd door?",
        a: "Een tafel gaat door vanaf 4 gasten. Lukt dat niet, dan krijg je je geld automatisch terug en stellen we je een andere datum voor.",
      },
      {
        q: "Kan ik mijn datum wijzigen?",
        a: "Ja. Tot 7 dagen voor je tafel kies je kosteloos een andere zondag. Daarna kan het niet meer, omdat we dan de wijnbar reserveren.",
      },
      {
        q: "Wat als het niet klikt?",
        a: "Laat het ons binnen 2 dagen na je tafel weten, dan is je volgende Sunday Social op ons. Zo kun je het nog een keer proberen, aan een andere tafel.",
      },
    ],
  },
  cta: {
    reserve: "Reserveer je plek",
    notify: "Houd me op de hoogte",
    notifyBusy: "Even geduld",
    notifyDone: "Genoteerd. Je hoort het als eerste.",
    notifyFailed: "Dat lukte niet. Probeer het nog een keer.",
    closed: "Deze tafel is niet meer te boeken",
  },
  reserve: {
    metaTitle: "Reserveren | MyTable",
    title: "Reserveer je plek",
    seats: "Plekken",
    seatOption: (n) => (n === 1 ? "1 plek" : "2 plekken"),
    onlyOneLeft: "Nog 1 plek aan deze tafel.",
    perSeat: (price) => `${price} per plek`,
    total: "Totaal",
    pay: "Naar betalen",
    paying: "Even geduld",
    error: "Afrekenen lukte niet. Probeer het nog een keer.",
  },
};

const en: TableCopy = {
  metaTitle: "Sunday Social | MyTable",
  back: "Back to Choose your Sunday",
  imageAlt: "A table raising their glasses",
  title: "Sunday Social",
  bookedCta: "View your booking",
  sizeTag: "4 to 6 people",
  stats: {
    eyebrow: "Why people come to MyTable",
    title: "Sound familiar? Here's what we see across all our events",
    labels: ["come to meet new people", "come solo", "want to discover a new place", "just come for good company"],
  },
  dateLine: (date, time, city) => `${date} · ${time} · ${city}`,
  how: {
    title: "How it works",
    steps: (time) => [
      "You reserve your seat.",
      "A week before, you hear which wine bar you are joining.",
      `At ${time} you join 4 to 6 people at the table.`,
      "There are often more tables in the same wine bar, so you meet even more people.",
    ],
  },
  expect: {
    title: "What to expect",
    items: [
      "A good wine bar in the city, one we like to sit in ourselves.",
      "A table with people who, like you, are in the mood for a cosy Sunday.",
      "You order your own drinks and food from the menu. The day before, we email our own picks.",
      "Plan for two to three hours. Or longer, if it clicks.",
      "Some tables stay on for dinner together afterwards.",
    ],
  },
  good: {
    title: "Good to know",
    items: [
      "We put the tables together based on everyone's preferences.",
      "Most guests come alone.",
      "Free to move up to 7 days before.",
      "A table goes ahead from 4 guests. If not, you get your money back.",
      "You pay for your own drinks at the table.",
    ],
  },
  faq: {
    eyebrow: "Questions",
    title: "Still on the fence? Here are the answers",
    items: [
      {
        q: "What is Sunday Social?",
        a: "A table of 4 to 6 people you have not met yet, in a good wine bar in your city. You book a seat, join the table and discover a new place together. We add our own wine picks.",
      },
      {
        q: "Who is this table for?",
        a: "For anyone who enjoys a good glass and a good conversation. No need to bring anyone: most guests come alone.",
      },
      {
        q: "What does it cost?",
        a: "€10 for your seat at the table. Drinks and bites you order and pay yourself at the table, from the wine bar's menu.",
      },
      {
        q: "How big is a table?",
        a: "4 to 6 people. There are often more tables in the same wine bar.",
      },
      {
        q: "Where is it?",
        a: "Always in a good wine bar in your city. Once we know how many of you there are, we choose the place. A week before, you hear where.",
      },
      {
        q: "When can I book?",
        a: "From about 4 weeks before. The table shows from which day.",
      },
      {
        q: "What is Ladies only?",
        a: "Choose Ladies only on Choose your Sunday and we seat you at a table with women only. If you ticked that a mixed table is fine too, you join a mixed table when it does not work out.",
      },
      {
        q: "Do I need to share allergies or dietary needs?",
        a: "No need beforehand. You order from the menu yourself, so you pick what suits you.",
      },
      {
        q: "How long does it last?",
        a: "Plan for 2 to 3 hours. Some tables stay on for dinner together afterwards. Want to leave earlier? That is fine.",
      },
      {
        q: "Does it always go ahead?",
        a: "A table goes ahead from 4 guests. If it does not, you get your money back automatically and we suggest another date.",
      },
      {
        q: "Can I change my date?",
        a: "Yes. Up to 7 days before your table you can pick another Sunday at no cost. After that it is no longer possible, because we book the wine bar then.",
      },
      {
        q: "What if it does not click?",
        a: "Let us know within 2 days after your table and your next Sunday Social is on us. So you can try again, at another table.",
      },
    ],
  },
  cta: {
    reserve: "Reserve your seat",
    notify: "Keep me posted",
    notifyBusy: "One moment",
    notifyDone: "Noted. You will be the first to know.",
    notifyFailed: "That did not work. Please try again.",
    closed: "This table is no longer available",
  },
  reserve: {
    metaTitle: "Reserve | MyTable",
    title: "Reserve your seat",
    seats: "Seats",
    seatOption: (n) => (n === 1 ? "1 seat" : "2 seats"),
    onlyOneLeft: "1 seat left at this table.",
    perSeat: (price) => `${price} per seat`,
    total: "Total",
    pay: "Go to payment",
    paying: "One moment",
    error: "Checkout did not work. Please try again.",
  },
};

export function getTableCopy(locale: Locale): TableCopy {
  return locale === "en" ? en : nl;
}
