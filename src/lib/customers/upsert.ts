import { eq } from "drizzle-orm";
import { customers } from "@/db/schema";
import { getDb } from "@/db/index";
import { normalizeEmail, splitCustomerName } from "@/lib/customers/normalize";
import type { UpsertCustomerInput } from "@/lib/customers/types";
import { captureServerEvent, identifyServerPerson } from "@/lib/posthog/server";
import { PostHogEvents } from "@/lib/posthog/events";
import { hashEmail } from "@/lib/posthog/properties";

export async function upsertCustomerFromEmail(
  input: UpsertCustomerInput,
): Promise<{ id: string; isNew: boolean }> {
  const emailNormalized = normalizeEmail(input.email);
  const email = emailNormalized;
  const now = new Date();
  const { firstName, lastName } = splitCustomerName(input.customerName);

  const db = getDb();
  const [existing] = await db
    .select()
    .from(customers)
    .where(eq(customers.emailNormalized, emailNormalized))
    .limit(1);

  if (existing) {
    await db
      .update(customers)
      .set({
        email,
        firstName: firstName ?? existing.firstName,
        lastName: lastName ?? existing.lastName,
        language: input.language ?? existing.language,
        preferredCity: input.preferredCity ?? existing.preferredCity,
        phone: input.phone ?? existing.phone,
        lastSeenAt: now,
        updatedAt: now,
      })
      .where(eq(customers.id, existing.id));

    void captureServerEvent(existing.id, PostHogEvents.customerUpdated, {
      email_hash: hashEmail(email),
    });

    return { id: existing.id, isNew: false };
  }

  const [created] = await db
    .insert(customers)
    .values({
      email,
      emailNormalized,
      firstName,
      lastName,
      language: input.language ?? null,
      preferredCity: input.preferredCity ?? null,
      phone: input.phone ?? null,
      firstSeenAt: now,
      lastSeenAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: customers.id });

  void captureServerEvent(created.id, PostHogEvents.customerCreated, {
    email_hash: hashEmail(email),
    language: input.language ?? null,
  });

  return { id: created.id, isNew: true };
}
