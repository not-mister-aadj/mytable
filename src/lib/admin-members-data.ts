import { desc, eq, or, sql } from "drizzle-orm";
import type { User } from "@supabase/supabase-js";
import {
  clubMemberships,
  sundayTableSignups,
  type ClubPlanId,
} from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { CLUB_PLAN_PRICING, isClubPlanId } from "@/lib/club/plan-pricing";
import {
  readOnboardingFromMetadata,
  type OnboardingGenderId,
  type OnboardingIntentId,
  type OnboardingPersonalityId,
  type OnboardingTableTypeId,
} from "@/lib/member-onboarding";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AdminMemberSubscriptionStatus =
  | "none"
  | "pending"
  | "active"
  | "past_due"
  | "canceled";

export type AdminMemberListRow = {
  id: string;
  shortId: string;
  email: string;
  name: string;
  gender: OnboardingGenderId | null;
  genderLabel: string;
  age: number | null;
  birthDate: string | null;
  cities: string[];
  citiesLabel: string;
  joinIntent: OnboardingIntentId | null;
  joinIntentLabel: string;
  tableType: OnboardingTableTypeId | null;
  tableTypeLabel: string;
  personality: OnboardingPersonalityId | null;
  personalityLabel: string;
  languages: string[];
  languagesLabel: string;
  onboardingCompleted: boolean;
  subscriptionStatus: AdminMemberSubscriptionStatus;
  subscriptionStatusLabel: string;
  planId: ClubPlanId | null;
  planLabel: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  interests: string[];
  interestsLabel: string;
  communityInterest: boolean;
  joinedAt: string;
  lastSignInAt: string | null;
};

export type AdminMembersKpi = {
  totalMembers: number;
  withSubscription: number;
  activeSubscriptions: number;
  noSubscription: number;
  onboardingCompleted: number;
};

export type AdminMembersPageData = {
  members: AdminMemberListRow[];
  kpis: AdminMembersKpi;
};

const MEMBERSHIP_RANK: Record<string, number> = {
  active: 4,
  past_due: 3,
  pending: 2,
  canceled: 1,
};

/** Stripe Checkout sessions expire after 24h; pending past that is abandoned. */
export const PENDING_CLUB_MEMBERSHIP_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Pending is only a short-lived checkout state, not a subscription.
 * CRM never treats it as "met abonnement"; after the Stripe session TTL
 * it is abandoned (none). Canceled rows that never paid also count as none.
 */
export function resolveAdminSubscriptionStatus(
  raw: string | null | undefined,
  _createdAt?: Date | null,
  paidEvidence?: {
    stripeSubscriptionId?: string | null;
    currentPeriodEnd?: Date | null;
  },
): AdminMemberSubscriptionStatus {
  if (raw === "active" || raw === "past_due") {
    return raw;
  }
  if (raw === "pending") {
    // Not a subscription — hide as none. Fresh checkouts stay pending in DB
    // until paid or abandoned after PENDING_CLUB_MEMBERSHIP_TTL_MS.
    return "none";
  }
  if (raw === "canceled") {
    const hadSubscription = Boolean(
      paidEvidence?.stripeSubscriptionId || paidEvidence?.currentPeriodEnd,
    );
    return hadSubscription ? "canceled" : "none";
  }
  return "none";
}

function hasCountedSubscription(
  status: AdminMemberSubscriptionStatus,
): boolean {
  return status === "active" || status === "past_due";
}

function ageFromBirthDate(iso: string | null): number | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const birth = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const month = today.getUTCMonth() - birth.getUTCMonth();
  if (
    month < 0 ||
    (month === 0 && today.getUTCDate() < birth.getUTCDate())
  ) {
    age -= 1;
  }
  return age >= 0 && age < 130 ? age : null;
}

