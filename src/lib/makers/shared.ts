/**
 * Makers: shared by the browser and the server. A maker's link is
 * mytable.club/?via=CODE; the middleware keeps the code in a cookie the
 * booking card can read, and the checkout checks it again.
 */

export const MAKER_COOKIE = "mt_via";
/** How long a click on a maker's link counts. */
export const MAKER_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
/** What a maker earns per paid seat and per paid membership month. */
export const MAKER_COMMISSION_CENTS = 700;
/** What a maker earns on the half-price seat of someone's second visit. */
export const MAKER_HALF_SEAT_COMMISSION_CENTS = 350;
/** How long a customer counts for the maker who brought them. */
export const MAKER_REFERRAL_YEARS = 2;
/** An unpaid referral (a checkout that was never finished) lapses after this. */
export const MAKER_UNPAID_REFERRAL_DAYS = 30;

export const MAKER_WORK_STYLES = ["self", "us", "either"] as const;
export type MakerWorkStyle = (typeof MAKER_WORK_STYLES)[number];

/** The link a maker shares. */
export function makerLink(code: string): string {
  return `https://www.mytable.club/?via=${code}`;
}

/** Letters and digits only, upper case, 2 to 24 long; anything else is no code. */
export function sanitizeMakerCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const code = raw.trim().toUpperCase();
  return /^[A-Z0-9]{2,24}$/.test(code) ? code : null;
}

/** A code made from a name: "Sanne de Vries" -> "SANNE". */
export function makerCodeFromName(name: string): string {
  const first = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .split(/\s+/)[0] ?? "";
  const code = first.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
  return code.length >= 2 ? code : "MAKER";
}

/** The maker code in the browser's cookie, or null. */
export function readMakerCodeFromDocument(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((part) => part.startsWith(`${MAKER_COOKIE}=`));
  return sanitizeMakerCode(match ? decodeURIComponent(match.slice(MAKER_COOKIE.length + 1)) : null);
}

/** Whether a referral still counts at `now`: within two years, and an unpaid one only for 30 days. */
export function referralCounts(
  referral: { createdAt: Date; firstPaidAt: Date | null },
  now: Date,
): boolean {
  const end = new Date(referral.createdAt);
  end.setFullYear(end.getFullYear() + MAKER_REFERRAL_YEARS);
  if (now.getTime() >= end.getTime()) return false;
  if (referral.firstPaidAt) return true;
  return now.getTime() - referral.createdAt.getTime() < MAKER_UNPAID_REFERRAL_DAYS * 24 * 60 * 60 * 1000;
}

/** Seats a maker earns on: the paid ones, never the free friend. */
export function commissionSeats(seats: number, freeSeat: boolean, amountCents: number): number {
  if (amountCents <= 0) return 0;
  return Math.max(0, seats - (freeSeat ? 1 : 0));
}

/** What a maker earns on a booking: €7 per paid seat, €3,50 for a half-price seat. */
export function commissionCents(input: { seats: number; freeSeat: boolean; halfSeat: boolean; amountCents: number }): number {
  const paid = commissionSeats(input.seats, input.freeSeat, input.amountCents);
  if (paid <= 0) return 0;
  return input.halfSeat ? MAKER_HALF_SEAT_COMMISSION_CENTS + (paid - 1) * MAKER_COMMISSION_CENTS : paid * MAKER_COMMISSION_CENTS;
}

/**
 * The estimate on /makers: `perMonth` new people for a year, each coming
 * 4 times in two years, and 1 in 8 a club member for 12 months.
 */
export function makerEstimate(perMonth: number): { people: number; seats: number; members: number; totalCents: number } {
  const people = Math.max(0, Math.round(perMonth)) * 12;
  const seats = people * 4;
  const members = Math.round(people / 8);
  return { people, seats, members, totalCents: (seats + members * 12) * MAKER_COMMISSION_CENTS };
}
