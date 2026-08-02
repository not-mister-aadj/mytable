/**
 * Creates a past confirmed Sunday Table signup (if needed), signs a real
 * review token, and emails a link to the live review page.
 *
 * Usage:
 *   npx tsx scripts/send-review-test-email.ts
 *   npx tsx scripts/send-review-test-email.ts you@email.com
 */
import { config } from "dotenv";

config({ path: ".env.local" });

const FALLBACK_SECRET = "mytable-local-review-test-secret";

function ensureReviewSecret(): void {
  const has =
    process.env.REVIEW_TOKEN_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim();
  if (!has) {
    process.env.REVIEW_TOKEN_SECRET = FALLBACK_SECRET;
    console.warn(
      `No REVIEW_TOKEN_SECRET/CRON_SECRET/AUTH_SECRET in .env.local — using temporary secret.\n` +
        `Add this line and restart next:\n` +
        `REVIEW_TOKEN_SECRET=${FALLBACK_SECRET}\n`,
    );
  }
}

ensureReviewSecret();

function yesterdayIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${day}`;
}

async function main() {
  const { and, eq } = await import("drizzle-orm");
  const { SundayTableReviewEmail } = await import(
    "../emails/SundayTableReviewEmail"
  );
  const { getDb, isDbConfigured } = await import("../src/db/index");
  const { sundayTableReviews, sundayTableSignups } = await import(
    "../src/db/schema"
  );
  const { sundayTableReviewPath } = await import("../src/i18n/config");
  type Locale = import("../src/i18n/config").Locale;
  const { renderEmailForDelivery } = await import(
    "../src/lib/email/render-email"
  );
  const {
    getEmailFrom,
    getEmailReplyTo,
    getResendClient,
    isEmailConfigured,
  } = await import("../src/lib/email/resend");
  const { signSundayTableReviewToken } = await import(
    "../src/lib/sunday-table-review-token"
  );

  const to =
    process.env.TEST_EMAIL_TO?.trim() ||
    process.argv[2]?.trim() ||
    "mssalarbux@gmail.com";

  if (!isEmailConfigured()) throw new Error("RESEND_API_KEY missing in .env.local");
  if (!isDbConfigured()) throw new Error("DATABASE_URL missing in .env.local");

  const db = getDb();
  const tableDate = yesterdayIso();
  const city = "Rotterdam";
  const tableType = "mixed";
  const locale: Locale = "nl";
  const email = to.toLowerCase();

  let [signup] = await db
    .select()
    .from(sundayTableSignups)
    .where(
      and(
        eq(sundayTableSignups.email, email),
        eq(sundayTableSignups.city, city),
        eq(sundayTableSignups.tableDate, tableDate),
        eq(sundayTableSignups.tableType, tableType),
      ),
    )
    .limit(1);

  if (!signup) {
    const [created] = await db
      .insert(sundayTableSignups)
      .values({
        email,
        name: "Siraadj",
        city,
        tableDate,
        tableType,
        planId: "1m",
        locale,
        status: "confirmed",
        attendedAt: new Date(),
        profile: {},
      })
      .returning();
    signup = created!;
    console.log("Created test signup", signup.id, tableDate);
  } else {
    await db
      .update(sundayTableSignups)
      .set({
        status: "confirmed",
        attendedAt: signup.attendedAt ?? new Date(),
        cancelledAt: null,
        name: signup.name || "Siraadj",
      })
      .where(eq(sundayTableSignups.id, signup.id));
    console.log("Reusing signup", signup.id, tableDate);
  }

  await db
    .delete(sundayTableReviews)
    .where(eq(sundayTableReviews.signupId, signup.id));

  const token = await signSundayTableReviewToken({
    signupId: signup.id,
    email,
  });

  const site = (
    process.env.REVIEW_TEST_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "http://localhost:3001"
  ).replace(/\/$/, "");

  const reviewUrl = `${site}${sundayTableReviewPath(locale, token)}`;

  const resend = getResendClient();
  if (!resend) throw new Error("Resend unavailable");

  const { html, text } = await renderEmailForDelivery(
    SundayTableReviewEmail({
      locale,
      firstName: "Siraadj",
      city,
      reviewUrl,
    }),
  );

  const { data, error } = await resend.emails.send({
    from: getEmailFrom(),
    replyTo: getEmailReplyTo(),
    to,
    subject: `Hoe was Sunday Table in ${city}?`,
    html,
    text,
  });
  if (error) throw new Error(error.message);

  console.log("OK email", data?.id, "→", to);
  console.log("Review URL:", reviewUrl);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
