import { joinCityNames } from "@/lib/email/format-cities";

/** Unique subject per booking so Gmail/Apple Mail do not thread separate reservations. */
export function bookingConfirmationSubject(
  bookingCode: string,
  eventName: string,
  locale: "nl" | "en" = "nl",
): string {
  if (locale === "en") {
    return `Confirmed: ${eventName.trim()} (${bookingCode.trim()})`;
  }
  return `Bevestigd: ${eventName.trim()} (${bookingCode.trim()})`;
}

export function bookingMovedSubject(
  bookingCode: string,
  eventName: string,
  locale: "nl" | "en" = "nl",
): string {
  if (locale === "en") {
    return `Moved: ${eventName.trim()} (${bookingCode.trim()})`;
  }
  return `Verplaatst: ${eventName.trim()} (${bookingCode.trim()})`;
}

export function sundayTableConfirmationSubject(
  city: string,
  date: string,
  locale: "nl" | "en" = "nl",
): string {
  if (locale === "en") {
    return `Sunday Table confirmed: ${city.trim()} · ${date.trim()}`;
  }
  return `Sunday Table bevestigd: ${city.trim()} · ${date.trim()}`;
}

export function sundayTableCancelSubject(
  city: string,
  date: string,
  locale: "nl" | "en" = "nl",
): string {
  if (locale === "en") {
    return `Sunday Table cancelled: ${city.trim()} · ${date.trim()}`;
  }
  return `Sunday Table geannuleerd: ${city.trim()} · ${date.trim()}`;
}

export function sundayTableLocationSubject(
  city: string,
  date: string,
  locale: "nl" | "en" = "nl",
): string {
  if (locale === "en") {
    return `Sunday Table location: ${city.trim()} · ${date.trim()}`;
  }
  return `Locatie Sunday Table: ${city.trim()} · ${date.trim()}`;
}

export function sundayTablePlusOneAddedSubject(
  city: string,
  date: string,
  locale: "nl" | "en" = "nl",
): string {
  if (locale === "en") {
    return `Sunday Table +1 added: ${city.trim()} · ${date.trim()}`;
  }
  return `Sunday Table +1 toegevoegd: ${city.trim()} · ${date.trim()}`;
}

export function sundayTablePlusOneRemovedSubject(
  city: string,
  date: string,
  locale: "nl" | "en" = "nl",
): string {
  if (locale === "en") {
    return `Sunday Table +1 removed: ${city.trim()} · ${date.trim()}`;
  }
  return `Sunday Table +1 verwijderd: ${city.trim()} · ${date.trim()}`;
}

export function womenWelcomeSubject(locale: "nl" | "en" = "nl"): string {
  return locale === "en" ? "Welcome to MyTable" : "Welkom bij MyTable";
}

/** Welcome for "Jouw tafel" accounts. */
export function jouwTafelWelcomeSubject(firstName: string | null | undefined, locale: "nl" | "en" = "nl"): string {
  const name = firstName?.trim();
  if (locale === "en") return name ? `Welcome to the table, ${name}` : "Welcome to the table";
  return name ? `Welkom aan tafel, ${name}` : "Welkom aan tafel";
}

export function sundayTableWaitlistWelcomeSubject(
  cities: string[],
  locale: "nl" | "en" = "nl",
): string {
  const cityLabel = joinCityNames(cities, locale);
  if (locale === "en") {
    return `You're on the list for ${cityLabel}`;
  }
  return `Je staat op de lijst voor ${cityLabel}`;
}

export function sundayTableWaitlistInviteSubject(
  city: string,
  date: string,
  locale: "nl" | "en" = "nl",
): string {
  if (locale === "en") {
    return `A table is forming in ${city.trim()} · ${date.trim()}`;
  }
  return `Er vormt zich een tafel in ${city.trim()} · ${date.trim()}`;
}

/** "Je tafelindeling voor zondag 1 november": reads as news about a booking
 * they paid for, which gets opened far more than a playful question. */
export function sundayTableIntroRequestSubject(
  dateLabel: string,
  locale: "nl" | "en" = "nl",
): string {
  return locale === "en"
    ? `Your table for ${dateLabel.trim()}`
    : `Je tafelindeling voor ${dateLabel.trim()}`;
}

export function sundayTableTicketsOpenSubject(
  city: string,
  date: string,
  locale: "nl" | "en" = "nl",
): string {
  if (locale === "en") {
    return `Tickets are open: Sunday Table ${city.trim()} · ${date.trim()}`;
  }
  return `Aanmelden is open: Sunday Table ${city.trim()} · ${date.trim()}`;
}

/** Extra signal for clients that group on custom entity refs. */
export function bookingEmailHeaders(bookingCode: string): Record<string, string> {
  return { "X-Entity-Ref-ID": bookingCode.trim() };
}
