import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { NO_INDEX } from "@/components/jouw-tafel/JouwTafelPage";
import { earlyChip } from "@/lib/membership/early-label";
import { JouwTafelMemberReserve, MemberStateCta, type ReserveAccess } from "@/components/jouw-tafel/table/JouwTafelMemberReserve";
import { JouwTafelTable } from "@/components/jouw-tafel/table/JouwTafelTable";
import {
  jouwTafelReservePath,
  jouwTafelSettingsPath,
  jouwTafelSignUpPath,
  jouwTafelStartPath,
  jouwTafelTablePath,
  type Locale,
} from "@/i18n/config";
import { getMemberUser } from "@/lib/member-auth";
import { QUIZ_METADATA_KEY, sanitizeQuizState } from "@/lib/jouw-tafel/quiz-logic";
import { getTableCopy } from "@/lib/jouw-tafel/table-copy";
import { getWaitlistProof } from "@/lib/jouw-tafel/data";
import { getFunnelTable, tableNow } from "@/lib/jouw-tafel/table-data";
import { tableState } from "@/lib/jouw-tafel/table-logic";
import { getMembershipForUser, membershipSnapshot } from "@/lib/membership/data";
import {
  fromClientMembership,
  isMembersOnly,
  memberBookingDecision,
  toClientMembership,
  type ClientMembership,
} from "@/lib/membership/logic";
import type { QuizEvent } from "@/lib/jouw-tafel/logic";

export function jouwTafelTableMetadata(locale: Locale): Metadata {
  return { title: getTableCopy(locale).metaTitle, robots: NO_INDEX };
}

export function jouwTafelReserveMetadata(locale: Locale): Metadata {
  return { title: getTableCopy(locale).reserve.metaTitle, robots: NO_INDEX };
}

/** Signed in, or off to sign up. */
async function requireUser(locale: Locale) {
  const user = await getMemberUser();
  if (!user?.email) redirect(jouwTafelSignUpPath(locale));
  return { ...user, email: user.email };
}

function kiesHref(locale: Locale): string {
  return `${jouwTafelStartPath(locale)}?stap=kies`;
}

/** Their running membership, or null (also when loading it fails). */
async function loadMembership(userId: string): Promise<ClientMembership | null> {
  const row = await getMembershipForUser(userId).catch((error: unknown) => {
    console.error("[jouw-tafel table] loading membership failed", error);
    return null;
  });
  return toClientMembership(membershipSnapshot(row));
}

/** How this person books this table right now. */
async function reserveAccess(userId: string, event: QuizEvent, now: number) {
  const membership = await loadMembership(userId);
  const decision = memberBookingDecision(fromClientMembership(membership), new Date(event.startsAt), now);
  const access: ReserveAccess =
    decision.kind === "blocked"
      ? { kind: "blocked", until: decision.until.toISOString() }
      : decision.kind === "non_member"
        ? { kind: "non_member", early: isMembersOnly(event.membersOnlyUntil ?? null, now) }
        : decision;
  return { membership, access };
}

/** /jouw-tafel/tafel/{slug} (EN /en/your-table/table/{slug}). */
export async function JouwTafelTablePage({ locale, slug }: { locale: Locale; slug: string }) {
  const user = await requireUser(locale);
  const event = await getFunnelTable(slug);
  if (!event) notFound();
  const now = tableNow();
  const state = tableState(event, now);
  const { membership, access } = await reserveAccess(user.id, event, now);
  // A blocked or past-due member sees why, instead of the reserve button.
  const memberState =
    state === "open" && (access.kind === "blocked" || access.kind === "past_due") ? (
      <MemberStateCta locale={locale} access={access} settingsHref={jouwTafelSettingsPath(locale)} />
    ) : undefined;
  return (
    <JouwTafelTable
      locale={locale}
      event={event}
      state={state}
      email={user.email}
      kiesHref={kiesHref(locale)}
      reserveHref={jouwTafelReservePath(locale, slug)}
      chip={earlyChip(event, locale, membership, now) ?? undefined}
      cta={memberState}
    />
  );
}

/** /jouw-tafel/tafel/{slug}/reserveren: only while the table is open. */
export async function JouwTafelReservePage({ locale, slug }: { locale: Locale; slug: string }) {
  const user = await requireUser(locale);
  const event = await getFunnelTable(slug);
  if (!event) notFound();
  const now = tableNow();
  if (tableState(event, now) !== "open") redirect(jouwTafelTablePath(locale, slug));
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const { answers } = sanitizeQuizState(meta[QUIZ_METADATA_KEY]);
  const [{ membership, access }, proof] = await Promise.all([
    reserveAccess(user.id, event, now),
    // The real number only (no dev override): shown from SIGNUP_COUNT_MIN up.
    getWaitlistProof(null),
  ]);
  return (
    <JouwTafelMemberReserve
      locale={locale}
      event={event}
      guest={{ email: user.email, answers }}
      tableHref={jouwTafelTablePath(locale, slug)}
      settingsHref={jouwTafelSettingsPath(locale)}
      access={access}
      membership={membership}
      proofCount={proof?.count ?? null}
    />
  );
}
