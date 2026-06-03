CREATE TYPE "public"."workflow_status" AS ENUM('draft', 'published', 'cancelled');
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'failed', 'refunded');

CREATE TABLE "venues" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "city" text NOT NULL,
  "area" text,
  "address" text,
  "atmosphere" text,
  "description_nl" text,
  "description_en" text,
  "image_url" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "legacy_id" text,
  "slug" text NOT NULL UNIQUE,
  "workflow_status" "workflow_status" DEFAULT 'draft' NOT NULL,
  "city" text NOT NULL,
  "starts_at" timestamp with time zone NOT NULL,
  "ends_at" timestamp with time zone,
  "price_cents" integer NOT NULL,
  "currency" text DEFAULT 'EUR' NOT NULL,
  "capacity" integer DEFAULT 14 NOT NULL,
  "spots_sold" integer DEFAULT 0 NOT NULL,
  "female_only" boolean DEFAULT false NOT NULL,
  "mood" text DEFAULT 'tastings' NOT NULL,
  "venue_id" uuid REFERENCES "venues"("id"),
  "image_url" text NOT NULL,
  "name_nl" text NOT NULL,
  "name_en" text NOT NULL,
  "tagline_nl" text,
  "tagline_en" text,
  "category_nl" text DEFAULT 'PROEVERIJ' NOT NULL,
  "category_en" text DEFAULT 'TASTING' NOT NULL,
  "published_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "bookings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_id" uuid NOT NULL REFERENCES "events"("id"),
  "email" text NOT NULL,
  "customer_name" text,
  "seats" integer DEFAULT 1 NOT NULL,
  "amount_cents" integer NOT NULL,
  "currency" text DEFAULT 'EUR' NOT NULL,
  "stripe_checkout_session_id" text UNIQUE,
  "stripe_payment_intent_id" text,
  "payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
  "locale" text DEFAULT 'nl' NOT NULL,
  "dietary_notes" text,
  "admin_notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "booking_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "booking_id" uuid NOT NULL REFERENCES "bookings"("id"),
  "type" text NOT NULL,
  "payload" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
