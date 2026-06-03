import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  jsonb,
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

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id),
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
  adminNotes: text("admin_notes"),
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

export type ExperienceType = typeof experienceTypes.$inferSelect;
export type Venue = typeof venues.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
