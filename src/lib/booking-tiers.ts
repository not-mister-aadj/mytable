export type BookingTier = "solo" | "duo" | "group";

export const BOOKING_TIER_ORDER: BookingTier[] = ["solo", "duo", "group"];

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
    isMostChosen: true,
  },
  duo: {
    tier: "duo",
    seats: 2,
    perPersonDiscountEuros: 2,
    isBestValue: false,
    isMostChosen: false,
  },
  group: {
    tier: "group",
    seats: 4,
    perPersonDiscountEuros: 5,
    isBestValue: true,
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
  if (seats >= 4) return "group";
  if (seats >= 2) return "duo";
  return "solo";
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
): BookingTierPrice {
  const cfg = TIER_CONFIG[tier];
  const perPersonCents = Math.max(
    MIN_PER_PERSON_CENTS,
    basePriceCents - cfg.perPersonDiscountEuros * 100,
  );
  const totalCents = perPersonCents * cfg.seats;
  return {
    tier,
    seats: cfg.seats,
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
