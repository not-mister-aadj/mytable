import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EditOwnIntro, PlusOneEditor, TableIntroGate, TableShareGate } from "@/components/table-page/TablePageGates";
import { isValidLocale, sundayTableLpPath, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { reservationCode } from "@/lib/booking-display";
import { signSundayTableIntroToken, type IntroWine } from "@/lib/sunday-table-intro";
import { loadTablePage, tablePageAfterPath, verifyTablePageToken, type TableMate, type TablePage } from "@/lib/table-page";
import { pickTags, type PickKind, type VenuePick } from "@/lib/venue-picks";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Jouw tafel | MyTable",
  openGraph: { title: "MyTable · Jouw tafel" },
};

const COPY = {
  nl: {
    today: "Vandaag aan tafel",
    tomorrow: "Morgen aan tafel",
    later: "Zondag aan tafel",
    when: "Wanneer",
    where: "Waar",
    transit: "Bereikbaar",
    language: "Taal",
    languages: { nl: "Nederlands", en: "Nederlands en Engels" },
    englishOk: "Iedereen aan deze tafel gaf aan dat Engels ook prima is.",
    until: "tot",
    yourTable: "Jouw tafel",
    group: (n: number) => `Groep ${n}`,
    groupHint: (n: number, venue: string) => `Zeg bij binnenkomst dat je bij MyTable hoort, groep ${n}. Het team van ${venue} wijst je je tafel.`,
    notSeated: "We delen de tafels nog in. Kijk later vandaag nog eens.",
    yourGroup: (n: number) => `Jouw groep, groep ${n}, met een korte kennismaking`,
    otherGroups: (venue: string) =>
      `Er kunnen meer MyTable-groepen bij ${venue} zijn. Soms deel je een lange tafel met een andere groep. Klets gerust met iedereen: we komen allemaal voor de gezelligheid en de wijn.`,
    you: "jij",
    plusOne: (name: string) => `komt met ${name}`,
    pending: { today: "Leer je vandaag kennen", tomorrow: "Leer je morgen kennen", later: "Leer je zondag kennen" },
    editOwn: "Pas je antwoorden aan",
    plusOneEdit: {
      open: (name: string) => `Vertel iets over ${name}`,
      edit: (name: string) => `Pas aan wat je over ${name} vertelt`,
      note: "Alleen voor deze pagina, voor jullie tafel.",
      askMeAbout: "Waar mogen mensen naar vragen?",
      favoriteSpot: "Favoriete plek in de stad",
      intoNow: "Waar is diegene nu into?",
      wine: "Rood, wit of bubbels?",
      save: "Opslaan",
      cancel: "Annuleren",
      error: "Dat lukte niet. Probeer het opnieuw.",
    },
    labels: { askMeAbout: "Vraag me over", favoriteSpot: "Favoriete plek", intoNow: "Into", wine: "Wijn" },
    wine: { red: "Rood", white: "Wit", bubbles: "Bubbels" } as Record<IntroWine, string>,
    introLead: "Vul eerst je intro in. Daarna zie je wie er aan je tafel zitten.",
    share: {
      lead: "Deel je intro om te zien wie er aan je tafel zitten.",
      note: "Je tafelgenoten zien dan ook jouw antwoorden.",
      button: "Deel mijn intro",
      error: "Dat lukte niet. Probeer het opnieuw.",
    },
    picksLabel: "Onze aanraders",
    picksTitle: (venue: string) => `Wat wij zouden bestellen bij ${venue}`,
    picksLead: (venue: string) =>
      `We hebben bij ${venue} geproefd. Dit zijn onze keuzes. Geen verplichting: je bestelt en betaalt zelf, en het team van ${venue} helpt je ook graag kiezen.`,
    picksSoon: (venue: string) => `Zondagochtend staan hier onze wijn- en hapjesaanraders voor ${venue}.`,
    goesWith: "Bijpassende spijs",
    tableDrinks: "Jullie tafel drinkt graag",
    askTeam: (venue: string) => `Vraag het team van ${venue} wat zij vandaag zouden schenken, ze helpen je graag kiezen.`,
    footer: "Deze pagina is alleen voor jouw tafel en verdwijnt zondag om 18:00.",
    route: "Route",
    invalidTitle: "Deze link werkt niet",
    invalidBody: "Misschien is hij niet helemaal meegekomen. Open hem opnieuw vanuit je mail.",
    invalidCta: "Naar Sunday Social",
  },
  en: {
    today: "At the table today",
    tomorrow: "At the table tomorrow",
    later: "At the table on Sunday",
    when: "When",
    where: "Where",
    transit: "Getting there",
    language: "Language",
    languages: { nl: "Dutch", en: "Dutch and English" },
    englishOk: "Everyone at your table said English is fine.",
    until: "to",
    yourTable: "Your table",
    group: (n: number) => `Group ${n}`,
    groupHint: (n: number, venue: string) => `When you arrive, say you're with MyTable, group ${n}. The ${venue} team will show you to your table.`,
    notSeated: "We're still putting the tables together. Check back later today.",
    yourGroup: (n: number) => `Your group, group ${n}, with a short introduction`,
    otherGroups: (venue: string) =>
      `There may be more MyTable groups at ${venue}. Sometimes you'll share a long table with another group. Feel free to chat with everyone: we're all there for good company and good wine.`,
    you: "you",
    plusOne: (name: string) => `with ${name}`,
    pending: { today: "You'll meet today", tomorrow: "You'll meet tomorrow", later: "You'll meet on Sunday" },
    editOwn: "Change your answers",
    plusOneEdit: {
      open: (name: string) => `Tell us about ${name}`,
      edit: (name: string) => `Change what you share about ${name}`,
      note: "Only for this page, for your table.",
      askMeAbout: "What can people ask about?",
      favoriteSpot: "Favourite spot in the city",
      intoNow: "What are they into right now?",
      wine: "Red, white or bubbles?",
      save: "Save",
      cancel: "Cancel",
      error: "That didn't work. Please try again.",
    },
    labels: { askMeAbout: "Ask me about", favoriteSpot: "Favourite spot", intoNow: "Into", wine: "Wine" },
    wine: { red: "Red", white: "White", bubbles: "Bubbles" } as Record<IntroWine, string>,
    introLead: "Fill in your intro first. Then you'll see who's at your table.",
    share: {
      lead: "Share your intro to see who's at your table.",
      note: "Your tablemates will see your answers too.",
      button: "Share my intro",
      error: "That didn't work. Please try again.",
    },
    picksLabel: "Our picks",
    picksTitle: (venue: string) => `What we'd order at ${venue}`,
    picksLead: (venue: string) =>
      `We tasted at ${venue}. These are our picks. No obligation: you order and pay yourself, and the ${venue} team is happy to help you choose too.`,
    picksSoon: (venue: string) => `On Sunday morning you'll find our wine and food picks for ${venue} here.`,
    goesWith: "Food pairing",
    tableDrinks: "Your table likes",
    askTeam: (venue: string) => `Ask the ${venue} team what they'd pour today, they're happy to help you choose.`,
    footer: "This page is only for your table and disappears on Sunday at 6 PM.",
    route: "Directions",
    invalidTitle: "This link doesn't work",
    invalidBody: "It may not have come through completely. Open it again from your email.",
    invalidCta: "To Sunday Social",
  },
} as const;
type Copy = (typeof COPY)["nl"] | (typeof COPY)["en"];

