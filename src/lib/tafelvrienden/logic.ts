/** Tafelvrienden: who you'd like to see again. Pure and client-safe. */

const DAY_MS = 24 * 60 * 60 * 1000;

function amsterdamDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(date);
}

/** UTC offset of Amsterdam at that moment, in ms (+1h in winter, +2h in summer). */
function amsterdamOffsetMs(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Amsterdam",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return asUtc - Math.floor(date.getTime() / 60_000) * 60_000;
}

/**
 * Until when tablemates of a Sunday can still be picked or reported from the
 * profile page: the next Sunday at 18:00 (Amsterdam). After that only the
 * people they picked stay, as their list.
 */
export function likeWindowClosesAt(startsAt: Date): Date {
  const [y, m, d] = amsterdamDay(startsAt).split("-").map(Number) as [number, number, number];
  const local = Date.UTC(y, m - 1, d + 7, 18, 0);
  // Two passes: the offset can differ between the guess and the result (clock change).
  const guess = new Date(local - amsterdamOffsetMs(new Date(local)));
  return new Date(local - amsterdamOffsetMs(guess));
}

/** From the start of the Sunday until likeWindowClosesAt. */
export function isLikeWindowOpen(startsAt: Date, now: Date): boolean {
  return now.getTime() >= startsAt.getTime() && now.getTime() < likeWindowClosesAt(startsAt).getTime();
}

export type Pick = { from: string; to: string };

const key = (email: string) => email.trim().toLowerCase();

/**
 * Who someone has a mutual like with: both picked each other (on any Sunday),
 * and neither has an open report about the other. Never shown to guests; only
 * used to count "bekende gezichten" in a mail, without names.
 */
export function mutualMatches(likes: Pick[], reports: Pick[]): Map<string, Set<string>> {
  const liked = new Set(likes.map((l) => `${key(l.from)}>${key(l.to)}`));
  const blocked = new Set(reports.flatMap((r) => [`${key(r.from)}>${key(r.to)}`, `${key(r.to)}>${key(r.from)}`]));
  const out = new Map<string, Set<string>>();
  for (const l of likes) {
    const a = key(l.from);
    const b = key(l.to);
    if (a === b || !liked.has(`${b}>${a}`) || blocked.has(`${a}>${b}`)) continue;
    if (!out.has(a)) out.set(a, new Set());
    out.get(a)!.add(b);
  }
  return out;
}

/** Days a person waits between two "bekende gezichten" mails. */
export const MATCH_MAIL_GAP_DAYS = 3;
export const MATCH_MAIL_GAP_MS = MATCH_MAIL_GAP_DAYS * DAY_MS;