function genderLabel(gender: OnboardingGenderId | null): string {
  switch (gender) {
    case "woman":
      return "Vrouw";
    case "man":
      return "Man";
    case "non_binary":
      return "Non-binair";
    case "prefer_not":
      return "Liever niet";
    default:
      return "—";
  }
}

function joinIntentLabel(intent: OnboardingIntentId | null): string {
  switch (intent) {
    case "meet_new":
      return "Nieuwe mensen";
    case "with_group":
      return "Culinaire agenda";
    case "both":
      return "Beide";
    default:
      return "—";
  }
}

function tableTypeLabel(tableType: OnboardingTableTypeId | null): string {
  switch (tableType) {
    case "girls_only":
      return "Girls only";
    case "mixed":
      return "Gemengd";
    case "no_preference":
      return "Geen voorkeur";
    default:
      return "—";
  }
}

function personalityLabel(
  personality: OnboardingPersonalityId | null,
): string {
  switch (personality) {
    case "introverted":
      return "Introvert";
    case "ambivert":
      return "Ambivert";
    case "extroverted":
      return "Extrovert";
    default:
      return "—";
  }
}

function planLabel(planId: ClubPlanId | null): string {
  if (!planId) return "—";
  return CLUB_PLAN_PRICING[planId].nameNl.replace("MyTable Club · ", "");
}

function subscriptionStatusLabel(
  status: AdminMemberSubscriptionStatus,
  planId: ClubPlanId | null,
): string {
  if (status === "none") return "Geen abonnement";
  const plan = planLabel(planId);
  const statusPart =
    status === "active"
      ? "Active"
      : status === "pending"
        ? "Pending"
        : status === "past_due"
          ? "Past due"
          : "Geannuleerd";
  return plan !== "—" ? `${statusPart} · ${plan}` : statusPart;
}

type MembershipRow = {
  id: string;
  email: string;
  userId: string | null;
  planId: string;
  status: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  stripeSubscriptionId?: string | null;
};

function pickBestMembership(
  rows: MembershipRow[],
): MembershipRow | null {
  if (rows.length === 0) return null;
  const unique = [...new Map(rows.map((row) => [row.id, row])).values()];
  return unique.sort((a, b) => {
    const aStatus = resolveAdminSubscriptionStatus(a.status, a.createdAt, a);
    const bStatus = resolveAdminSubscriptionStatus(b.status, b.createdAt, b);
    const rankDiff =
      (MEMBERSHIP_RANK[bStatus] ?? 0) - (MEMBERSHIP_RANK[aStatus] ?? 0);
    if (rankDiff !== 0) return rankDiff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  })[0]!;
}

async function listAllAuthUsers(): Promise<User[]> {
  const admin = createSupabaseAdminClient();
  const users: User[] = [];
  const perPage = 200;
  let page = 1;

  while (page <= 50) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < perPage) break;
    page += 1;
  }

  return users;
}

