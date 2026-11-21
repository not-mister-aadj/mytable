import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SeatOfferForm } from "@/components/booking/SeatOfferForm";
import { Logo } from "@/components/Logo";
import { isValidLocale, sundayTableLpPath, termsPath, type Locale } from "@/i18n/config";
import { loadSeatOffer } from "@/lib/seat-offer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Er is een plek vrij | MyTable",
};

type Props = { params: Promise<{ locale: string; token: string }> };

const euros = (cents: number) => (cents % 100 === 0 ? `€${cents / 100}` : `€${(cents / 100).toFixed(2).replace(".", ",")}`);

/**
 * /plek/<token>: the page behind "Er is een plek vrij" (seat-offer.ts). One
 * seat on a Sunday that is full for everyone else, for the person the mail
 * went to. A quiet page of its own: the logo, the Sunday, the price, a form.
 */
export default async function SeatOfferPage({ params }: Props) {
  const { locale: localeParam, token: rawToken } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const en = locale === "en";
  const token = decodeURIComponent(rawToken);
  const offer = await loadSeatOffer(token);

  const card = "rounded-3xl border border-gold/30 bg-cream px-6 py-7 shadow-[0_20px_50px_rgba(43,13,18,0.06)] sm:px-8";
  const when = offer
    ? new Intl.DateTimeFormat(en ? "en-GB" : "nl-NL", { timeZone: "Europe/Amsterdam", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
        .format(offer.event.startsAt)
        .replace(/ (om|at) /, " · ")
        .replace(/^./, (c) => c.toLocaleUpperCase())
    : "";
  return (
    <main className="min-h-dvh bg-beige pb-16 pt-8 sm:pt-12">
      <div className="mx-auto max-w-md px-5 sm:px-8">
        <div className="mb-7 flex justify-center sm:mb-10">
          <Logo variant="header" priority />
        </div>
        {!offer || offer.state !== "open" ? (
          <section className={`${card} text-center`}>
            <h1 className="font-serif text-2xl text-wine">
              {!offer
                ? en
                  ? "This link doesn't work"
                  : "Deze link werkt niet"
                : offer.state === "yours"
                  ? en
                    ? "This seat is yours"
                    : "Deze plek is van jou"
                  : offer.state === "taken"
                  ? en
                    ? "This seat has just been taken"
                    : "Deze plek is net vergeven"
                  : en
                    ? "This seat can no longer be booked"
                    : "Deze plek is niet meer te boeken"}
            </h1>
            {offer ? (
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-wine/65">
                {offer.state === "yours"
                  ? en
                    ? "Your confirmation is in your inbox. See you Sunday."
                    : "Je bevestiging staat in je mail. Tot zondag."
                  : en
                    ? "You stay on the waitlist for this Sunday."
                    : "Je blijft op de wachtlijst staan voor deze zondag."}
              </p>
            ) : null}
            <Link href={sundayTableLpPath(locale)} className="mt-5 inline-flex rounded-full bg-burgundy px-5 py-2.5 text-sm font-semibold text-cream">
              Sunday Social
            </Link>
          </section>
        ) : (
          <section className={card}>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">{en ? "A seat has come free" : "Er is een plek vrij"}</p>
            <h1 className="mt-2 font-serif text-3xl font-medium leading-tight text-wine text-balance">{when}</h1>
            <p className="mt-1.5 text-[0.98rem] text-wine/70">{offer.place}</p>
            <p className="mt-4 text-[0.98rem] leading-relaxed text-wine/80">
              {en ? "One seat, at a table with people around your age." : "Eén plek, aan een tafel met mensen van rond jouw leeftijd."}
            </p>
            {offer.member ? (
              <p className="mt-5 rounded-2xl bg-white px-4 py-3.5 text-[0.95rem] leading-snug text-wine/80 ring-1 ring-wine/10">
                {en ? "This seat is in your club membership." : "Deze plek zit in je club membership."}
              </p>
            ) : (
              <div className="mt-5 rounded-2xl bg-white px-4 py-3.5 ring-1 ring-wine/10">
                <p className="flex items-baseline gap-2 text-wine">
                  <span className="font-serif text-3xl">{euros(offer.priceCents)}</span>
                  {offer.priceCents < offer.fullPriceCents ? <span className="text-base text-wine/45 line-through">{euros(offer.fullPriceCents)}</span> : null}
                </p>
                {offer.priceCents < offer.fullPriceCents ? (
                  <p className="mt-1 text-sm leading-snug text-wine/65">
                    {en ? "The groups are largely made already, so this seat is half price." : "De groepjes zijn al grotendeels gevormd, daarom is deze plek voor de helft."}
                  </p>
                ) : null}
              </div>
            )}
            <SeatOfferForm
              locale={en ? "en" : "nl"}
              token={token}
              eventId={offer.event.id}
              email={offer.email}
              firstName={offer.firstName}
              birthDate={offer.birthDate}
              price={offer.member ? null : euros(offer.priceCents)}
              termsHref={termsPath(locale)}
            />
          </section>
        )}
      </div>
    </main>
  );
}
