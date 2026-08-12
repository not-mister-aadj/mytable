import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { SundayTableSignupProfile } from "@/lib/sunday-table-shared";

export type { SundayTableSignupProfile } from "@/lib/sunday-table-shared";

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

/** Old public agenda slugs → current event slug (308 redirects). */
export const eventSlugRedirects = pgTable("event_slug_redirects", {
  fromSlug: text("from_slug").primaryKey(),
  toSlug: text("to_slug").notNull(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
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
  affiliateCode: text("affiliate_code"),
  referralCode: text("referral_code"),
  fromSundayTable: boolean("from_sunday_table").notNull().default(false),
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
    preferences: jsonb("preferences").$type<Record<string, unknown>>(),
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

export const sundayTableWaitlistInvites = pgTable(
  "sunday_table_waitlist_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    waitlistSignupId: uuid("waitlist_signup_id")
      .notNull()
      .references(() => waitlistSignups.id, { onDelete: "cascade" }),
    city: text("city").notNull(),
    tableDate: date("table_date").notNull(),
    tableType: text("table_type").notNull(),
    email: text("email").notNull(),
    locale: text("locale").notNull().default("nl"),
    sentAt: timestamp("sent_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    cohortUnique: uniqueIndex("sunday_table_waitlist_invites_unique").on(
      table.waitlistSignupId,
      table.city,
      table.tableDate,
      table.tableType,
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

/** Key/value site config (e.g. waitlist WhatsApp invite links) */
export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<Record<string, unknown>>().notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ClubPlanId = "1m" | "5m" | "12m";
export type ClubMembershipStatus =
  | "pending"
  | "active"
  | "past_due"
  | "canceled";
export type SundayTableSignupStatus =
  | "pending_payment"
  | "confirmed"
  | "cancelled";

export const clubMemberships = pgTable(
  "club_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name"),
    userId: uuid("user_id"),
    customerId: uuid("customer_id").references(() => customers.id),
    planId: text("plan_id").notNull(),
    status: text("status").notNull().default("pending"),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    /** Period end we already emailed a 7-day renewal reminder for. */
    renewalReminderPeriodEnd: timestamp("renewal_reminder_period_end", {
      withTimezone: true,
    }),
    locale: text("locale").notNull().default("nl"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    stripeSubscriptionUnique: uniqueIndex(
      "club_memberships_stripe_subscription_unique",
    ).on(table.stripeSubscriptionId),
    stripeSessionUnique: uniqueIndex(
      "club_memberships_stripe_session_unique",
    ).on(table.stripeCheckoutSessionId),
  }),
);

export const sundayTableSignups = pgTable(
  "sunday_table_signups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name"),
    city: text("city").notNull(),
    tableDate: date("table_date").notNull(),
    tableType: text("table_type").notNull(),
    planId: text("plan_id").notNull(),
    locale: text("locale").notNull().default("nl"),
    userId: uuid("user_id"),
    customerId: uuid("customer_id").references(() => customers.id),
    membershipId: uuid("membership_id").references(() => clubMemberships.id),
    status: text("status").notNull().default("pending_payment"),
    plusOne: boolean("plus_one").notNull().default(false),
    attendedAt: timestamp("attended_at", { withTimezone: true }),
    inviteEmailSentAt: timestamp("invite_email_sent_at", {
      withTimezone: true,
    }),
    culinaryEmailSentAt: timestamp("culinary_email_sent_at", {
      withTimezone: true,
    }),
    confirmationEmailSentAt: timestamp("confirmation_email_sent_at", {
      withTimezone: true,
    }),
    locationEmailSentAt: timestamp("location_email_sent_at", {
      withTimezone: true,
    }),
    reviewEmailSentAt: timestamp("review_email_sent_at", {
      withTimezone: true,
    }),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    profile: jsonb("profile").$type<SundayTableSignupProfile>(),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    emailCityDateTypeUnique: uniqueIndex(
      "sunday_table_signups_email_city_date_type_unique",
    ).on(table.email, table.city, table.tableDate, table.tableType),
  }),
);

export const sundayTableReviews = pgTable(
  "sunday_table_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    signupId: uuid("signup_id")
      .notNull()
      .references(() => sundayTableSignups.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    body: text("body"),
    photoUrl: text("photo_url"),
    marketingConsent: boolean("marketing_consent").notNull().default(false),
    locale: text("locale").notNull().default("nl"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    signupUnique: uniqueIndex("sunday_table_reviews_signup_unique").on(
      table.signupId,
    ),
  }),
);

export const sundayTableLocations = pgTable(
  "sunday_table_locations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    city: text("city").notNull(),
    tableDate: date("table_date").notNull(),
    tableType: text("table_type").notNull(),
    venueName: text("venue_name").notNull(),
    address: text("address").notNull(),
    notes: text("notes"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    keyUnique: uniqueIndex("sunday_table_locations_key_unique").on(
      table.city,
      table.tableDate,
      table.tableType,
    ),
  }),
);

export const referralCodes = pgTable(
  "referral_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    userId: uuid("user_id"),
    email: text("email").notNull(),
    membershipId: uuid("membership_id").references(() => clubMemberships.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
);

export const referralAttributions = pgTable(
  "referral_attributions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    referralCodeId: uuid("referral_code_id")
      .notNull()
      .references(() => referralCodes.id),
    refereeEmail: text("referee_email").notNull(),
    refereeUserId: uuid("referee_user_id"),
    status: text("status").notNull().default("signed_up"),
    rewardedAt: timestamp("rewarded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
);

export const affiliateCodes = pgTable("affiliate_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),
  commissionCentsPerTicket: integer("commission_cents_per_ticket")
    .notNull()
    .default(1000),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const affiliateCommissions = pgTable(
  "affiliate_commissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    affiliateCodeId: uuid("affiliate_code_id")
      .notNull()
      .references(() => affiliateCodes.id),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id),
    amountCents: integer("amount_cents").notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    bookingUnique: uniqueIndex("affiliate_commissions_booking_unique").on(
      table.bookingId,
    ),
  }),
);

export type Customer = typeof customers.$inferSelect;
export type CustomerActivity = typeof customerActivities.$inferSelect;
export type ExperienceType = typeof experienceTypes.$inferSelect;
export type Venue = typeof venues.$inferSelect;
export type Event = typeof events.$inferSelect;
export type EventSlugRedirect = typeof eventSlugRedirects.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type SiteSetting = typeof siteSettings.$inferSelect;
export type ClubMembership = typeof clubMemberships.$inferSelect;
export type SundayTableSignup = typeof sundayTableSignups.$inferSelect;
export type SundayTableWaitlistInvite =
  typeof sundayTableWaitlistInvites.$inferSelect;
export type SundayTableReview = typeof sundayTableReviews.$inferSelect;
export type ReferralCode = typeof referralCodes.$inferSelect;
export type ReferralAttribution = typeof referralAttributions.$inferSelect;
export type AffiliateCode = typeof affiliateCodes.$inferSelect;
export type AffiliateCommission = typeof affiliateCommissions.$inferSelect;
