export type BookingTier = "solo" | "duo" | "group";

export const BOOKING_TIER_ORDER: BookingTier[] = ["solo", "duo", "group"];

/** Minimum seats for the friends-table (group) tier. */
export const GROUP_MIN_SEATS = 3;

/** Upper cap for group bookings per order (also limited by spots left). */
export const GROUP_MAX_SEATS = 8;

type TierConfig = {
  tier: BookingTier;
  seats: number;
  /** Per-person discount off the base price, in euros. */
  perPersonDiscountEuros: number;
  isBestValue: boolean;
  isMostChosen: boolean;
};

const TIER_CONFIG: Record<BookingTier, TierConfig> = {
  solo: {
    tier: "solo",
    seats: 1,
    perPersonDiscountEuros: 0,
    isBestValue: false,
    isMostChosen: false,
  },
  duo: {
    tier: "duo",
    seats: 2,
    perPersonDiscountEuros: 10,
    isBestValue: true,
    isMostChosen: true,
  },
  group: {
    tier: "group",
    seats: GROUP_MIN_SEATS,
    perPersonDiscountEuros: 5,
    isBestValue: false,
    isMostChosen: false,
  },
};

/** Never let a per-person price drop below this after applying a tier discount. */
const MIN_PER_PERSON_CENTS = 100;

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

export function maxGroupSeats(spotsLeft: number | null): number {
  if (spotsLeft === null) return GROUP_MAX_SEATS;
  return Math.min(GROUP_MAX_SEATS, spotsLeft);
}

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
  const cfg = getBookingTierConfig(tier);
  if (tier === "group") {
    const seats = clampGroupSeats(requestedSeats, spotsLeft);
    if (spotsLeft !== null && seats > spotsLeft) return null;
    return seats;
  }
  const seats = Math.floor(requestedSeats) || cfg.seats;
  return seats === cfg.seats ? cfg.seats : null;
}

/** Solo guests join an existing table; duo and group get their own table. */
export function seatingForTier(tier: BookingTier): "own_table" | "join_others" {
  return tier === "solo" ? "join_others" : "own_table";
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
  basePriceCents: number,
  tier: BookingTier,
  seatCount?: number,
): BookingTierPrice {
  const cfg = TIER_CONFIG[tier];
  const seats =
    tier === "group"
      ? clampGroupSeats(seatCount ?? cfg.seats, null)
      : cfg.seats;
  const perPersonCents = Math.max(
    MIN_PER_PERSON_CENTS,
    basePriceCents - cfg.perPersonDiscountEuros * 100,
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

export function getBookingTiers(basePriceCents: number): BookingTierPrice[] {
  return BOOKING_TIER_ORDER.map((tier) => computeTierPrice(basePriceCents, tier));
}
