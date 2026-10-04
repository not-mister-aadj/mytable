// Settings page copy (/jouw-tafel/instellingen), Dutch and English. Same
// house rules as the quiz: short, calm, no em dashes, no exclamation marks.

import type { Locale } from "@/i18n/config";

export type SettingsCopy = {
  metaTitle: string;
  title: string;
  back: string;
  close: string;
  saved: string;
  saveFailed: string;
  save: string;
  notSet: string;
  reservations: {
    title: string;
    none: string;
    choose: string;
    earlier: (n: number) => string;
    tableName: string;
    seats: (n: number) => string;
    code: string;
    detailTitle: string;
    date: string;
    time: string;
    city: string;
    seatsLabel: string;
    whereNote: string;
    change: string;
    changeLink: string;
    /** Self-service "verzetten" to the next Sunday (single seats). */
    reschedule: {
      button: string;
      confirm: (date: string, city: string) => string;
      confirmButton: string;
      cancelButton: string;
      busy: string;
      tooLate: string;
      none: (city: string) => string;
      done: (date: string) => string;
      failed: string;
      changed: string;
      questions: string;
    };
  };
  groups: { tafel: string; zondag: string; binnenkort: string; notifications: string; account: string; help: string };
  rows: {
    stad: string;
    leeftijd: string;
    gender: string;
    tafeltype: string;
    taal: string;
    gezelschap: string;
    wie: string;
    zoekt: string;
    wijn: string;
    gesprek: string;
    dieet: string;
    formats: string;
  };
  notifications: { label: string; note: string };
  account: {
    name: string;
    email: string;
    birthDate: string;
    gender: string;
    locked: string;
    lockedNote: string;
    lockedLink: string;
    siteLanguage: string;
  };
  help: { faq: string; contact: string; terms: string; privacy: string };
  logOut: string;
  loggingOut: string;
  deleteAccount: string;
  delete: {
    title: string;
    body: string;
    booking: (date: string) => string;
    legal: string;
    confirm: string;
    busy: string;
    cancel: string;
    failed: string;
  };
  deletedNotice: string;
  /** Toasts after tapping our email address (it is copied, not opened). */
  emailCopied: string;
  emailCopyFailed: (email: string) => string;
};

const nl: SettingsCopy = {
  metaTitle: "Instellingen · MyTable",
  title: "Instellingen",
  back: "Terug",
  close: "Sluiten",
  saved: "Opgeslagen",
  saveFailed: "Dat lukte niet. Probeer het nog een keer.",
  save: "Opslaan",
  notSet: "Nog niet ingevuld",
  reservations: {
    title: "Mijn reserveringen",
    none: "Nog geen reserveringen.",
    choose: "Kies je zondag",
    earlier: (n) => `Eerdere (${n})`,
    tableName: "Sunday Table",
    seats: (n) => (n === 1 ? "1 plek" : `${n} plekken`),
    code: "Boekingscode",
    detailTitle: "Je reservering",
    date: "Datum",
    time: "Tijd",
    city: "Stad",
    seatsLabel: "Plekken",
    whereNote: "Waar precies, hoor je een week van tevoren.",
    change: "Verzetten kan gratis tot 7 dagen vooraf. Verzetten of annuleren? Stuur ons een berichtje.",
    changeLink: "Kopieer ons e-mailadres",
    reschedule: {
      button: "Verzetten naar de volgende zondag",
      confirm: (date, city) => `Je reservering gaat naar ${date} in ${city}, om 14:00.`,
      confirmButton: "Verzetten",
      cancelButton: "Annuleren",
      busy: "Verzetten",
      tooLate: "Verzetten kan tot 7 dagen vooraf.",
      none: (city) => `Er is nog geen volgende zondag in ${city}. Mail ons, dan zoeken we samen een oplossing.`,
      done: (date) => `Verzet naar ${date}.`,
      failed: "Verzetten lukte niet. Probeer het nog een keer.",
      changed: "De volgende zondag is net veranderd. Kijk nog een keer.",
      questions: "Vragen over je reservering? Stuur ons een berichtje.",
    },
  },
  groups: {
    tafel: "Jouw tafel",
    zondag: "Jouw zondag",
    binnenkort: "Binnenkort bij MyTable",
    notifications: "Meldingen",
    account: "Account",
    help: "Hulp",
  },
  rows: {
    stad: "Steden",
    leeftijd: "Leeftijdsgroep belangrijk",
    gender: "Gender",
    tafeltype: "Soort tafel",
    taal: "Taal aan tafel",
    gezelschap: "Alleen of met iemand",
    wie: "Wie",
    zoekt: "Waar heb je zin in",
    wijn: "Wijn",
    gesprek: "Gesprek",
    dieet: "Dieetwensen",
    formats: "Formats",
  },
  notifications: {
    label: "Mail me over nieuwe tafels in mijn steden",
    note: "Mails over je eigen reserveringen krijg je altijd.",
  },
  account: {
    name: "Voornaam",
    email: "E-mailadres",
    birthDate: "Geboortedatum",
    gender: "Gender",
    locked: "Kan niet aangepast worden",
    lockedNote: "Klopt dit niet? Mail ons:",
    lockedLink: "Kopieer e-mailadres",
    siteLanguage: "Taal van de site",
  },
  help: { faq: "Veelgestelde vragen", contact: "Contact", terms: "Algemene voorwaarden", privacy: "Privacybeleid" },
  logOut: "Uitloggen",
  loggingOut: "Uitloggen...",
  deleteAccount: "Account verwijderen",
  delete: {
    title: "Account verwijderen?",
    body: "Je account en al je antwoorden en voorkeuren worden verwijderd. Dit kan niet ongedaan worden gemaakt.",
    booking: (date) =>
      `Je reservering op ${date} blijft staan. Wil je die annuleren of verzetten, stuur ons dan een berichtje.`,
    legal: "Sommige gegevens, zoals je boekingen en betalingen, bewaren we zolang de wet dat voorschrijft.",
    confirm: "Account verwijderen",
    busy: "Even geduld...",
    cancel: "Annuleren",
    failed: "Dat lukte niet. Probeer het nog een keer of stuur ons een berichtje.",
  },
  deletedNotice: "Je account is verwijderd.",
  emailCopied: "E-mailadres gekopieerd",
  emailCopyFailed: (email) => `Kopiëren lukte niet. Ons adres is ${email}`,
};

