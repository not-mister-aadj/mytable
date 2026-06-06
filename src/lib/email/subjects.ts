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

/** Extra signal for clients that group on custom entity refs. */
export function bookingEmailHeaders(bookingCode: string): Record<string, string> {
  return { "X-Entity-Ref-ID": bookingCode.trim() };
}
