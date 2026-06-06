import { desc } from "drizzle-orm";
import { waitlistSignups } from "@/db/schema";
import { getDb } from "@/db/index";

export type WaitlistSignupRow = {
  id: string;
  email: string;
  city: string;
  locale: string;
  createdAt: string;
};

export async function getWaitlistSignups(): Promise<WaitlistSignupRow[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(waitlistSignups)
    .orderBy(desc(waitlistSignups.createdAt));

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    city: row.city,
    locale: row.locale,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function createWaitlistSignup(input: {
  email: string;
  city: string;
  locale: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  const city = input.city.trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Invalid email" };
  }
  if (!city) {
    return { ok: false, error: "City required" };
  }

  const db = getDb();

  try {
    await db
      .insert(waitlistSignups)
      .values({
        email,
        city,
        locale: input.locale === "en" ? "en" : "nl",
      })
      .onConflictDoNothing({
        target: [waitlistSignups.email, waitlistSignups.city],
      });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save signup" };
  }
}

export function waitlistRowsToExcelCsv(rows: WaitlistSignupRow[]): string {
  const header = ["E-mail", "Stad", "Taal", "Aangemeld op"];
  const escape = (value: string) =>
    `"${value.replace(/"/g, '""')}"`;

  const lines = [
    header.map(escape).join(";"),
    ...rows.map((row) =>
      [
        row.email,
        row.city,
        row.locale.toUpperCase(),
        new Intl.DateTimeFormat("nl-NL", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(row.createdAt)),
      ]
        .map(escape)
        .join(";"),
    ),
  ];

  return `\uFEFF${lines.join("\r\n")}`;
}
