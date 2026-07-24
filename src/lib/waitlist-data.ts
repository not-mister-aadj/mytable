import { and, desc, eq } from "drizzle-orm";
import { waitlistSignups } from "@/db/schema";
import { getDb } from "@/db/index";
import type { WaitlistPreferences } from "@/i18n/waitlist-page.types";
import {
  formatWaitlistPreferenceLabels,
  joinPreferenceLabels,
} from "@/lib/waitlist-preference-labels";

export type WaitlistSignupRow = {
  id: string;
  email: string;
  city: string;
  locale: string;
  source: string;
  name: string | null;
  preferences: WaitlistPreferences | null;
  createdAt: string;
};

function asPreferences(
  value: Record<string, unknown> | null | undefined,
): WaitlistPreferences | null {
  if (!value || typeof value !== "object") return null;
  const interests = Array.isArray(value.interests)
    ? value.interests.filter((item): item is string => typeof item === "string")
    : [];
  const why = Array.isArray(value.why)
    ? value.why.filter((item): item is string => typeof item === "string")
    : [];
  const company = Array.isArray(value.company)
    ? value.company.filter((item): item is string => typeof item === "string")
    : [];
  const tableType = Array.isArray(value.tableType)
    ? value.tableType.filter((item): item is string => typeof item === "string")
    : [];
  const cities = Array.isArray(value.cities)
    ? value.cities.filter((item): item is string => typeof item === "string")
    : [];
  return {
    interests: interests as WaitlistPreferences["interests"],
    why: why as WaitlistPreferences["why"],
    company: company as WaitlistPreferences["company"],
    tableType: tableType as WaitlistPreferences["tableType"],
    cities,
    regionFlexible: Boolean(value.regionFlexible),
  };
}

export async function getWaitlistSignups(): Promise<WaitlistSignupRow[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(waitlistSignups)
    .where(eq(waitlistSignups.source, "waitlist"))
    .orderBy(desc(waitlistSignups.createdAt));

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    city: row.city,
    locale: row.locale,
    source: row.source,
    name: row.name,
    preferences: asPreferences(row.preferences),
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function createWaitlistSignup(input: {
  email: string;
  city: string;
  locale: string;
  name?: string;
  source?: "waitlist" | "priority_list";
  preferences?: WaitlistPreferences | null;
}): Promise<
  { ok: true; id: string; created: boolean } | { ok: false; error: string }
> {
  const email = input.email.trim().toLowerCase();
  const city = input.city.trim();
  const name = input.name?.trim() || null;
  const source = input.source ?? "waitlist";
  const preferences = input.preferences ?? null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Invalid email" };
  }
  if (!city) {
    return { ok: false, error: "City required" };
  }

  const db = getDb();
  const locale = input.locale === "en" ? "en" : "nl";

  try {
    const [inserted] = await db
      .insert(waitlistSignups)
      .values({
        email,
        city,
        locale,
        name,
        source,
        preferences: preferences ?? undefined,
      })
      .onConflictDoNothing({
        target: [waitlistSignups.email, waitlistSignups.city],
      })
      .returning({ id: waitlistSignups.id });

    if (inserted) {
      return { ok: true, id: inserted.id, created: true };
    }

    const [existing] = await db
      .select({ id: waitlistSignups.id })
      .from(waitlistSignups)
      .where(
        and(
          eq(waitlistSignups.email, email),
          eq(waitlistSignups.city, city),
        ),
      )
      .limit(1);

    if (!existing) {
      return { ok: false, error: "Could not save signup" };
    }

    if (preferences || name) {
      await db
        .update(waitlistSignups)
        .set({
          ...(name ? { name } : {}),
          ...(preferences ? { preferences } : {}),
          ...(source ? { source } : {}),
        })
        .where(eq(waitlistSignups.id, existing.id));
    }

    return { ok: true, id: existing.id, created: false };
  } catch (error) {
    console.error("[waitlist] createWaitlistSignup failed:", error);
    const message = error instanceof Error ? error.message : String(error);
    if (
      /ENOTFOUND|ECONNREFUSED|connect_timeout|Tenant or user not found|XX000/i.test(
        message,
      )
    ) {
      return { ok: false, error: "database_unavailable" };
    }
    return { ok: false, error: "Could not save signup" };
  }
}

export function waitlistRowsToExcelCsv(rows: WaitlistSignupRow[]): string {
  const header = [
    "Naam",
    "E-mail",
    "Stad (primair)",
    "Steden",
    "Taal",
    "Ervaringen",
    "Waarom",
    "Hoe komen",
    "Type tafel",
    "Flexibel regio",
    "Aangemeld op",
  ];
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const lines = [
    header.map(escape).join(";"),
    ...rows.map((row) => {
      const labels = formatWaitlistPreferenceLabels(row.preferences);
      return [
        row.name ?? "",
        row.email,
        row.city,
        joinPreferenceLabels(
          labels.cities.length > 0 ? labels.cities : [row.city],
        ),
        row.locale.toUpperCase(),
        joinPreferenceLabels(labels.interests),
        joinPreferenceLabels(labels.why),
        joinPreferenceLabels(labels.company),
        joinPreferenceLabels(labels.tableType),
        labels.regionFlexible ? "ja" : "nee",
        new Intl.DateTimeFormat("nl-NL", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(row.createdAt)),
      ]
        .map(escape)
        .join(";");
    }),
  ];

  return `\uFEFF${lines.join("\r\n")}`;
}
