import { createHash } from "node:crypto";
import { sql, type SQL } from "drizzle-orm";

/**
 * Deleted accounts (drizzle/0077) are kept as a sha256 of the normalized
 * email and the moment of deleting. We keep their paid bookings (fiscal
 * retention), so anything that finds people through bookings or signups
 * skips rows from before that moment. Something they do afterwards (book
 * again, join the waitlist) counts as a new start.
 */
export function emailHash(normalizedEmail: string): string {
  return createHash("sha256").update(normalizedEmail.trim().toLowerCase(), "utf8").digest("hex");
}

/** SQL condition: this signup row is not from before its email's account was deleted. */
export function notDeletedBefore(email: SQL, createdAt: SQL): SQL {
  return sql`not exists (
    select 1 from deleted_accounts d
    where d.email_hash = encode(sha256(convert_to(lower(trim(${email})), 'UTF8')), 'hex')
      and ${createdAt} <= d.deleted_at
  )`;
}
