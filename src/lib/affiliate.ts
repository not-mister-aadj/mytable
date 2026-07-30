import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import {
  affiliateCodes,
  affiliateCommissions,
  bookings,
} from "@/db/schema";

export async function getActiveAffiliateByCode(
  code: string,
): Promise<{ id: string; code: string; commissionCentsPerTicket: number } | null> {
  if (!isDbConfigured() || !code.trim()) return null;
  const db = getDb();
  const [row] = await db
    .select()
    .from(affiliateCodes)
    .where(eq(affiliateCodes.code, code.trim().toUpperCase()))
    .limit(1);
  if (!row || !row.active) return null;
  return {
    id: row.id,
    code: row.code,
    commissionCentsPerTicket: row.commissionCentsPerTicket,
  };
}

/** Record commission when a culinary booking is paid. */
export async function recordAffiliateCommissionForBooking(input: {
  bookingId: string;
  affiliateCode: string | null | undefined;
  seats: number;
}): Promise<boolean> {
  if (!isDbConfigured() || !input.affiliateCode) return false;
  const affiliate = await getActiveAffiliateByCode(input.affiliateCode);
  if (!affiliate) return false;

  const db = getDb();
  const amountCents = affiliate.commissionCentsPerTicket * Math.max(1, input.seats);

  try {
    await db.insert(affiliateCommissions).values({
      affiliateCodeId: affiliate.id,
      bookingId: input.bookingId,
      amountCents,
      status: "pending",
    });
    await db
      .update(bookings)
      .set({ affiliateCode: affiliate.code })
      .where(eq(bookings.id, input.bookingId));
    return true;
  } catch {
    return false;
  }
}

/** Seed helper for manual ambassador codes (idempotent). */
export async function ensureAffiliateCode(input: {
  code: string;
  name: string;
  commissionCentsPerTicket?: number;
}): Promise<void> {
  if (!isDbConfigured()) return;
  const db = getDb();
  const code = input.code.trim().toUpperCase();
  const existing = await getActiveAffiliateByCode(code);
  if (existing) return;
  await db.insert(affiliateCodes).values({
    code,
    name: input.name,
    active: true,
    commissionCentsPerTicket: input.commissionCentsPerTicket ?? 1000,
  });
}
