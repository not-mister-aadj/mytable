import type { Locale } from "@/i18n/config";

export function formatMoney(
  cents: number,
  currency: string,
  locale: Locale,
): string {
  return new Intl.NumberFormat(locale === "nl" ? "nl-NL" : "en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

/** A euro amount without the sign, for copy that puts "€" in front itself:
 * "10" for whole euros, "19,50" (nl) or "19.50" (en) otherwise. */
export function formatEuroAmount(euros: number, locale: Locale): string {
  const whole = Number.isInteger(euros);
  return new Intl.NumberFormat(locale === "nl" ? "nl-NL" : "en-GB", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(euros);
}

export function formatGuestCount(
  count: number,
  template: string,
  locale: Locale,
): string {
  const [singular, plural] = template.split(" | ");
  if (locale === "nl") {
    return count === 1 ? singular.replace("{count}", "1") : plural.replace("{count}", String(count));
  }
  return count === 1 ? singular.replace("{count}", "1") : plural.replace("{count}", String(count));
}

export function reservationCode(bookingId: string): string {
  return `MT-${bookingId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}
