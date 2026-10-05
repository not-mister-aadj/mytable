import { render } from "@react-email/render";
import { BookingConfirmationEmail } from "@/emails/BookingConfirmationEmail";
import { MembershipEmail } from "@/emails/MembershipEmail";
import { requireAdmin } from "@/lib/admin-auth";
import {
  cancelledMail,
  noShowBlockedMail,
  noShowWarningMail,
  openForEveryoneMail,
  reminderMail,
  welcomeMail,
  type MembershipMail,
} from "@/lib/membership/mail-copy";

type Props = { searchParams: Promise<{ taal?: string }> };

/** Every membership mail with sample data, NL or EN (?taal=en). */
export default async function MembershipEmailPreviewPage({ searchParams }: Props) {
  await requireAdmin();
  const locale = (await searchParams).taal === "en" ? "en" : "nl";
  const links = { kies: "https://www.mytable.club/jouw-tafel/start?stap=kies", settings: "https://www.mytable.club/jouw-tafel/instellingen" };
  const sunday = new Date("2026-10-25T13:00:00Z");
  const mails: { label: string; mail: MembershipMail }[] = [
    { label: "Welkom als lid", mail: welcomeMail({ locale, firstName: "Anna", plan: "4m", bookedSunday: sunday, singleSeatCents: 1500, links }) },
    { label: "Herinnering eerste periode", mail: reminderMail({ locale, firstName: "Anna", plan: "4m", from: new Date("2027-02-04T09:00:00Z"), links }) },
    { label: "Opzegging bevestigd", mail: cancelledMail({ locale, firstName: "Anna", until: new Date("2027-02-04T09:00:00Z"), links }) },
    { label: "Niet gekomen: waarschuwing", mail: noShowWarningMail({ locale, firstName: "Anna", sunday, links }) },
    { label: "Niet gekomen: een maand niet boeken", mail: noShowBlockedMail({ locale, firstName: "Anna", sunday, until: new Date("2026-11-25T13:00:00Z"), links }) },
    { label: "Tafel open voor iedereen", mail: openForEveryoneMail({ locale, city: "Rotterdam", sunday, links }) },
  ];
  const rendered = await Promise.all(
    mails.map(async ({ label, mail }) => ({ label, subject: mail.subject, html: await render(MembershipEmail(mail.props)) })),
  );
  const booking = await render(
    BookingConfirmationEmail({
      locale,
      customerName: "Anna",
      customerEmail: "anna@example.com",
      eventName: "Sunday Table · 35+",
      city: "Rotterdam",
      date: locale === "en" ? "Sunday 25 October" : "zondag 25 oktober",
      time: "14:00",
      seats: 2,
      totalPaid: "€ 9,00",
      bookingCode: "MT-1A2B3C4D",
      eventUrl: "https://www.mytable.club",
      isSundayTable: true,
      memberIncluded: true,
      memberGuest: { was: "€ 15,00", now: "€ 9,00" },
    }),
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-2xl text-burgundy">E-mail preview · Lidmaatschap ({locale.toUpperCase()})</h1>
        <p className="mt-1 text-sm text-wine/60">Voorbeeldgegevens. Engels: ?taal=en</p>
      </div>
      {[...rendered, { label: "Boekingsbevestiging lid met gast", subject: "Bevestigd: Sunday Table · 35+ (MT-1A2B3C4D)", html: booking }].map((m) => (
        <section key={m.label}>
          <h2 className="font-serif text-xl text-burgundy">{m.label}</h2>
          <p className="mb-3 text-sm text-wine/60">Onderwerp: {m.subject}</p>
          <div
            className="overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-sm"
            dangerouslySetInnerHTML={{ __html: m.html }}
          />
        </section>
      ))}
    </div>
  );
}