const KIND_DOT: Record<PickKind, string> = {
  bubbles: "bg-[#e9d79a]",
  white: "bg-[#f1e8c4]",
  rose: "bg-[#e8b4b0]",
  sweet: "bg-[#d9a441]",
  red: "bg-burgundy",
  food: "bg-gold",
};

type Props = { params: Promise<{ locale: string; token: string }> };

export default async function TablePageRoute({ params }: Props) {
  const { locale: localeParam, token } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const dict = getDictionary(locale);
  const t = COPY[locale === "en" ? "en" : "nl"];

  const bookingId = await verifyTablePageToken(decodeURIComponent(token));
  const page = bookingId ? await loadTablePage(bookingId) : null;
  if (page?.closed) redirect(tablePageAfterPath(locale, page.city));

  return (
    <>
      <Header dict={dict.header} locale={locale} />
      <main className="bg-beige pb-16 pt-28 sm:pt-36">
        <div className="mx-auto max-w-2xl space-y-5 px-5 sm:px-8">
          {page ? <TablePageBody page={page} token={decodeURIComponent(token)} locale={locale} t={t} /> : <Invalid t={t} locale={locale} />}
        </div>
      </main>
      <Footer dict={dict.footer} locale={locale} showFormats={false} />
    </>
  );
}

function Invalid({ t, locale }: { t: Copy; locale: Locale }) {
  return (
    <section className="rounded-3xl border border-gold/30 bg-cream px-6 py-8 text-center sm:px-8">
      <h1 className="font-serif text-2xl text-wine">{t.invalidTitle}</h1>
      <p className="mt-2 text-sm text-wine/70">{t.invalidBody}</p>
      <Link href={sundayTableLpPath(locale)} className="mt-5 inline-flex rounded-full bg-burgundy px-5 py-2.5 text-sm font-semibold text-cream">
        {t.invalidCta}
      </Link>
    </section>
  );
}

