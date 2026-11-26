import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "drizzle-orm";
import { ClaimSeatForm } from "@/components/booking/ClaimSeatForm";
import { Logo } from "@/components/Logo";
import { getDb } from "@/db/index";
import { isValidLocale, sundayTableLpPath, type Locale } from "@/i18n/config";
import { getMemberUser } from "@/lib/member-auth";
import { readHandOverLink } from "@/lib/seat-handover-link";
import { tablePageUrl } from "@/lib/table-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Een plek voor jou | MyTable",
};

type Props = { params: Promise<{ locale: string; token: string }> };

const COPY = {
  nl: {
    title: (giver: string) => (giver ? `${giver} geeft de plek aan jou` : "Er is een plek voor jou"),
    body: "Je schuift aan bij een tafel van vier tot zes gezellige mensen. Welke zaak het is, staat in de mail die je zo krijgt. De plek is al betaald; wat je bestelt, reken je zelf af.",
    seats: "Het gaat om 2 plekken: jij en iemand die je meeneemt.",
    language: { nl: "De tafel is Nederlandstalig.", en: "Aan deze tafel wordt Nederlands en Engels gesproken." },
    form: {
      name: "Voornaam",
      email: "E-mailadres",
      birthDate: "Geboortedatum",
      promise: "Ik kom. Kan ik toch niet, dan geef ik de plek op tijd door.",
      submit: "Neem de plek over",
      doneTitle: "De plek is van jou",
      doneBody: "Je krijgt zo een mail met de zaak en je tafelpagina. Daar vul je ook drie korte vragen in, zodat je tafel weet wie er aanschuift.",
      doneLink: "Naar je tafelpagina",
      errors: {
        closed: "Deze link werkt niet meer.",
        taken: "Iemand anders heeft deze plek net overgenomen.",
        invalid: "Vul je voornaam, een geldig e-mailadres en je geboortedatum in.",
        young: "Sunday Social is vanaf 18 jaar.",
        same: "Dit is het e-mailadres van wie de plek doorgeeft.",
        already: "Met dit e-mailadres sta je al aan deze tafel.",
        failed: "Dat lukte niet. Probeer het zo nog eens.",
      },
    },
    closed: "Deze link werkt niet meer",
    closedBody: "De plek is ingetrokken of de middag is al begonnen.",
    taken: "Deze plek is al overgenomen",
    takenBody: "Iemand anders was je net voor.",
  },
  en: {
    title: (giver: string) => (giver ? `${giver} is giving the seat to you` : "There's a seat for you"),
    body: "You join a table of four to six friendly people. Which place it is will be in the mail you get in a moment. The seat is already paid for; what you order, you pay yourself.",
    seats: "It's 2 seats: you and someone you bring along.",
    language: { nl: "The table speaks Dutch.", en: "This table speaks Dutch and English." },
    form: {
      name: "First name",
      email: "Email",
      birthDate: "Date of birth",
      promise: "I'm coming. If I can't after all, I'll pass the seat on in time.",
      submit: "Take the seat",
      doneTitle: "The seat is yours",
      doneBody: "You'll get a mail with the place and your table page in a moment. There you also answer three short questions, so your table knows who is joining.",
      doneLink: "To your table page",
      errors: {
        closed: "This link no longer works.",
        taken: "Someone else just took this seat.",
        invalid: "Fill in your first name, a valid email and your date of birth.",
        young: "Sunday Social is 18+.",
        same: "This is the email of the person giving the seat.",
        already: "With this email you're already at this table.",
        failed: "That didn't work. Please try again in a moment.",
      },
    },
    closed: "This link no longer works",
    closedBody: "The seat was withdrawn or the afternoon has already started.",
    taken: "This seat has been taken",
    takenBody: "Someone else was just ahead of you.",
  },
};

/**
 * /plek-overnemen/<token>: the page behind a "geef mijn plek door" link
 * (seat-handover-link.ts). Shows only the giver's first name, the Sunday and
 * the city; the place comes in the mail once the seat is theirs.
 */
export default async function ClaimSeatPage({ params }: Props) {
  const { locale: localeParam, token: rawToken } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const en = locale === "en";
  const t = COPY[en ? "en" : "nl"];
  const token = decodeURIComponent(rawToken);
  const offer = await readHandOverLink(token);

  // Signed in on this device: their own details filled in (or, once taken, it is theirs).
  const user = await getMemberUser().catch(() => null);
  const email = user?.email?.trim().toLowerCase() ?? "";
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const metaName = typeof meta.name === "string" ? meta.name : typeof meta.full_name === "string" ? meta.full_name : "";
  const birth = email
    ? ((await getDb()
        .execute(sql`select to_char(max(birth_date), 'YYYY-MM-DD') as d from bookings where lower(trim(email)) = ${email}`)
        .catch(() => [])) as unknown as Array<{ d: string | null }>)[0]?.d ?? ""
    : "";

  const mine = offer.state === "taken" && Boolean(email) && offer.takerEmail === email && offer.takenBookingId;
  const myTable = mine && offer.state === "taken" && offer.takenBookingId ? await tablePageUrl(offer.takenBookingId, en ? "en" : "nl", "") : null;
  const card = "rounded-3xl border border-gold/30 bg-cream px-6 py-7 shadow-[0_20px_50px_rgba(43,13,18,0.06)] sm:px-8";
  return (
    <main className="min-h-dvh bg-beige pb-16 pt-8 sm:pt-12">
      <div className="mx-auto max-w-md px-5 sm:px-8">
        <div className="mb-7 flex justify-center sm:mb-10">
          <Logo variant="header" priority />
        </div>
        {myTable ? (
          <section className={`${card} text-center`}>
            <h1 className="font-serif text-2xl text-wine">{t.form.doneTitle}</h1>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-wine/65">{t.form.doneBody}</p>
            <Link href={myTable} className="mt-5 inline-flex rounded-full bg-burgundy px-5 py-2.5 text-sm font-semibold text-cream">
              {t.form.doneLink}
            </Link>
          </section>
        ) : offer.state !== "open" ? (
          <section className={`${card} text-center`}>
            <h1 className="font-serif text-2xl text-wine">{offer.state === "taken" ? t.taken : t.closed}</h1>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-wine/65">{offer.state === "taken" ? t.takenBody : t.closedBody}</p>
            <Link href={sundayTableLpPath(locale)} className="mt-5 inline-flex rounded-full bg-burgundy px-5 py-2.5 text-sm font-semibold text-cream">
              Sunday Social
            </Link>
          </section>
        ) : (
          <section className={card}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-burgundy/70">
              Sunday Social ·{" "}
              {new Intl.DateTimeFormat(en ? "en-GB" : "nl-NL", { timeZone: "Europe/Amsterdam", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
                .format(offer.startsAt)
                .replace(/ (om|at) /, " · ")}{" "}
              · {offer.city}
            </p>
            <h1 className="mt-2 font-serif text-3xl leading-tight text-wine">{t.title(offer.giver)}</h1>
            <p className="mt-3 text-sm leading-relaxed text-wine/70">{t.body}</p>
            {offer.seats >= 2 ? <p className="mt-2 text-sm text-wine/70">{t.seats}</p> : null}
            <p className="mt-2 text-sm text-wine/70">{t.language[offer.language]}</p>
            <div className="mt-6">
              <ClaimSeatForm
                token={token}
                locale={en ? "en" : "nl"}
                copy={t.form}
                prefill={{ name: metaName.trim().split(/\s+/)[0] ?? "", email, birthDate: birth }}
              />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
