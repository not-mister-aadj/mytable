/** Client-safe Sunday Table seat helpers (no DB imports). */

/** Default seats per Sunday Table (city + date + type). */
export const SUNDAY_TABLE_DEFAULT_CAPACITY = 10;

export function seatStatsKey(
  city: string,
  tableDate: string,
  tableType: string,
): string {
  return `${city}__${tableDate}__${tableType}`;
}
