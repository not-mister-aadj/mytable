// Refunds and disputes from Stripe: the pure part, unit tested
// (npx tsx --test src/lib/stripe/*.test.ts).

/** "full" when everything was refunded, "partial" for part of it. */
export function refundKind(amount: number, amountRefunded: number): "full" | "partial" | "none" {
  if (amountRefunded <= 0) return "none";
  return amountRefunded >= amount ? "full" : "partial";
}

/** 1050 -> "€10,50". */
export function euros(cents: number): string {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(cents / 100);
}