function mapMemberRow(
  user: User,
  membership: MembershipRow | null,
): AdminMemberListRow {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const { completed, prefs } = readOnboardingFromMetadata(meta);
  const name =
    prefs.name.trim() ||
    (typeof meta.full_name === "string" ? meta.full_name.trim() : "") ||
    (typeof meta.name === "string" ? meta.name.trim() : "") ||
    membership?.email?.split("@")[0] ||
    "—";

  const planId =
    membership && isClubPlanId(membership.planId) ? membership.planId : null;
  const subscriptionStatus = resolveAdminSubscriptionStatus(
    membership?.status ?? null,
    membership?.createdAt ?? null,
    membership
      ? {
          stripeSubscriptionId: membership.stripeSubscriptionId,
          currentPeriodEnd: membership.currentPeriodEnd,
        }
      : undefined,
  );
  const visiblePlanId = subscriptionStatus === "none" ? null : planId;

  return {
    id: user.id,
    shortId: user.id.slice(0, 8),
    email: user.email ?? membership?.email ?? "—",
    name,
    gender: prefs.gender,
    genderLabel: genderLabel(prefs.gender),
    age: ageFromBirthDate(prefs.birthDate),
    birthDate: prefs.birthDate,
    cities: prefs.cities,
    citiesLabel: prefs.cities.length > 0 ? prefs.cities.join(" · ") : "—",
    joinIntent: prefs.joinIntent,
    joinIntentLabel: joinIntentLabel(prefs.joinIntent),
    tableType: prefs.tableType,
    tableTypeLabel: tableTypeLabel(prefs.tableType),
    personality: prefs.personality,
    personalityLabel: personalityLabel(prefs.personality),
    languages: prefs.languages,
    languagesLabel:
      prefs.languages.length > 0
        ? prefs.languages.map((l) => l.toUpperCase()).join(" · ")
        : "—",
    onboardingCompleted: completed,
    subscriptionStatus,
    subscriptionStatusLabel: subscriptionStatusLabel(
      subscriptionStatus,
      visiblePlanId,
    ),
    planId: visiblePlanId,
    planLabel: planLabel(visiblePlanId),
    currentPeriodEnd: membership?.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: membership?.cancelAtPeriodEnd ?? false,
    interests: prefs.interests,
    interestsLabel:
      prefs.interests.length > 0 ? prefs.interests.join(" · ") : "—",
    communityInterest: prefs.communityInterest,
    joinedAt: user.created_at,
    lastSignInAt: user.last_sign_in_at ?? null,
  };
}

export async function getAdminMembersPageData(): Promise<AdminMembersPageData> {
  if (!isDbConfigured()) {
    return {
      members: [],
      kpis: {
        totalMembers: 0,
        withSubscription: 0,
        activeSubscriptions: 0,
        noSubscription: 0,
        onboardingCompleted: 0,
      },
    };
  }

  const { expireStalePendingClubMemberships } = await import(
    "@/lib/club/memberships"
  );
  try {
    await expireStalePendingClubMemberships(PENDING_CLUB_MEMBERSHIP_TTL_MS);
  } catch (err) {
    console.error("[admin-members] expire stale pending", err);
  }

  const [users, membershipRows] = await Promise.all([
    listAllAuthUsers(),
    getDb()
      .select({
        id: clubMemberships.id,
        email: clubMemberships.email,
        userId: clubMemberships.userId,
        planId: clubMemberships.planId,
        status: clubMemberships.status,
        currentPeriodEnd: clubMemberships.currentPeriodEnd,
        cancelAtPeriodEnd: clubMemberships.cancelAtPeriodEnd,
        stripeSubscriptionId: clubMemberships.stripeSubscriptionId,
        createdAt: clubMemberships.createdAt,
      })
      .from(clubMemberships)
      .orderBy(desc(clubMemberships.createdAt)),
  ]);

  const byUserId = new Map<string, MembershipRow[]>();
  const byEmail = new Map<string, MembershipRow[]>();

  for (const row of membershipRows) {
    const typed: MembershipRow = {
      id: row.id,
      email: row.email,
      userId: row.userId,
      planId: row.planId,
      status: row.status,
      currentPeriodEnd: row.currentPeriodEnd,
      cancelAtPeriodEnd: row.cancelAtPeriodEnd,
      createdAt: row.createdAt,
      stripeSubscriptionId: row.stripeSubscriptionId,
    };
    if (typed.userId) {
      const list = byUserId.get(typed.userId) ?? [];
      list.push(typed);
      byUserId.set(typed.userId, list);
    }
    const emailKey = typed.email.trim().toLowerCase();
    if (emailKey) {
      const list = byEmail.get(emailKey) ?? [];
      list.push(typed);
      byEmail.set(emailKey, list);
    }
  }

  const members = users
    .map((user) => {
      const emailKey = user.email?.trim().toLowerCase() ?? "";
      const membership = pickBestMembership([
        ...(byUserId.get(user.id) ?? []),
        ...(emailKey ? (byEmail.get(emailKey) ?? []) : []),
      ]);
      return mapMemberRow(user, membership);
    })
    .sort(
      (a, b) =>
        new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime(),
    );

  const withSubscription = members.filter((m) =>
    hasCountedSubscription(m.subscriptionStatus),
  ).length;
  const activeSubscriptions = members.filter(
    (m) => m.subscriptionStatus === "active",
  ).length;
  const onboardingCompleted = members.filter(
    (m) => m.onboardingCompleted,
  ).length;

  return {
    members,
    kpis: {
      totalMembers: members.length,
      withSubscription,
      activeSubscriptions,
      noSubscription: members.length - withSubscription,
      onboardingCompleted,
    },
  };
}

