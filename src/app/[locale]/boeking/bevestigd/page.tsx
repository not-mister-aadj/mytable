import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { eq } from "drizzle-orm";
import { bookings, events } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { formatDateTime } from "@/lib/event-mapper";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string }>;
};

export default async function BookingConfirmedPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const { session_id: sessionId } = await searchParams;
  if (!isValidLocale(locale)) notFound();

  const dict = getDictionary(locale);
  let title = locale === "nl" ? "Bedankt voor je boeking" : "Thank you for your booking";
  let detail = "";

  if (sessionId && isDbConfigured() && isStripeConfigured()) {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const bookingId = session.metadata?.booking_id;
    if (bookingId) {
      const db = getDb();
      const [row] = await db
        .select({ booking: bookings, event: events })
        .from(bookings)
        .innerJoin(events, eq(bookings.eventId, events.id))
        .where(eq(bookings.id, bookingId))
        .limit(1);
      if (row) {
        const name =
          locale === "nl" ? row.event.nameNl : row.event.nameEn;
        const when = formatDateTime(
          new Date(row.event.startsAt),
          row.event.endsAt ? new Date(row.event.endsAt) : null,
          locale as Locale,
        );
        detail =
          locale === "nl"
            ? `${name} · ${row.event.city} · ${when} · ${row.booking.seats} plek(ken)`
            : `${name} · ${row.event.city} · ${when} · ${row.booking.seats} seat(s)`;
      }
    }
  }

  return (
    <>
      <Header dict={dict.header} locale={locale} />
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="font-serif text-3xl text-burgundy">{title}</h1>
        {detail ? (
          <p className="mt-4 text-wine/80">{detail}</p>
        ) : (
          <p className="mt-4 text-wine/80">
            {locale === "nl"
              ? "Je betaling is verwerkt. Check je e-mail voor de bevestiging."
              : "Your payment was processed. Check your email for confirmation."}
          </p>
        )}
        <a
          href={`/${locale}/agenda`}
          className="mt-8 inline-block rounded-full bg-burgundy px-6 py-3 text-sm text-cream"
        >
          {locale === "nl" ? "Terug naar agenda" : "Back to agenda"}
        </a>
      </main>
      <Footer dict={dict.footer} locale={locale} />
    </>
  );
}
