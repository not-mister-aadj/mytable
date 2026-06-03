import { desc, eq } from "drizzle-orm";
import { bookings, events } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminBookingsPage() {
  await requireAdmin();
  if (!isDbConfigured()) {
    return <p>Database niet geconfigureerd.</p>;
  }

  const db = getDb();
  const rows = await db
    .select({
      booking: bookings,
      event: events,
    })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .orderBy(desc(bookings.createdAt))
    .limit(100);

  return (
    <div>
      <h1 className="font-serif text-3xl text-burgundy">Boekingen</h1>
      <table className="mt-8 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border-subtle text-wine/60">
            <th className="py-2">Datum</th>
            <th>Event</th>
            <th>E-mail</th>
            <th>Plekken</th>
            <th>Bedrag</th>
            <th>Status</th>
            <th>Stripe</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ booking, event }) => (
            <tr key={booking.id} className="border-b border-border-subtle/60">
              <td className="py-3">
                {new Date(booking.createdAt).toLocaleString("nl-NL")}
              </td>
              <td>
                {event.nameNl} · {event.city}
              </td>
              <td>{booking.email}</td>
              <td>{booking.seats}</td>
              <td>€{(booking.amountCents / 100).toFixed(2)}</td>
              <td>{booking.paymentStatus}</td>
              <td>
                {booking.stripeCheckoutSessionId ? (
                  <a
                    href={`https://dashboard.stripe.com/test/payments/${booking.stripePaymentIntentId ?? ""}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-burgundy underline"
                  >
                    Stripe
                  </a>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