export type AdminMemberMembershipHistoryRow = {
  id: string;
  planId: ClubPlanId | null;
  planLabel: string;
  status: AdminMemberSubscriptionStatus;
  statusLabel: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string | null;
  createdAt: string;
};

export type AdminMemberSundayTableRow = {
  id: string;
  city: string;
  tableDate: string;
  tableType: string;
  tableTypeLabel: string;
  status: string;
  plusOne: boolean;
  createdAt: string;
};

export type AdminMemberDetail = {
  member: AdminMemberListRow;
  memberships: AdminMemberMembershipHistoryRow[];
  sundayTables: AdminMemberSundayTableRow[];
};

function normalizeSubscriptionStatus(
  raw: string | null | undefined,
  createdAt?: Date | null,
  paidEvidence?: {
    stripeSubscriptionId?: string | null;
    currentPeriodEnd?: Date | null;
  },
): AdminMemberSubscriptionStatus {
  return resolveAdminSubscriptionStatus(raw, createdAt, paidEvidence);
}

export async function getAdminMemberDetail(
  userId: string,
): Promise<AdminMemberDetail | null> {
  if (!isDbConfigured()) return null;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user) return null;

  const user = data.user;
  const emailKey = user.email?.trim().toLowerCase() ?? "";
  const db = getDb();

  const [membershipRows, signupRows] = await Promise.all([
    db
      .select({
        id: clubMemberships.id,
        email: clubMemberships.email,
        userId: clubMemberships.userId,
        planId: clubMemberships.planId,
        status: clubMemberships.status,
        currentPeriodEnd: clubMemberships.currentPeriodEnd,
        cancelAtPeriodEnd: clubMemberships.cancelAtPeriodEnd,
        stripeSubscriptionId: clubMemberships.stripeSubscriptionId,
        createdAt: clubMemberships.createdAt,
      })
      .from(clubMemberships)
      .where(
        emailKey
          ? or(
              eq(clubMemberships.userId, userId),
              sql`lower(${clubMemberships.email}) = ${emailKey}`,
            )
          : eq(clubMemberships.userId, userId),
      )
      .orderBy(desc(clubMemberships.createdAt)),
    emailKey
      ? db
          .select({
            id: sundayTableSignups.id,
            city: sundayTableSignups.city,
            tableDate: sundayTableSignups.tableDate,
            tableType: sundayTableSignups.tableType,
            status: sundayTableSignups.status,
            plusOne: sundayTableSignups.plusOne,
            createdAt: sundayTableSignups.createdAt,
          })
          .from(sundayTableSignups)
          .where(
            or(
              eq(sundayTableSignups.userId, userId),
              sql`lower(${sundayTableSignups.email}) = ${emailKey}`,
            ),
          )
          .orderBy(desc(sundayTableSignups.createdAt))
      : db
          .select({
            id: sundayTableSignups.id,
            city: sundayTableSignups.city,
            tableDate: sundayTableSignups.tableDate,
            tableType: sundayTableSignups.tableType,
            status: sundayTableSignups.status,
            plusOne: sundayTableSignups.plusOne,
            createdAt: sundayTableSignups.createdAt,
          })
          .from(sundayTableSignups)
          .where(eq(sundayTableSignups.userId, userId))
          .orderBy(desc(sundayTableSignups.createdAt)),
  ]);

  const typedMemberships: MembershipRow[] = membershipRows.map((row) => ({
    id: row.id,
    email: row.email,
    userId: row.userId,
    planId: row.planId,
    status: row.status,
    currentPeriodEnd: row.currentPeriodEnd,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    createdAt: row.createdAt,
    stripeSubscriptionId: row.stripeSubscriptionId,
  }));

  const member = mapMemberRow(user, pickBestMembership(typedMemberships));

  const memberships: AdminMemberMembershipHistoryRow[] = membershipRows.map(
    (row) => {
      const planId = isClubPlanId(row.planId) ? row.planId : null;
      const status = normalizeSubscriptionStatus(row.status, row.createdAt, {
        stripeSubscriptionId: row.stripeSubscriptionId,
        currentPeriodEnd: row.currentPeriodEnd,
      });
      const visiblePlanId = status === "none" ? null : planId;
      return {
        id: row.id,
        planId: visiblePlanId,
        planLabel: planLabel(visiblePlanId),
        status,
        statusLabel: subscriptionStatusLabel(status, visiblePlanId),
        currentPeriodEnd: row.currentPeriodEnd?.toISOString() ?? null,
        cancelAtPeriodEnd: row.cancelAtPeriodEnd,
        stripeSubscriptionId: row.stripeSubscriptionId,
        createdAt: row.createdAt.toISOString(),
      };
    },
  );

  const sundayTables: AdminMemberSundayTableRow[] = signupRows.map((row) => ({
    id: row.id,
    city: row.city,
    tableDate: row.tableDate,
    tableType: row.tableType,
    tableTypeLabel: tableTypeLabel(
      row.tableType === "girls_only" ||
        row.tableType === "mixed" ||
        row.tableType === "no_preference"
        ? row.tableType
        : null,
    ),
    status: row.status,
    plusOne: row.plusOne,
    createdAt: row.createdAt.toISOString(),
  }));

  return { member, memberships, sundayTables };
}

