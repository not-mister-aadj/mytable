import { Resend } from "resend";
import type { Booking, Event } from "@/db/schema";
import { formatDateTime } from "@/lib/event-mapper";
import type { Locale } from "@/i18n/config";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendBookingConfirmationEmail({
  booking,
  event,
}: {
  booking: Booking;
  event: Event;
}) {
  const resend = getResend();
  const from = process.env.EMAIL_FROM;
  if (!resend || !from) {
    console.warn("[email] RESEND_API_KEY or EMAIL_FROM missing, skip send");
    return;
  }

  const locale = (booking.locale === "en" ? "en" : "nl") as Locale;
  const name = locale === "nl" ? event.nameNl : event.nameEn;
  const when = formatDateTime(
    new Date(event.startsAt),
    event.endsAt ? new Date(event.endsAt) : null,
    locale,
  );

  const subject =
    locale === "nl"
      ? `Bevestiging: ${name}`
      : `Confirmation: ${name}`;

  const html =
    locale === "nl"
      ? `<p>Hoi${booking.customerName ? ` ${booking.customerName}` : ""},</p>
<p>Je betaling voor <strong>${name}</strong> in ${event.city} is ontvangen.</p>
<p><strong>Wanneer:</strong> ${when}<br/>
<strong>Plekken:</strong> ${booking.seats}<br/>
<strong>Totaal:</strong> €${(booking.amountCents / 100).toFixed(2)}</p>
<p>Praktische info en het restaurant ontvang je zo nodig nog per e-mail. Vragen? Antwoord op deze mail.</p>
<p>Tot aan tafel,<br/>MyTable</p>`
      : `<p>Hi${booking.customerName ? ` ${booking.customerName}` : ""},</p>
<p>Your payment for <strong>${name}</strong> in ${event.city} was received.</p>
<p><strong>When:</strong> ${when}<br/>
<strong>Seats:</strong> ${booking.seats}<br/>
<strong>Total:</strong> €${(booking.amountCents / 100).toFixed(2)}</p>
<p>Practical details and the restaurant address will follow if needed. Questions? Reply to this email.</p>
<p>See you at the table,<br/>MyTable</p>`;

  await resend.emails.send({
    from,
    to: booking.email,
    subject,
    html,
  });
}
