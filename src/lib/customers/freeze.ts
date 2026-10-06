import { eq } from "drizzle-orm";
import { customers } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { logCustomerActivity } from "@/lib/customers/activities";
import { hasFrozenTag, withFrozenTag } from "@/lib/customers/freeze-logic";
import { normalizeEmail } from "@/lib/customers/normalize";
import { CustomerActivityTypes } from "@/lib/customers/types";
import { upsertCustomerFromEmail } from "@/lib/customers/upsert";

/** True when the customer with this email is on hold ("op slot"). */
export async function isEmailFrozen(email: string | null | undefined): Promise<boolean> {
  if (!email?.trim() || !isDbConfigured()) return false;
  const [row] = await getDb()
    .select({ tags: customers.tags })
    .from(customers)
    .where(eq(customers.emailNormalized, normalizeEmail(email)))
    .limit(1);
  return hasFrozenTag(row?.tags);
}

/**
 * Puts an account on hold, or releases it, and logs why on the customer.
 * By email (a dispute: the customer is created when missing, so the hold
 * also covers a guest who never made an account) or by customer id (admin).
 * Returns the customer id and whether anything changed.
 */
export async function setCustomerFrozen(
  input: ({ email: string } | { customerId: string }) & {
    on: boolean;
    reason: string;
    metadata?: Record<string, unknown>;
  },
): Promise<{ customerId: string; changed: boolean }> {
  const db = getDb();
  const customerId =
    "customerId" in input ? input.customerId : (await upsertCustomerFromEmail({ email: input.email })).id;
  const [row] = await db.select({ tags: customers.tags }).from(customers).where(eq(customers.id, customerId)).limit(1);
  if (hasFrozenTag(row?.tags) === input.on) return { customerId, changed: false };
  await db
    .update(customers)
    .set({ tags: withFrozenTag(row?.tags, input.on), updatedAt: new Date() })
    .where(eq(customers.id, customerId));
  await logCustomerActivity({
    customerId,
    type: input.on ? CustomerActivityTypes.accountFrozen : CustomerActivityTypes.accountUnfrozen,
    title: input.on ? "Account op slot" : "Account vrijgegeven",
    description: input.reason,
    metadata: input.metadata,
  });
  return { customerId, changed: true };
}
