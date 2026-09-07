/** Joins a list of city names the way a person would say them out loud —
 * "Rotterdam", "Rotterdam en Utrecht", "Rotterdam, Utrecht en Den Haag" —
 * instead of a flat comma list. Shared by the waitlist welcome email's
 * subject line and body, which both list every city someone joined the
 * waitlist for, not just the first. */
export function joinCityNames(cities: string[], locale: "nl" | "en" = "nl"): string {
  const names = cities.map((c) => c.trim()).filter(Boolean);
  if (names.length === 0) return "";
  if (names.length === 1) return names[0]!;
  const and = locale === "en" ? "and" : "en";
  return `${names.slice(0, -1).join(", ")} ${and} ${names[names.length - 1]}`;
}
