// Automatic personal invites: the rules, without database or mail. Unit
// tested (npx tsx --test src/lib/invites/logic.test.ts).

const TZ = "Europe/Amsterdam";
const DAY = 24 * 60 * 60 * 1000;
const MIN = 60 * 1000;

export type InviteLocale = "nl" | "en";
export type CityPref = "all" | "less" | "none";

/** Earliest and latest minute of the day a mail may go out. */
export const SEND_WINDOW = { start: 8 * 60, end: 21 * 60 + 30 };
/** Few seats left: the mail says how many. */
export const SEATS_LEFT_SHOWN = 10;
/** Ignored invites in a row before we invite less often, and before we ask
 * whether they still want them. */
export const SLOW_AFTER = 3;
export const CHECKIN_AFTER = 5;
/** Days after an invite in which a click or booking counts for it. */
export const ENGAGE_DAYS = 7;
/** Days we wait for an answer to "still interested?" before we stop. */
export const CHECKIN_WAIT_DAYS = 14;
/** Invites go out from this many days before the Sunday. */
export const INVITE_LEAD_DAYS = 31;

/** Weekday (0 = Sunday) and minute of the day in Amsterdam. */
export function amsterdamParts(date: Date): { weekday: number; minutes: number; day: string } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return {
    weekday,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
    day: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

/** The UTC moment of a wall-clock minute on an Amsterdam date (YYYY-MM-DD). */
export function amsterdamToUtc(day: string, minutes: number): Date {
  const guess = new Date(`${day}T00:00:00Z`).getTime() + minutes * MIN;
  // Amsterdam is UTC+1 or +2: correct by the offset seen at the guess.
  const offsetAt = (t: number) => {
    const p = amsterdamParts(new Date(t));
    const wall = new Date(`${p.day}T00:00:00Z`).getTime() + p.minutes * MIN;
    return wall - t;
  };
  let t = guess - offsetAt(guess);
  t = guess - offsetAt(t);
  return new Date(t);
}

/** A small, stable shift (-7..+7 minutes) so no two mails share a minute. */
export function jitterMinutes(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return (Math.abs(h) % 15) - 7;
}

function clampToWindow(minutes: number): number {
  return Math.min(SEND_WINDOW.end, Math.max(SEND_WINDOW.start, minutes));
}

/**
 * The first moment at or after `after` on the weekday and at the time of
 * day someone signed up (Amsterdam), moved into the send window. With
 * `anyDay` the weekday does not matter (a follow-up).
 */
export function nextSlot(after: Date, signedUpAt: Date, seed: string, anyDay = false): Date {
  const signup = amsterdamParts(signedUpAt);
  const minutes = clampToWindow(clampToWindow(signup.minutes) + jitterMinutes(seed));
  const start = amsterdamParts(after).day;
  for (let i = 0; i < 15; i++) {
    const day = new Date(new Date(`${start}T12:00:00Z`).getTime() + i * DAY).toISOString().slice(0, 10);
    const candidate = amsterdamToUtc(day, minutes);
    if (candidate.getTime() < after.getTime()) continue;
    if (anyDay || amsterdamParts(candidate).weekday === signup.weekday) return candidate;
  }
  return amsterdamToUtc(start, minutes);
}

/**
 * The earliest moment the next invite may go out. One a month; two a month
 * (at least 10 days apart) for someone who follows more than two cities;
 * one every two months when slowed down (ignored invites, or "less often").
 */
export function nextAllowedAt(sentAt: Date[], followedCities: number, slowed: boolean): Date | null {
  const sorted = [...sentAt].sort((a, b) => b.getTime() - a.getTime());
  const last = sorted[0];
  if (!last) return null;
  if (slowed) return new Date(last.getTime() + 60 * DAY);
  if (followedCities > 2) {
    const second = sorted[1];
    const gap = last.getTime() + 10 * DAY;
    const month = second ? second.getTime() + 30 * DAY : 0;
    return new Date(Math.max(gap, month));
  }
  return new Date(last.getTime() + 30 * DAY);
}

export type SentInvite = { sentAt: Date; kind: "invite" | "checkin" | "nudge"; engaged: boolean };
export type Engagement = {
  /** Invites in a row (newest first) without a click or booking. */
  ignored: number;
  status: "active" | "slow" | "checkin" | "stopped";
};

/**
 * How interested someone is, from their sent invites (nudges do not count).
 * An invite counts as ignored once ENGAGE_DAYS passed without a click or a
 * booking. After CHECKIN_AFTER ignored: one "still interested?" mail; no
 * reaction within CHECKIN_WAIT_DAYS and they are stopped.
 */
export function engagement(sent: SentInvite[], now: Date, engagedSince?: Date | null): Engagement {
  const counted = sent
    .filter((s) => s.kind !== "nudge")
    .filter((s) => !engagedSince || s.sentAt.getTime() > engagedSince.getTime())
    .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
  let ignored = 0;
  let checkinSentAt: Date | null = null;
  for (const s of counted) {
    if (s.engaged) break;
    const settled = now.getTime() - s.sentAt.getTime() >= ENGAGE_DAYS * DAY;
    if (s.kind === "checkin") {
      checkinSentAt ??= s.sentAt;
      continue;
    }
    if (settled) ignored++;
  }
  if (checkinSentAt) {
    const waited = now.getTime() - checkinSentAt.getTime() >= CHECKIN_WAIT_DAYS * DAY;
    return { ignored, status: waited ? "stopped" : "checkin" };
  }
  if (ignored >= CHECKIN_AFTER) return { ignored, status: "checkin" };
  if (ignored >= SLOW_AFTER) return { ignored, status: "slow" };
  return { ignored, status: "active" };
}

/** What the mail says about seats: how many when few are left, "filling
 * fast" when more than half is sold or the last edition sold out. */
export function scarcityLine(
  input: { capacity: number; sold: number; lastSoldOut: boolean },
  locale: InviteLocale,
): string | null {
  const left = Math.max(0, input.capacity - input.sold);
  if (left <= 0) return null;
  if (left <= SEATS_LEFT_SHOWN) {
    if (locale === "en") return left === 1 ? "1 seat left" : `${left} seats left`;
    return left === 1 ? "Nog 1 plek" : `Nog ${left} plekken`;
  }
  if (input.sold > input.capacity / 2 || input.lastSoldOut) return locale === "en" ? "Filling up fast" : "Loopt snel vol";
  return null;
}

export type MailEvent = {
  city: string;
  startsAt: string;
  priceCents: number;
  scarcity: string | null;
  url: string;
};

function joinList(items: string[], locale: InviteLocale): string {
  if (items.length <= 1) return items[0] ?? "";
  const and = locale === "en" ? " and " : " en ";
  return `${items.slice(0, -1).join(", ")}${and}${items[items.length - 1]}`;
}

function capital(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "Zondag 22 november, 14:00" / "Sunday 22 November, 2pm" */
export function eventDateLabel(startsAt: string, locale: InviteLocale): string {
  const d = new Date(startsAt);
  if (locale === "en") {
    const date = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(d);
    const { minutes } = amsterdamParts(d);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const time = `${h % 12 || 12}${m ? `:${String(m).padStart(2, "0")}` : ""}${h < 12 ? "am" : "pm"}`;
    return `${date}, ${time}`;
  }
  const date = new Intl.DateTimeFormat("nl-NL", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(d);
  const time = new Intl.DateTimeFormat("nl-NL", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
  return `${capital(date)}, ${time}`;
}

function euro(cents: number): string {
  return `€${cents % 100 === 0 ? cents / 100 : (cents / 100).toFixed(2).replace(".", ",")}`;
}

function footer(cities: string[], manageUrl: string, locale: InviteLocale): string {
  return locale === "en"
    ? `You get this because you follow ${joinList(cities, locale)}. Fewer or no invites? Change your cities: ${manageUrl}`
    : `Je krijgt dit omdat je ${joinList(cities, locale)} volgt. Minder of geen uitnodigingen? Pas je steden aan: ${manageUrl}`;
}

const SIGN_OFF: Record<InviteLocale, string> = {
  nl: "Tot aan tafel,\nHet MyTable-team",
  en: "See you at the table,\nThe MyTable team",
};

/** The invite: one Sunday, or several under each other (soonest first). */
export function inviteMail(input: {
  name: string | null;
  cities: string[];
  events: MailEvent[];
  member: boolean;
  manageUrl: string;
  locale: InviteLocale;
}): { subject: string; body: string } {
  const { locale } = input;
  const en = locale === "en";
  const events = [...input.events].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const first = events[0]!;
  const month = new Intl.DateTimeFormat(en ? "en-GB" : "nl-NL", { timeZone: TZ, month: "long" }).format(new Date(first.startsAt));
  const sameMonth = events.every(
    (e) => new Intl.DateTimeFormat("en-GB", { timeZone: TZ, month: "numeric" }).format(new Date(e.startsAt)) ===
      new Intl.DateTimeFormat("en-GB", { timeZone: TZ, month: "numeric" }).format(new Date(first.startsAt)),
  );
  const subject =
    events.length === 1
      ? en
        ? `Your invitation: ${eventDateLabel(first.startsAt, locale).split(",")[0]} in ${first.city}`
        : `Je uitnodiging: ${eventDateLabel(first.startsAt, locale).split(",")[0].toLowerCase()} in ${first.city}`
      : en
        ? `Your invitation: ${events.length} Sundays${sameMonth ? ` in ${month}` : ""}`
        : `Je uitnodiging: ${events.length} zondagen${sameMonth ? ` in ${month}` : ""}`;

  const hi = input.name ? (en ? `Hi ${input.name},` : `Hoi ${input.name},`) : en ? "Hi," : "Hoi,";
  const cities = joinList(input.cities, locale);
  const intro =
    events.length === 1
      ? en
        ? `You follow ${cities}, so you hear it first: there's a table waiting for you again.`
        : `Je volgt ${cities}, dus je hoort het als eerste: er staat weer een tafel voor je klaar.`
      : en
        ? `You follow ${cities}. This is where you can reserve your seat:`
        : `Je volgt ${cities}. Hier kun je je plek reserveren:`;
  const samePrice = events.every((e) => e.priceCents === first.priceCents);
  const blocks = events.map((e) =>
    [
      `${eventDateLabel(e.startsAt, locale)}, ${e.city}`,
      ...(e.scarcity ? [e.scarcity] : []),
      ...(!samePrice ? [en ? `A seat is ${euro(e.priceCents)}` : `Een plek kost ${euro(e.priceCents)}`] : []),
      e.url,
    ].join("\n"),
  );
  const about = en
    ? `You'll sit with four to six people at a good wine bar. You'll hear which bar a week before.${samePrice ? ` A seat is ${euro(first.priceCents)}.` : ""}`
    : `Je schuift aan bij vier tot zes mensen in een goede wijnbar. Welke bar het wordt, hoor je een week van tevoren.${samePrice ? ` Een plek kost ${euro(first.priceCents)}.` : ""}`;
  const member = input.member
    ? en
      ? "As a member you hear this 48 hours before everyone else."
      : "Als lid hoor je dit 48 uur eerder dan de rest."
    : null;
  const body = [
    hi,
    "",
    intro,
    "",
    blocks.join("\n\n"),
    "",
    about,
    ...(member ? ["", member] : []),
    "",
    en ? "Questions? Just reply to this email." : "Vragen? Antwoord gewoon op deze mail.",
    "",
    SIGN_OFF[locale],
    "",
    footer(input.cities, input.manageUrl, locale),
  ].join("\n");
  return { subject, body };
}

/** One follow-up for someone who clicked an invite but did not book. */
export function nudgeMail(input: {
  name: string | null;
  cities: string[];
  event: MailEvent;
  manageUrl: string;
  locale: InviteLocale;
}): { subject: string; body: string } {
  const { locale, event } = input;
  const en = locale === "en";
  const day = eventDateLabel(event.startsAt, locale).split(",")[0];
  const subject = en ? `Still room on ${day}` : `Nog plek op ${day.toLowerCase()}`;
  const hi = input.name ? (en ? `Hi ${input.name},` : `Hoi ${input.name},`) : en ? "Hi," : "Hoi,";
  const body = [
    hi,
    "",
    en
      ? `You had a look at ${day} in ${event.city}. ${event.scarcity ? `${event.scarcity}.` : "There is still room."}`
      : `Je keek naar ${day.toLowerCase()} in ${event.city}. ${event.scarcity ? `${event.scarcity}.` : "Er is nog plek."}`,
    "",
    `${en ? "Reserve your seat" : "Reserveer je plek"}: ${event.url}`,
    "",
    SIGN_OFF[locale],
    "",
    footer(input.cities, input.manageUrl, locale),
  ].join("\n");
  return { subject, body };
}

/** After CHECKIN_AFTER ignored invites: do they still want them? */
export function checkinMail(input: {
  name: string | null;
  cities: string[];
  stayUrl: string;
  manageUrl: string;
  locale: InviteLocale;
}): { subject: string; body: string } {
  const en = input.locale === "en";
  const hi = input.name ? (en ? `Hi ${input.name},` : `Hoi ${input.name},`) : en ? "Hi," : "Hoi,";
  const cities = joinList(input.cities, input.locale);
  const body = [
    hi,
    "",
    en
      ? `Now and then we send you an invite for a Sunday afternoon with wine in ${cities}. You haven't done much with them lately, and we don't want to bother you.`
      : `We sturen je af en toe een uitnodiging voor een zondagmiddag met wijn in ${cities}. Je deed er een tijdje niets mee, en we willen je niet lastigvallen.`,
    "",
    `${en ? "Want to keep getting them? Click here" : "Wil je ze blijven krijgen? Klik dan hier"}: ${input.stayUrl}`,
    "",
    en
      ? `If we don't hear from you, we'll stop. You can always turn your cities back on: ${input.manageUrl}`
      : `Horen we niets, dan stoppen we met uitnodigen. Je kunt je steden altijd weer aanzetten: ${input.manageUrl}`,
    "",
    SIGN_OFF[input.locale],
  ].join("\n");
  return { subject: en ? "Do you still want our invites?" : "Wil je nog uitnodigingen van ons?", body };
}

/** Today's maximum: starts at `start` and grows by `growthPerWeek`. */
export function dailyCap(settings: { startedAt: string | null; capStart: number; capGrowthPerWeek: number }, now: Date): number {
  if (!settings.startedAt) return settings.capStart;
  const weeks = Math.max(0, Math.floor((now.getTime() - Date.parse(settings.startedAt)) / (7 * DAY)));
  return settings.capStart + weeks * settings.capGrowthPerWeek;
}

/**
 * False only when we know someone is outside a Sunday's age group (from a
 * birth date, else the waitlist age range). Unknown age: always invited.
 */
export function fitsBracket(
  bracket: "20-39" | "35+" | null,
  person: { ageRange: string | null; birthDate: Date | null },
  eventStartsAt: string,
): boolean {
  if (!bracket) return true;
  if (person.birthDate) {
    const at = new Date(eventStartsAt);
    let age = at.getUTCFullYear() - person.birthDate.getUTCFullYear();
    const m = at.getUTCMonth() - person.birthDate.getUTCMonth();
    if (m < 0 || (m === 0 && at.getUTCDate() < person.birthDate.getUTCDate())) age--;
    return bracket === "20-39" ? age >= 20 && age <= 39 : age >= 35;
  }
  if (bracket === "20-39") return person.ageRange !== "45_plus";
  return person.ageRange !== "18_24" && person.ageRange !== "25_34";
}