const en: SettingsCopy = {
  metaTitle: "Settings · MyTable",
  title: "Settings",
  back: "Back",
  close: "Close",
  saved: "Saved",
  saveFailed: "That didn't work. Please try again.",
  save: "Save",
  notSet: "Not filled in yet",
  reservations: {
    title: "My reservations",
    none: "No reservations yet.",
    choose: "Choose your Sunday",
    earlier: (n) => `Earlier (${n})`,
    tableName: "Sunday Table",
    seats: (n) => (n === 1 ? "1 seat" : `${n} seats`),
    code: "Booking code",
    detailTitle: "Your reservation",
    date: "Date",
    time: "Time",
    city: "City",
    seatsLabel: "Seats",
    whereNote: "You'll hear exactly where a week before.",
    change: "Rescheduling is free up to 7 days ahead. Want to reschedule or cancel? Send us a message.",
    changeLink: "Copy our email address",
    reschedule: {
      button: "Move to the next Sunday",
      confirm: (date, city) => `Your booking moves to ${date} in ${city}, at 2:00 PM.`,
      confirmButton: "Move",
      cancelButton: "Cancel",
      busy: "Moving",
      tooLate: "Moving is possible up to 7 days before.",
      none: (city) => `There is no next Sunday in ${city} yet. Email us and we will find a solution together.`,
      done: (date) => `Moved to ${date}.`,
      failed: "Moving did not work. Please try again.",
      changed: "The next Sunday just changed. Please take another look.",
      questions: "Questions about your booking? Send us a message.",
    },
  },
  groups: {
    tafel: "Your table",
    zondag: "Your Sunday",
    binnenkort: "Coming soon at MyTable",
    notifications: "Notifications",
    account: "Account",
    help: "Help",
  },
  rows: {
    stad: "Cities",
    leeftijd: "Age group matters",
    gender: "Gender",
    tafeltype: "Kind of table",
    taal: "Language at the table",
    gezelschap: "Alone or with someone",
    wie: "Who",
    zoekt: "What you're looking for",
    wijn: "Wine",
    gesprek: "Conversation",
    dieet: "Dietary wishes",
    formats: "Formats",
  },
  notifications: {
    label: "Email me about new tables in my cities",
    note: "You always get emails about your own reservations.",
  },
  account: {
    name: "First name",
    email: "Email address",
    birthDate: "Date of birth",
    gender: "Gender",
    locked: "Can't be changed",
    lockedNote: "Not right? Email us:",
    lockedLink: "Copy email address",
    siteLanguage: "Site language",
  },
  help: { faq: "Frequently asked questions", contact: "Contact", terms: "Terms and conditions", privacy: "Privacy policy" },
  logOut: "Log out",
  loggingOut: "Logging out...",
  deleteAccount: "Delete account",
  delete: {
    title: "Delete your account?",
    body: "Your account and all your answers and preferences will be deleted. This can't be undone.",
    booking: (date) =>
      `Your reservation on ${date} stays as it is. If you want to cancel or reschedule it, send us a message.`,
    legal: "Some details, such as your bookings and payments, are kept for as long as the law requires.",
    confirm: "Delete account",
    busy: "One moment...",
    cancel: "Cancel",
    failed: "That didn't work. Please try again or send us a message.",
  },
  deletedNotice: "Your account has been deleted.",
  emailCopied: "Email address copied",
  emailCopyFailed: (email) => `Copying didn't work. Our address is ${email}`,
};

export function getSettingsCopy(locale: Locale): SettingsCopy {
  return locale === "en" ? en : nl;
}
