/**
 * Two concepts that are tested side by side and never share an event:
 *
 * - Sunday Social: the agenda / waitlist concept (the Sunday Social pages,
 *   their locations and date pages, booking at the event's own price). Its
 *   events keep the stored type "sunday-table" from before the split, so
 *   everything built on it (locations, intro and review flows, mails) keeps
 *   working.
 * - Sunday Table: the "Jouw tafel" concept (account, quiz, €15 a seat or a
 *   membership). Its events have their own type and are only ever shown in
 *   /jouw-tafel, never in the agenda.
 */

/** events.experience_type of a Sunday Social (stored value predates the name). */
export const SUNDAY_SOCIAL_TYPE = "sunday-table";

/** events.experience_type of a "Jouw tafel" Sunday Table. */
export const JOUW_TAFEL_TYPE = "jouw-tafel";

/** Both shared-table concepts: strangers at one table, 1 or 2 seats. */
export const SHARED_TABLE_TYPES = [SUNDAY_SOCIAL_TYPE, JOUW_TAFEL_TYPE] as const;

export function isSundaySocialType(type: string | null | undefined): boolean {
  return type === SUNDAY_SOCIAL_TYPE;
}

export function isJouwTafelType(type: string | null | undefined): boolean {
  return type === JOUW_TAFEL_TYPE;
}

export function isSharedTableType(type: string | null | undefined): boolean {
  return isSundaySocialType(type) || isJouwTafelType(type);
}
