/** Hours before start when new bookings close. */
export const BOOKING_CLOSE_HOURS = 48;

/** Days after event start to keep showing on the agenda page. */
export const AGENDA_RETENTION_DAYS = 7;

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

export function getBookingCloseAt(startsAt: Date): Date {
  return new Date(startsAt.getTime() - BOOKING_CLOSE_HOURS * MS_PER_HOUR);
}

export function isEventClosedForBooking(
  startsAt: Date,
  now = new Date(),
): boolean {
  return now.getTime() >= getBookingCloseAt(startsAt).getTime();
}

export function isVisibleOnAgenda(startsAt: Date, now = new Date()): boolean {
  const hideAfter = startsAt.getTime() + AGENDA_RETENTION_DAYS * MS_PER_DAY;
  return now.getTime() < hideAfter;
}

export function isVisibleOnLanding(
  startsAt: Date,
  endsAt: Date | null,
  now = new Date(),
): boolean {
  if (isEventClosedForBooking(startsAt, now)) return false;
  if (startsAt.getTime() >= now.getTime()) return true;
  return endsAt !== null && endsAt.getTime() >= now.getTime();
}
