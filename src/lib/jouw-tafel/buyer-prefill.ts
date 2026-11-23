import { sql } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import { normalizeEmail } from "@/lib/customers/normalize";
import { buyerAnswers, type BuyerBooking } from "@/lib/jouw-tafel/buyer-answers";
import type { QuizAnswers } from "@/lib/jouw-tafel/quiz-logic";

/** Someone who bought a ticket before skips the onboarding: what the table
 * list needs comes from their paid bookings (newest first). Null when they
 * never bought one. */
export async function loadBuyerAnswers(email: string): Promise<Partial<QuizAnswers> | null> {
  if (!isDbConfigured()) return null;
  const rows = (await getDb().execute(sql`
    select b.customer_name as name, b.birth_date::text as birth_date, b.age_preference, b.table_language_preference, e.city
    from bookings b join events e on e.id = b.event_id
    where lower(trim(b.email)) = ${normalizeEmail(email)} and b.payment_status = 'paid'
    order by b.created_at desc
    limit 20`)) as unknown as BuyerBooking[];
  return rows.length ? buyerAnswers(rows) : null;
}
