import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const workflowStatusEnum = pgEnum("workflow_status", [
  "draft",
  "published",
  "cancelled",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
  "refunded",
]);

export const bookingLifecycleStatusEnum = pgEnum("booking_lifecycle_status", [
  "active",
  "transferred",
  "removed",
]);

/** Fixed content per experience format (e.g. all wine tastings share venues) */
export const experienceTypes = pgTable("experience_types", {
  slug: text("slug").primaryKey(),
  nameNl: text("name_nl").notNull(),
  nameEn: text("name_en").notNull(),
  mood: text("mood").notNull().default("tastings"),
  venueIds: jsonb("venue_ids").$type<string[]>().notNull().default([]),
  /** Page copy, gallery, map — shared by all events of this type */
  content: jsonb("content").$type<Record<string, unknown>>().notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const venues = pgTable("venues", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  area: text("area"),
  address: text("address"),
  atmosphere: text("atmosphere"),
  descriptionNl: text("description_nl"),
  descriptionEn: text("description_en"),
  imageUrl: text("image_url"),
  imageMeta: jsonb("image_meta").$type<Record<string, unknown>>(),
  /** Gallery images for sfeerimpressie — source of truth for event image picks */
  galleryMeta: jsonb("gallery_meta").$type<Record<string, unknown>[]>(),
  latitude: text("latitude"),
  longitude: text("longitude"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  legacyId: text("legacy_id"),
  slug: text("slug").notNull().unique(),
  workflowStatus: workflowStatusEnum("workflow_status")
    .notNull()
    .default("draft"),
  city: text("city").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  priceCents: integer("price_cents").notNull(),
  currency: text("currency").notNull().default("EUR"),
  capacity: integer("capacity").notNull().default(14),
  spotsSold: integer("spots_sold").notNull().default(0),
  femaleOnly: boolean("female_only").notNull().default(false),
  experienceType: text("experience_type").notNull().default("wine-tasting"),
  mood: text("mood").notNull().default("tastings"),
  venueId: uuid("venue_id").references(() => venues.id),
  imageUrl: text("image_url").notNull(),
  nameNl: text("name_nl").notNull(),
  nameEn: text("name_en").notNull(),
  taglineNl: text("tagline_nl"),
  taglineEn: text("tagline_en"),
  categoryNl: text("category_nl").notNull().default("PROEVERIJ"),
  categoryEn: text("category_en").notNull().default("TASTING"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  extras: jsonb("extras").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    emailNormalized: text("email_normalized").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    phone: text("phone"),
    preferredCity: text("preferred_city"),
    language: text("language"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    firstBookingAt: timestamp("first_booking_at", { withTimezone: true }),
    lastBookingAt: timestamp("last_booking_at", { withTimezone: true }),
    totalBookings: integer("total_bookings").notNull().default(0),
    paidBookingsCount: integer("paid_bookings_count").notNull().default(0),
    cancelledBookingsCount: integer("cancelled_bookings_count")
      .notNull()
      .default(0),
    movedBookingsCount: integer("moved_bookings_count").notNull().default(0),
    failedPaymentsCount: integer("failed_payments_count").notNull().default(0),
    waitlistCount: integer("waitlist_count").notNull().default(0),
    totalSpentCents: integer("total_spent_cents").notNull().default(0),
    totalSeatsBooked: integer("total_seats_booked").notNull().default(0),
    favoriteCity: text("favorite_city"),
    favoriteEventType: text("favorite_event_type"),
    tags: jsonb("tags").$type<string[]>().default([]),
    notes: text("notes"),
  },
  (table) => ({
    emailNormalizedUnique: uniqueIndex("customers_email_normalized_unique").on(
      table.emailNormalized,
    ),
  }),
);

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id),
  customerId: uuid("customer_id").references(() => customers.id),
  email: text("email").notNull(),
  customerName: text("customer_name"),
  seats: integer("seats").notNull().default(1),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("EUR"),
  stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  paymentStatus: paymentStatusEnum("payment_status")
    .notNull()
    .default("pending"),
  locale: text("locale").notNull().default("nl"),
  dietaryNotes: text("dietary_notes"),
  seatingPreference: text("seating_preference"),
  tableLanguagePreference: text("table_language_preference"),
  adminNotes: text("admin_notes"),
  confirmationEmailSentAt: timestamp("confirmation_email_sent_at", {
    withTimezone: true,
  }),
  lifecycleStatus: bookingLifecycleStatusEnum("lifecycle_status")
    .notNull()
    .default("active"),
  transferredToEventId: uuid("transferred_to_event_id").references(
    () => events.id,
  ),
  transferredToBookingId: uuid("transferred_to_booking_id"),
  transferredFromBookingId: uuid("transferred_from_booking_id"),
  transferredAt: timestamp("transferred_at", { withTimezone: true }),
  transferredBy: text("transferred_by"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const bookingEvents = pgTable("booking_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id),
  type: text("type").notNull(),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const waitlistSignups = pgTable(
  "waitlist_signups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    city: text("city").notNull(),
    locale: text("locale").notNull().default("nl"),
    name: text("name"),
    source: text("source").notNull().default("waitlist"),
    customerId: uuid("customer_id").references(() => customers.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    emailCityUnique: uniqueIndex("waitlist_signups_email_city_unique").on(
      table.email,
      table.city,
    ),
  }),
);

export const customerActivities = pgTable("customer_activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Customer = typeof customers.$inferSelect;
export type CustomerActivity = typeof customerActivities.$inferSelect;
export type ExperienceType = typeof experienceTypes.$inferSelect;
export type Venue = typeof venues.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
