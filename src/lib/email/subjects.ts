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

export function membershipRenewalReminderSubject(
  renewalDate: string,
  locale: "nl" | "en" = "nl",
  variant: "trial_upsell" | "renewal" = "renewal",
): string {
  if (variant === "trial_upsell") {
    return locale === "en"
      ? "Your trial is ending. Switch to a cheaper plan."
      : "Je trial loopt bijna af. Kies een plan dat minder kost.";
  }
  return locale === "en"
    ? `Your Clubmember plan renews on ${renewalDate.trim()}`
    : `Je Clubmember verlengt op ${renewalDate.trim()}`;
}

/** Extra signal for clients that group on custom entity refs. */
export function bookingEmailHeaders(bookingCode: string): Record<string, string> {
  return { "X-Entity-Ref-ID": bookingCode.trim() };
}
