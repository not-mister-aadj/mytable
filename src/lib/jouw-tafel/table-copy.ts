// The table page and the reserve step after "Kies je zondag", Dutch and
// English. Facts follow the Sunday Table date page (2 to 3 hours, 4 to 6
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
  cta: {
    reserve: string;
    notify: string;
    notifyBusy: string;
    notifyDone: string;
    notifyFailed: string;
    soldOut: string;
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
  metaTitle: "Sunday Table | MyTable",
  back: "Terug naar Kies je zondag",
  imageAlt: "Een tafel die het glas heft",
  title: "Sunday Table",
  bookedCta: "Bekijk je reservering",
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
  cta: {
    reserve: "Reserveer je plek",
    notify: "Houd me op de hoogte",
    notifyBusy: "Even geduld",
    notifyDone: "Genoteerd. Je hoort het als eerste.",
    notifyFailed: "Dat lukte niet. Probeer het nog een keer.",
    soldOut: "Deze tafel is vol",
    closed: "Boeken voor deze tafel is gesloten",
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
  metaTitle: "Sunday Table | MyTable",
  back: "Back to Choose your Sunday",
  imageAlt: "A table raising their glasses",
  title: "Sunday Table",
  bookedCta: "View your booking",
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
  cta: {
    reserve: "Reserve your seat",
    notify: "Keep me posted",
    notifyBusy: "One moment",
    notifyDone: "Noted. You will be the first to know.",
    notifyFailed: "That did not work. Please try again.",
    soldOut: "This table is full",
    closed: "Booking for this table has closed",
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
