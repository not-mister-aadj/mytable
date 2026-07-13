import { and, eq } from "drizzle-orm";
import type { Booking, Event } from "@/db/schema";
import { waitlistSignups } from "@/db/schema";
import { getDb } from "@/db/index";
import { onWaitlistJoined } from "@/lib/customers/hooks";
import {
  parseEventExtras,
  resolveFemaleOnly,
} from "@/lib/event-extras";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isGirlsOnlyEvent(event: Event): boolean {
  const extras = parseEventExtras(event.extras);
  return resolveFemaleOnly(event.femaleOnly, extras.atmosphereTags);
}

async function linkWaitlistCustomer(input: {
  email: string;
  city: string;
  locale: string;
  waitlistId: string;
  name?: string;
}): Promise<void> {
  await onWaitlistJoined({
    email: input.email,
    city: input.city,
    locale: input.locale,
    waitlistId: input.waitlistId,
    name: input.name,
  });
}

export async function ensurePriorityListSignup(input: {
  email: string;
  city: string;
  locale: string;
  name?: string;
  signedUpAt?: Date;
}): Promise<"created" | "upgraded" | "already_enrolled"> {
  const email = normalizeEmail(input.email);
  const city = input.city.trim();
  const name = input.name?.trim() || null;
  const locale = input.locale === "en" ? "en" : "nl";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !city) {
    throw new Error("Invalid priority list signup input");
  }

  const db = getDb();
  const [existing] = await db
    .select()
    .from(waitlistSignups)
    .where(and(eq(waitlistSignups.email, email), eq(waitlistSignups.city, city)))
    .limit(1);

  if (existing) {
    if (existing.source === "priority_list") {
      if (name && !existing.name) {
        await db
          .update(waitlistSignups)
          .set({ name })
          .where(eq(waitlistSignups.id, existing.id));
      }

      if (!existing.customerId) {
        await linkWaitlistCustomer({
          email,
          city,
          locale,
          waitlistId: existing.id,
          name: name ?? undefined,
        });
      }

      return "already_enrolled";
    }

    await db
      .update(waitlistSignups)
      .set({
        source: "priority_list",
        ...(name && !existing.name ? { name } : {}),
      })
      .where(eq(waitlistSignups.id, existing.id));

    await linkWaitlistCustomer({
      email,
      city,
      locale,
      waitlistId: existing.id,
      name: name ?? undefined,
    });

    return "upgraded";
  }

  const [inserted] = await db
    .insert(waitlistSignups)
    .values({
      email,
      city,
      locale,
      name,
      source: "priority_list",
      ...(input.signedUpAt ? { createdAt: input.signedUpAt } : {}),
    })
    .returning({ id: waitlistSignups.id });

  if (!inserted) {
    throw new Error("Could not create priority list signup");
  }

  await linkWaitlistCustomer({
    email,
    city,
    locale,
    waitlistId: inserted.id,
    name: name ?? undefined,
  });

  return "created";
}

/** Add ticket buyers for girls-only events to the priority list when missing. */
export async function ensurePriorityListFromPaidBooking(input: {
  booking: Booking;
  event: Event;
}): Promise<void> {
  if (input.booking.paymentStatus !== "paid") return;
  if (!isGirlsOnlyEvent(input.event)) return;

  await ensurePriorityListSignup({
    email: input.booking.email,
    city: input.event.city,
    locale: input.booking.locale,
    name: input.booking.customerName ?? undefined,
    signedUpAt: input.booking.createdAt,
  });
}
