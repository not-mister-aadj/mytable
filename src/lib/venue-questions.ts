import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { bookings } from "@/db/schema";
import { normalizeEmail } from "@/lib/customers/normalize";
import { DIETARY_OPTIONS, QUIZ_METADATA_KEY, dietaryNotes, type DietaryAnswer } from "@/lib/jouw-tafel/quiz-logic";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Questions a venue asks our guests before a Sunday, answered with a tap in
 * a mail and on /aan-tafel/{token}/vragen: a diet (always) and, where the
 * venue has live music, whether they'd like to stay for it. Stored on the
 * booking; the diet also in dietary_notes and the account's quiz answers.
 */

export const LIVE_MUSIC_ANSWERS = ["yes", "maybe", "no"] as const;
export type LiveMusicAnswer = (typeof LIVE_MUSIC_ANSWERS)[number];

export type VenueAnswers = {
  /** "none" = no wishes; "some" = they fill them in. */
  diet?: "none" | "some";
  dietary?: DietaryAnswer[];
  dietaryOther?: string;
  liveMusic?: LiveMusicAnswer;
  answeredAt?: string;
};

/** Sundays whose venue asks about live music, and from when it plays. */
export const LIVE_MUSIC: Record<string, { from: string }> = {
  // JAZZ Coffee & Wines, Den Haag: live jazz from 16:00 (mails with Sanne, Nov 2026).
  "56d75490-a359-4334-a9d6-9d355e44e4ea": { from: "16:00" },
};

export function parseVenueAnswers(raw: unknown): VenueAnswers {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  const out: VenueAnswers = {};
  if (r.diet === "none" || r.diet === "some") out.diet = r.diet;
  if (Array.isArray(r.dietary)) out.dietary = r.dietary.filter((d): d is DietaryAnswer => (DIETARY_OPTIONS as readonly string[]).includes(d as string) && d !== "none");
  if (typeof r.dietaryOther === "string") out.dietaryOther = r.dietaryOther.slice(0, 300);
  if (LIVE_MUSIC_ANSWERS.includes(r.liveMusic as LiveMusicAnswer)) out.liveMusic = r.liveMusic as LiveMusicAnswer;
  if (typeof r.answeredAt === "string") out.answeredAt = r.answeredAt;
  return out;
}

/** Merges a patch into the booking's answers; a diet also into dietary_notes and the account. */
export async function saveVenueAnswers(bookingId: string, patch: VenueAnswers): Promise<VenueAnswers | null> {
  const db = getDb();
  const [row] = await db.select({ email: bookings.email, answers: bookings.venueAnswers }).from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!row) return null;
  const clean = parseVenueAnswers(patch);
  const next: VenueAnswers = { ...parseVenueAnswers(row.answers), ...clean, answeredAt: new Date().toISOString() };
  if (next.diet === "none") {
    next.dietary = [];
    next.dietaryOther = "";
  }
  const dietTouched = "diet" in clean || "dietary" in clean || "dietaryOther" in clean;
  // A note in the text field counts even when "Iets anders" was not ticked.
  const list: DietaryAnswer[] = [...(next.dietary ?? [])];
  if (next.dietaryOther?.trim() && !list.includes("other")) list.push("other");
  const notes = dietaryNotes({ dietary: list, dietaryOther: next.dietaryOther ?? "" });
  await db
    .update(bookings)
    .set({ venueAnswers: next, ...(dietTouched ? { dietaryNotes: notes || null } : {}) })
    .where(eq(bookings.id, bookingId));
  if (dietTouched && (next.diet === "none" || (next.dietary?.length ?? 0) > 0 || next.dietaryOther)) {
    await syncDiet(row.email, next).catch(() => undefined);
  }
  return next;
}

/** The diet into the account's quiz answers, so a next booking knows it. */
async function syncDiet(email: string, a: VenueAnswers): Promise<void> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const [user] = (await getDb().execute(sql`
    select id, raw_user_meta_data as meta from auth.users where lower(email) = ${normalizeEmail(email)} limit 1
  `)) as unknown as Array<{ id: string; meta: Record<string, unknown> | null }>;
  if (!user) return;
  const meta = user.meta ?? {};
  const quiz = (meta[QUIZ_METADATA_KEY] ?? {}) as { answers?: Record<string, unknown> } & Record<string, unknown>;
  const answers = { ...(quiz.answers ?? {}) };
  answers.dietary = a.diet === "none" ? ["none"] : (a.dietary ?? []).length > 0 ? a.dietary : a.dietaryOther ? ["other"] : ["none"];
  if (a.dietaryOther) answers.dietaryOther = a.dietaryOther;
  await createSupabaseAdminClient().auth.admin.updateUserById(user.id, { user_metadata: { ...meta, [QUIZ_METADATA_KEY]: { ...quiz, answers } } });
}

/** For admin: per Sunday, who answered what. */
export type VenueAnswersSummary = {
  total: number;
  answered: number;
  diets: { name: string; notes: string }[];
  liveMusic: Record<LiveMusicAnswer, string[]>;
};

export function summarizeVenueAnswers(rows: { name: string; answers: unknown; dietaryNotes: string | null }[]): VenueAnswersSummary {
  const out: VenueAnswersSummary = { total: rows.length, answered: 0, diets: [], liveMusic: { yes: [], maybe: [], no: [] } };
  for (const r of rows) {
    const a = parseVenueAnswers(r.answers);
    if (a.diet || a.liveMusic) out.answered++;
    if (r.dietaryNotes?.trim()) out.diets.push({ name: r.name, notes: r.dietaryNotes.trim() });
    if (a.liveMusic) out.liveMusic[a.liveMusic].push(r.name);
  }
  return out;
}
