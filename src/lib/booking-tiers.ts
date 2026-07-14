export type BookingTier = "solo" | "duo" | "group";

export const BOOKING_TIER_ORDER: BookingTier[] = ["solo", "duo", "group"];

/** Minimum seats for the friends-table (group) tier. */
export const GROUP_MIN_SEATS = 3;

/** When capacity is unknown (should not happen for DB events), allow large groups. */
const GROUP_SEATS_FALLBACK_MAX = 999;

/** Fixed per-person prices in cents — server-authoritative at checkout. */
export const TIER_PER_PERSON_CENTS: Record<BookingTier, number> = {
  solo: 4900,
  duo: 3900,
  group: 4400,
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
    isBestValue: true,
    isMostChosen: true,
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

export function maxGroupSeats(spotsLeft: number | null): number {
  if (spotsLeft === null) return GROUP_SEATS_FALLBACK_MAX;
  return Math.max(GROUP_MIN_SEATS, spotsLeft);
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

/** Solo and duo join an existing table; group gets their own table. */
export function seatingForTier(tier: BookingTier): "own_table" | "join_others" {
  return tier === "group" ? "own_table" : "join_others";
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
): BookingTierPrice {
  const cfg = TIER_CONFIG[tier];
  const seats =
    tier === "group"
      ? clampGroupSeats(seatCount ?? cfg.seats, null)
      : cfg.seats;
  const perPersonCents = TIER_PER_PERSON_CENTS[tier];
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

/** Lowest per-person price across tiers (duo: €39). */
export function getLowestTierPerPersonEuros(): number {
  return Math.min(
    ...BOOKING_TIER_ORDER.map(
      (tier) => TIER_PER_PERSON_CENTS[tier] / 100,
    ),
  );
}
