/** Sunday Tables where the ticket includes a glass of wine on arrival, by
 * event id. The date page lists the glass under "what you get" and in the
 * price answer of the FAQ. Add an event here only once the venue has agreed
 * to pour it. */
const WELCOME_GLASS_EVENT_IDS: ReadonlySet<string> = new Set([
  // Rotterdam, Bar Juni, 25 October 2026 (35+)
  "76e4b79f-af75-42ff-bee3-80ecf9cf45d7",
]);

export function includesWelcomeGlass(eventId: string): boolean {
  return WELCOME_GLASS_EVENT_IDS.has(eventId);
}