export function membersRowsToExcelCsv(rows: AdminMemberListRow[]): string {
  const header = [
    "ID",
    "Naam",
    "E-mail",
    "Status",
    "Plan",
    "Gender",
    "Leeftijd",
    "Geboortedatum",
    "Steden",
    "Intent",
    "Tafel",
    "Personality",
    "Talen",
    "Interesses",
    "Community",
    "Onboarding",
    "Joined",
    "Laatste login",
    "Periode tot",
    "Zegt op",
  ];
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const formatNl = (iso: string | null) => {
    if (!iso) return "";
    return new Intl.DateTimeFormat("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  };

  const lines = [
    header.map(escape).join(";"),
    ...rows.map((row) =>
      [
        row.id,
        row.name,
        row.email,
        row.subscriptionStatusLabel,
        row.planLabel === "—" ? "" : row.planLabel,
        row.genderLabel === "—" ? "" : row.genderLabel,
        row.age != null ? String(row.age) : "",
        row.birthDate ?? "",
        row.cities.join(", "),
        row.joinIntentLabel === "—" ? "" : row.joinIntentLabel,
        row.tableTypeLabel === "—" ? "" : row.tableTypeLabel,
        row.personalityLabel === "—" ? "" : row.personalityLabel,
        row.languages.map((l) => l.toUpperCase()).join(", "),
        row.interests.join(", "),
        row.communityInterest ? "ja" : "nee",
        row.onboardingCompleted ? "klaar" : "open",
        formatNl(row.joinedAt),
        formatNl(row.lastSignInAt),
        formatNl(row.currentPeriodEnd),
        row.cancelAtPeriodEnd ? "ja" : "nee",
      ]
        .map((value) => escape(value))
        .join(";"),
    ),
  ];

  return `\uFEFF${lines.join("\r\n")}`;
}
