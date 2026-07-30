/** Unique subject per booking so Gmail/Apple Mail do not thread separate reservations. */
export function bookingConfirmationSubject(
  bookingCode: string,
  eventName: string,
): string {
  return `Bevestigd: ${eventName.trim()} (${bookingCode.trim()})`;
}

export function bookingMovedSubject(
  bookingCode: string,
  eventName: string,
): string {
  return `Verplaatst: ${eventName.trim()} (${bookingCode.trim()})`;
}

export function sundayTableConfirmationSubject(
  city: string,
  date: string,
): string {
  return `Sunday Table bevestigd: ${city.trim()} · ${date.trim()}`;
}

export function sundayTableCancelSubject(
  city: string,
  date: string,
): string {
  return `Sunday Table geannuleerd: ${city.trim()} · ${date.trim()}`;
}

export function sundayTableLocationSubject(
  city: string,
  date: string,
): string {
  return `Locatie Sunday Table: ${city.trim()} · ${date.trim()}`;
}

/** Extra signal for clients that group on custom entity refs. */
export function bookingEmailHeaders(bookingCode: string): Record<string, string> {
  return { "X-Entity-Ref-ID": bookingCode.trim() };
}
