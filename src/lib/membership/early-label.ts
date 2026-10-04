// "Te boeken vanaf ..." for a non-member during the members' 48 hours: only
// what applies to the person looking, never what members can do.
// Pure and usable on the server and the client.

import type { QuizEvent } from "@/lib/jouw-tafel/logic";
import { fromClientMembership, isMembersOnly, memberBookingDecision, type ClientMembership } from "@/lib/membership/logic";
import { getMembershipKiesCopy } from "@/lib/membership/page-copy";

type Locale = "nl" | "en";
const AMSTERDAM = "Europe/Amsterdam";

/** "do 8 okt 14:00" (mid-sentence) / "Thu 8 Oct 2:00 PM". */
export function openFrom(iso: string, locale: Locale): string {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", {
    timeZone: AMSTERDAM,
    weekday: "short",
    day: "numeric",
    month: "short",
  })
    .formatToParts(d)
    .reduce<Record<string, string>>((acc, p) => ({ ...acc, [p.type]: p.value.replace(/\.$/, "") }), {});
  const weekday = parts.weekday ?? "";
  const date = `${locale === "en" ? weekday.charAt(0).toLocaleUpperCase() + weekday.slice(1) : weekday.toLocaleLowerCase("nl-NL")} ${parts.day ?? ""} ${parts.month ?? ""}`;
  const time = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "nl-NL", {
    timeZone: AMSTERDAM,
    hour: locale === "en" ? "numeric" : "2-digit",
    minute: "2-digit",
  }).format(d);
  return `${date} ${time}`;
}

/** "di 6 okt" / "Tue 6 Oct": the day only, for a short chip. */
export function openFromDay(iso: string, locale: Locale): string {
  return openFrom(iso, locale).split(" ").slice(0, 3).join(" ");
}

/** Members-only right now, and this person cannot book it yet. */
export function earlyBlocked(event: QuizEvent, membership: ClientMembership | null, now: number): boolean {
  if (event.comingSoon || !isMembersOnly(event.membersOnlyUntil ?? null, now)) return false;
  return memberBookingDecision(fromClientMembership(membership), new Date(event.startsAt), now).kind !== "included";
}

/** The early-access chip, or null outside the members' 48 hours. */
export function earlyChip(
  event: QuizEvent,
  locale: Locale,
  membership: ClientMembership | null,
  now: number,
): { text: string; tone: "gold" } | null {
  if (!earlyBlocked(event, membership, now) || !event.membersOnlyUntil) return null;
  return { text: getMembershipKiesCopy(locale).earlyLabel(openFromDay(event.membersOnlyUntil, locale)), tone: "gold" };
}
