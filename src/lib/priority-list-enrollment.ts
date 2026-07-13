import { and, desc, eq } from "drizzle-orm";
import type { Booking, Event } from "@/db/schema";
import { bookingEvents, waitlistSignups } from "@/db/schema";
import { getDb } from "@/db/index";
import {
  parseEventExtras,
  resolveFemaleOnly,
} from "@/lib/event-extras";

export const PRIORITY_LIST_OPT_IN_EVENT = "priority_list_opt_in";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isGirlsOnlyEvent(event: Event): boolean {
  const extras = parseEventExtras(event.extras);
  return resolveFemaleOnly(event.femaleOnly, extras.atmosphereTags);
}

/**
 * The guest's priority-list choice for a booking, or null when the booking
 * predates the explicit opt-in checkbox.
 */
async function readPriorityListOptIn(
  bookingId: string,
): Promise<boolean | null> {
  const db = getDb();
  const [row] = await db
    .select({ payload: bookingEvents.payload })
    .from(bookingEvents)
    .where(
      and(
        eq(bookingEvents.bookingId, bookingId),
        eq(bookingEvents.type, PRIORITY_LIST_OPT_IN_EVENT),
      ),
    )
    .orderBy(desc(bookingEvents.createdAt))
    .limit(1);

  if (!row) return null;
  const optIn = (row.payload as { optIn?: unknown } | null)?.optIn;
  return typeof optIn === "boolean" ? optIn : null;
}

async function linkWaitlistCustomer(input: {
  email: string;
  city: string;
  locale: string;
  waitlistId: string;
  name?: string;
}): Promise<void> {
  const { onWaitlistJoined } = await import("@/lib/customers/hooks");
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

/**
 * Add ticket buyers to the priority list after payment. Honors the explicit
 * opt-in checkbox; when a booking predates it, girls-only buyers are still
 * auto-enrolled to keep the previous behavior.
 */
export async function ensurePriorityListFromPaidBooking(input: {
  booking: Booking;
  event: Event;
}): Promise<void> {
  if (input.booking.paymentStatus !== "paid") return;

  const optIn = await readPriorityListOptIn(input.booking.id);
  if (optIn === false) return;
  if (optIn === null && !isGirlsOnlyEvent(input.event)) return;

  await ensurePriorityListSignup({
    email: input.booking.email,
    city: input.event.city,
    locale: input.booking.locale,
    name: input.booking.customerName ?? undefined,
    signedUpAt: input.booking.createdAt,
  });
}