async function TablePageBody({ page, token, locale, t }: { page: TablePage; token: string; locale: Locale; t: Copy }) {
  const intl = locale === "en" ? "en-GB" : "nl-NL";
  const day = new Intl.DateTimeFormat(intl, { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Amsterdam" }).format(page.startsAt);
  const hm = (d: Date) => new Intl.DateTimeFormat("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" }).format(d);
  const end = new Date(page.startsAt.getTime() + 3 * 60 * 60 * 1000);
  const introToken = await signSundayTableIntroToken(page.bookingId);
  const heading = page.day === "today" ? t.today : page.day === "tomorrow" ? t.tomorrow : t.later;
  const venueName = page.venue?.name ?? page.city;
  const mapsUrl = page.venue?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${page.venue.name}, ${page.venue.address}`)}`
    : null;

  return (
    <>
      <section className="rounded-3xl border border-gold/30 bg-cream px-6 py-7 shadow-[0_20px_50px_rgba(43,13,18,0.06)] sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">Sunday Social {page.city}</p>
        <h1 className="mt-2 font-serif text-3xl font-medium text-wine sm:text-4xl">{heading}</h1>
        <dl className="mt-5 space-y-2 text-sm">
          <Row label={t.when} value={`${day}, ${hm(page.startsAt)} ${t.until} ${hm(end)}`} />
          {page.venue ? (
            <Row
              label={t.where}
              value={page.venue.address ? `${page.venue.name}, ${page.venue.address}` : page.venue.name}
              href={mapsUrl ?? undefined}
            />
          ) : null}
          {page.venue?.transit ? <Row label={t.transit} value={page.venue.transit} /> : null}
          {page.groupNumber !== null ? (
            <Row
              label={t.language}
              value={t.languages[page.language]}
              note={page.language === "en" ? t.englishOk : undefined}
            />
          ) : null}
        </dl>
        {mapsUrl ? (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex rounded-full border border-wine/15 bg-white px-5 py-2.5 text-sm font-semibold text-wine transition hover:border-wine/30"
          >
            {t.route}
          </a>
        ) : null}
      </section>

      {!page.me.answered ? (
        <TableIntroGate
          locale={locale}
          city={page.city}
          introToken={introToken}
          bookingCode={reservationCode(page.bookingId)}
          seats={page.me.plusOneName ? 2 : 1}
          lead={t.introLead}
        />
      ) : (
        <section className="rounded-3xl border border-gold/30 bg-cream px-6 py-7 shadow-[0_20px_50px_rgba(43,13,18,0.06)] sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">{t.yourTable}</p>
          {page.groupNumber !== null ? (
            <>
              <h2 className="mt-2 font-serif text-2xl font-medium text-wine sm:text-3xl">{t.group(page.groupNumber)}</h2>
              <p className="mt-2 text-sm leading-relaxed text-wine/70">{t.groupHint(page.groupNumber, venueName)}</p>
              <p className="mt-2 text-sm leading-relaxed text-wine/70">{t.otherGroups(venueName)}</p>
            </>
          ) : (
            <p className="mt-3 text-sm text-wine/70">{t.notSeated}</p>
          )}
          {page.groupNumber === null ? null : !page.me.shared ? (
            <TableShareGate token={token} copy={t.share} />
          ) : (
            <>
            <p className="mt-6 border-t border-wine/10 pt-5 font-serif text-lg text-wine">{t.yourGroup(page.groupNumber)}</p>
            <ul className="mt-3 space-y-3">
              {page.mates.map((m, i) => (
                <Mate key={m.bookingId} m={m} you={i === 0} t={t} day={page.day}>
                  {i === 0 ? (
                    <EditOwnIntro
                      locale={locale}
                      city={page.city}
                      introToken={introToken}
                      bookingCode={reservationCode(page.bookingId)}
                      seats={page.me.plusOneName !== null || page.me.plusOne ? 2 : 1}
                      intro={page.me.intro}
                      label={t.editOwn}
                      closeLabel={t.plusOneEdit.cancel}
                    />
                  ) : m.bookingId === `${page.bookingId}+1` && page.me.plusOne ? (
                    <PlusOneEditor
                      token={token}
                      answers={page.me.plusOne}
                      copy={{
                        ...t.plusOneEdit,
                        open: t.plusOneEdit.open(m.firstName || "je +1"),
                        edit: t.plusOneEdit.edit(m.firstName || "je +1"),
                        wines: t.wine,
                      }}
                    />
                  ) : null}
                </Mate>
              ))}
            </ul>
            </>
          )}
        </section>
      )}

      <Picks page={page} venueName={venueName} t={t} />

      <p className="px-1 text-xs text-wine/50">{t.footer}</p>
    </>
  );
}

function Mate({ m, you, t, day, children }: { m: TableMate; you: boolean; t: Copy; day: TablePage["day"]; children?: React.ReactNode }) {
  const a = m.answers;
  const rows: [string, string][] = [];
  if (a?.askMeAbout) rows.push([t.labels.askMeAbout, a.askMeAbout]);
  if (a?.favoriteSpot) rows.push([t.labels.favoriteSpot, a.favoriteSpot]);
  if (a?.intoNow) rows.push([t.labels.intoNow, a.intoNow]);
  if (a?.wine) rows.push([t.labels.wine, t.wine[a.wine]]);
  return (
    <li className="rounded-2xl border border-wine/10 bg-white/60 p-4">
      <p className="font-serif text-lg text-wine">
        {m.firstName || "+1"}
        {you ? <span className="ml-2 align-middle font-sans text-xs font-medium text-gold">{t.you}</span> : null}
        {m.withName ? <span className="ml-2 align-middle font-sans text-xs text-wine/50">{t.plusOne(m.withName)}</span> : null}
      </p>
      {rows.length > 0 ? (
        <dl className="mt-2 space-y-1 text-sm">
          {rows.map(([label, value]) => (
            <Row key={label} label={label} value={value} />
          ))}
        </dl>
      ) : you ? null : (
        <p className="mt-1 text-sm text-wine/50">{t.pending[day]}</p>
      )}
      {children}
    </li>
  );
}

function Picks({ page, venueName, t }: { page: TablePage; venueName: string; t: Copy }) {
  const wines = (Object.entries(page.wines) as [IntroWine, number][]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  return (
    <section className="overflow-hidden rounded-3xl border border-gold/30 bg-cream shadow-[0_20px_50px_rgba(43,13,18,0.06)]">
      <div className="bg-wine px-6 py-6 text-cream sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">{t.picksLabel}</p>
        <h2 className="mt-2 font-serif text-2xl font-medium sm:text-3xl">{t.picksTitle(venueName)}</h2>
        {page.picks && page.picks.length > 0 ? (
          <p className="mt-2 text-sm leading-relaxed text-cream/75">{t.picksLead(venueName)}</p>
        ) : null}
      </div>
      {page.picks === null ? (
        <p className="px-6 py-6 text-sm text-wine/70 sm:px-8">{t.picksSoon(venueName)}</p>
      ) : page.picks.length === 0 ? (
        <div className="px-6 py-6 sm:px-8">
          {wines.length > 0 ? (
            <p className="text-sm text-wine">
              <span className="text-wine/55">{t.tableDrinks}: </span>
              {wines.map(([w, n]) => `${n}× ${t.wine[w].toLowerCase()}`).join(", ")}
            </p>
          ) : null}
          <p className={`text-sm text-wine/70 ${wines.length > 0 ? "mt-2" : ""}`}>{t.askTeam(venueName)}</p>
        </div>
      ) : (
        <ol className="divide-y divide-wine/10">
          {page.picks.map((p, i) => (
            <Pick key={`${p.name}-${i}`} p={p} n={i + 1} t={t} />
          ))}
        </ol>
      )}
    </section>
  );
}

function Pick({ p, n, t }: { p: VenuePick; n: number; t: Copy }) {
  const tags = pickTags(p);
  return (
    <li className="flex gap-4 px-6 py-5 sm:px-8">
      <div className="flex flex-col items-center gap-2 pt-1">
        <span className="font-serif text-lg text-gold">{n}</span>
        <span aria-hidden className={`h-3 w-3 rounded-full ring-1 ring-wine/15 ${KIND_DOT[p.kind]}`} />
      </div>
      <div className="min-w-0 flex-1">
        {p.moment ? <p className="text-xs font-medium uppercase tracking-wide text-wine/50">{p.moment}</p> : null}
        <p className="mt-1 font-serif text-xl text-wine">{p.name}</p>
        {tags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs text-wine/70 ring-1 ring-wine/10">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        {p.why ? <p className="mt-3 text-sm leading-relaxed text-wine/80">{p.why}</p> : null}
        {p.goesWith ? (
          <div className="mt-3 rounded-xl bg-white/70 px-3.5 py-2.5 ring-1 ring-wine/10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold">
              {t.goesWith}
            </p>
            <p className="mt-0.5 font-serif text-base text-wine">{p.goesWith}</p>
          </div>
        ) : null}
      </div>
    </li>
  );
}

function Row({ label, value, href, note }: { label: string; value: string; href?: string; note?: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-28 shrink-0 text-wine/50">{label}</dt>
      <dd className="min-w-0 text-wine">
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="underline decoration-wine/30 underline-offset-4 hover:decoration-wine">
            {value}
          </a>
        ) : (
          value
        )}
        {note ? <span className="mt-0.5 block text-xs text-wine/55">{note}</span> : null}
      </dd>
    </div>
  );
}
