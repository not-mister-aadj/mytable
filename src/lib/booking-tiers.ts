export type BookingTier = "solo" | "duo" | "group";

export const BOOKING_TIER_ORDER: BookingTier[] = ["solo", "duo", "group"];

/** Minimum seats for the friends-table (group) tier. */
export const GROUP_MIN_SEATS = 3;

/** Max tickets per booking (UI + server). */
export const MAX_BOOKING_SEATS = 6;

/** Minimum tickets per booking. */
export const MIN_BOOKING_SEATS = 1;

/** Flat per-person price in cents — same for every ticket quantity. */
export const FLAT_PER_PERSON_CENTS = 4900;

/** Active Clubmembers get this % off culinary experience tickets. */
export const CLUBMEMBER_EXPERIENCE_DISCOUNT_PERCENT = 10;

export function applyClubmemberDiscount(
  amountCents: number,
  isClubMember: boolean,
): number {
  if (!isClubMember || amountCents <= 0) return amountCents;
  return Math.round(
    amountCents * (1 - CLUBMEMBER_EXPERIENCE_DISCOUNT_PERCENT / 100),
  );
}

/** Fixed per-person prices in cents — server-authoritative at checkout. */
export const TIER_PER_PERSON_CENTS: Record<BookingTier, number> = {
  solo: FLAT_PER_PERSON_CENTS,
  duo: FLAT_PER_PERSON_CENTS,
  group: FLAT_PER_PERSON_CENTS,
};

type TierConfig = {
  tier: BookingTier;
  seats: number;
  isBestValue: boolean;
  isMostChosen: boolean;
};

const TIER_CONFIG: Record<BookingTier, TierConfig> = {
  solo: {
    tier: "solo",
    seats: 1,
    isBestValue: false,
    isMostChosen: false,
  },
  duo: {
    tier: "duo",
    seats: 2,
    isBestValue: false,
    isMostChosen: false,
  },
  group: {
    tier: "group",
    seats: GROUP_MIN_SEATS,
    isBestValue: false,
    isMostChosen: false,
  },
};

export function isBookingTier(value: unknown): value is BookingTier {
  return value === "solo" || value === "duo" || value === "group";
}

export function getBookingTierConfig(tier: BookingTier): TierConfig {
  return TIER_CONFIG[tier];
}

/** Map a raw seat count to its tier (fallback when no explicit tier is sent). */
export function tierForSeats(seats: number): BookingTier {
  if (seats >= GROUP_MIN_SEATS) return "group";
  if (seats >= 2) return "duo";
  return "solo";
}

/** Max selectable tickets given remaining capacity. */
export function maxTicketSeats(spotsLeft: number | null): number {
  if (spotsLeft === null) return MAX_BOOKING_SEATS;
  return Math.max(0, Math.min(MAX_BOOKING_SEATS, spotsLeft));
}

export function clampTicketSeats(
  seats: number,
  spotsLeft: number | null,
): number {
  const max = maxTicketSeats(spotsLeft);
  if (max < MIN_BOOKING_SEATS) return MIN_BOOKING_SEATS;
  const raw = Math.floor(seats);
  const n = Number.isFinite(raw) && raw > 0 ? raw : MIN_BOOKING_SEATS;
  return Math.min(max, Math.max(MIN_BOOKING_SEATS, n));
}

/** @deprecated Prefer maxTicketSeats — kept for older group-stepper call sites. */
export function maxGroupSeats(spotsLeft: number | null): number {
  return Math.max(GROUP_MIN_SEATS, maxTicketSeats(spotsLeft));
}

/** @deprecated Prefer clampTicketSeats. */
export function clampGroupSeats(
  seats: number,
  spotsLeft: number | null,
): number {
  return Math.min(
    maxGroupSeats(spotsLeft),
    Math.max(GROUP_MIN_SEATS, Math.floor(seats) || GROUP_MIN_SEATS),
  );
}

export function resolveSeatsForTier(
  tier: BookingTier,
  requestedSeats: number,
  spotsLeft: number | null,
): number | null {
  const seats = Math.floor(requestedSeats);
  if (!Number.isFinite(seats)) return null;
  if (seats < MIN_BOOKING_SEATS || seats > MAX_BOOKING_SEATS) return null;
  if (spotsLeft !== null && seats > spotsLeft) return null;
  if (tierForSeats(seats) !== tier) return null;
  return seats;
}

/**
 * Experiences no longer match strangers into shared tables.
 * Guests bring their own party (1–6 tickets).
 */
export function seatingForTier(_tier: BookingTier): "own_table" | "join_others" {
  return "own_table";
}

export type BookingTierPrice = {
  tier: BookingTier;
  seats: number;
  perPersonCents: number;
  totalCents: number;
  perPersonEuros: number;
  totalEuros: number;
  isBestValue: boolean;
  isMostChosen: boolean;
};

export function computeTierPrice(
  tier: BookingTier,
  seatCount?: number,
  options?: { clubMemberDiscount?: boolean },
): BookingTierPrice {
  const cfg = TIER_CONFIG[tier];
  const seats =
    seatCount != null
      ? clampTicketSeats(seatCount, null)
      : cfg.seats;
  const perPersonCents = applyClubmemberDiscount(
    TIER_PER_PERSON_CENTS[tier],
    Boolean(options?.clubMemberDiscount),
  );
  const totalCents = perPersonCents * seats;
  return {
    tier,
    seats,
    perPersonCents,
    totalCents,
    perPersonEuros: Math.round(perPersonCents / 100),
    totalEuros: Math.round(totalCents / 100),
    isBestValue: cfg.isBestValue,
    isMostChosen: cfg.isMostChosen,
  };
}

export function getBookingTiers(): BookingTierPrice[] {
  return BOOKING_TIER_ORDER.map((tier) => computeTierPrice(tier));
}

/** Flat per-person price in euros (all tiers). */
export function getLowestTierPerPersonEuros(): number {
  return FLAT_PER_PERSON_CENTS / 100;
}
