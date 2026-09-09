import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-wine/45">
      {children}
    </div>
  );
}

/** Drie kolommen tekst, dezelfde opzet als de slides in de pitchdeck. */
function ThreeUp({
  items,
}: {
  items: readonly { title: string; body: string }[];
}) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.title} className="border-t border-wine/25 pt-3">
          <h3 className="font-semibold text-[0.98rem] text-wine">
            {item.title}
          </h3>
          <p className="mt-1.5 text-[0.94rem] leading-relaxed text-wine/60">
            {item.body}
          </p>
        </div>
      ))}
    </div>
  );
}

export function VoorZakenView({
  locale,
  headerDict,
  footerDict,
}: {
  locale: Locale;
  headerDict: Dictionary["header"];
  footerDict: Dictionary["footer"];
}) {
  return (
    <div className="overflow-x-clip bg-white">
      <Header dict={headerDict} locale={locale} />

      <div className="mx-auto max-w-2xl px-5 pb-20 pt-[7.25rem] sm:px-8 sm:pt-36">
        {/* Hero */}
        <header>
          <SectionEyebrow>MyTable · voor wijnbars en restaurants</SectionEyebrow>
          <h1 className="mt-3 font-serif text-3xl font-medium leading-[1.15] tracking-tight text-wine text-pretty sm:text-4xl">
            Een volle zaak op je rustigste moment
          </h1>
          <p className="mt-4 text-[1.02rem] leading-relaxed text-wine/70 text-pretty">
            Wij brengen de gasten.{" "}
            <b className="font-semibold text-wine">Jij houdt je prijzen.</b>
          </p>

          <div className="relative mt-6 aspect-[16/6] w-full overflow-hidden rounded-lg">
            <Image
              src="/girls-only/table-wine-laughing.jpg"
              alt="Gasten aan een MyTable-tafel, glas wijn in de hand, in gesprek"
              fill
              sizes="(min-width: 640px) 42rem, 100vw"
              className="object-cover"
              priority
            />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { n: "€0", l: "kosten om mee te doen" },
              { n: "2-3 uur", l: "per event" },
              { n: "0", l: "contracten" },
            ].map((stat) => (
              <div
                key={stat.l}
                className="rounded-md border border-wine/10 bg-beige/60 px-3 py-3 text-center"
              >
                <div className="font-serif text-xl text-wine">{stat.n}</div>
                <div className="mt-1 text-[10.5px] uppercase leading-tight tracking-[0.04em] text-wine/45">
                  {stat.l}
                </div>
              </div>
            ))}
          </div>
        </header>

        {/* Het aanbod */}
        <section className="mt-16">
          <h2 className="font-serif text-2xl text-wine">Het aanbod</h2>
          <p className="mt-3 text-[1rem] leading-relaxed text-wine/60 text-pretty">
            Wij vullen een van je rustige momenten met volle tafels. Vaak een
            zondagmiddag voor de piek van vier uur, een woensdagavond, jij
            kiest. Vast menu, vier wijnen, jouw prijzen. Gasten betalen ons
            voor hun plek,{" "}
            <b className="font-semibold text-wine">jij betaalt niets</b>.
          </p>
        </section>

        {/* Wie er aan tafel zit */}
        <section className="mt-16">
          <h2 className="font-serif text-2xl text-wine">Wie er aan tafel zit</h2>
          <p className="mt-3 text-[1rem] leading-relaxed text-wine/60 text-pretty">
            Cijfers uit onze eigen wachtlijst, geen schatting.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-[0.8fr_1fr]">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg sm:aspect-auto sm:h-full">
              <Image
                src="/girls-only/wine-tasting-toast.jpg"
                alt="Een volle tafel proost tijdens een MyTable-proeverij"
                fill
                sizes="(min-width: 640px) 16rem, 100vw"
                className="object-cover"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 self-start">
              {[
                { n: "84%", l: "is vrouw, meestal tussen de 25 en 44" },
                { n: "62%", l: "komt alleen en zoekt een tafel" },
                { n: "60%", l: "komt voor een zaak die ze nog niet kennen" },
              ].map((stat) => (
                <div
                  key={stat.l}
                  className="rounded-md border border-wine/10 bg-beige/60 px-3 py-3"
                >
                  <div className="font-serif text-xl text-wine">{stat.n}</div>
                  <div className="mt-1 text-[11px] leading-snug text-wine/50">
                    {stat.l}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-4 text-[12.5px] text-wine/40">
            Bron: MyTable-wachtlijst, Rotterdam en Den Haag.
          </p>
        </section>

        {/* Meer omzet per tafel */}
        <section className="mt-16">
          <h2 className="font-serif text-2xl text-wine">Meer omzet per tafel</h2>
          <ThreeUp
            items={[
              {
                title: "Wij bouwen de tafels",
                body: "Wij zetten de juiste mensen bij elkaar. Klikt het, dan blijft de tafel langer zitten en bestelt door.",
              },
              {
                title: "Een kleinere kaart",
                body: "Vier wijnen, met per wijn een bite als suggestie. Niemand zit in de kaart te zoeken.",
              },
              {
                title: "Minder flessen open",
                body: "De hele tafel drinkt dezelfde vier wijnen. Die flessen gaan leeg, niet half terug de koeling in.",
              },
            ]}
          />
        </section>

        {/* Wat het je kost */}
        <section className="mt-16">
          <h2 className="font-serif text-2xl text-wine">
            Wat het jou aan werk kost
          </h2>
          <ThreeUp
            items={[
              {
                title: "Vier wijnen kiezen",
                body: "Uit je eigen kaart. Meer is het niet.",
              },
              {
                title: "Eén vast menu",
                body: "Iedereen eet hetzelfde. Rustig in de keuken.",
              },
              {
                title: "Gewoon uitserveren",
                body: "Je bedient de tafel zoals elke andere tafel.",
              },
            ]}
          />
        </section>

        {/* Wat het oplevert */}
        <section className="mt-16">
          <h2 className="font-serif text-2xl text-wine">Wat het oplevert</h2>
          <ThreeUp
            items={[
              {
                title: "Nieuwe gezichten",
                body: "Gasten die je zaak nog niet kenden.",
              },
              {
                title: "Ze komen terug",
                body: "Bevalt het, dan komen ze terug met eigen gezelschap.",
              },
              {
                title: "Zonder adverteren",
                body: "Geen campagne, geen kortingsactie om ze binnen te krijgen.",
              },
            ]}
          />
        </section>

        {/* En wat je niet kwijtraakt */}
        <section className="mt-16">
          <h2 className="font-serif text-2xl text-wine">
            En wat je niet kwijtraakt
          </h2>
          <ThreeUp
            items={[
              {
                title: "Je eigen gasten",
                body: "Jij bepaalt hoeveel tafels je vrijgeeft.",
              },
              {
                title: "Je prijzen",
                body: "Geen korting, geen actie.",
              },
              {
                title: "Je agenda",
                body: "Geen contract. Bevalt het niet, dan stopt het na één keer.",
              },
            ]}
          />
        </section>

        {/* Hoe je erin komt */}
        <section className="mt-16">
          <h2 className="font-serif text-2xl text-wine">Hoe je erin komt</h2>
          <p className="mt-3 text-[1rem] leading-relaxed text-wine/60 text-pretty">
            Geen inschrijfformulier, geen wachtlijst vol zaken die erop staan
            te springen. Gewoon een kort gesprek.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                num: "01",
                title: "Bellen of langskomen",
                body: "Wat jou het beste uitkomt. Dan kijken we samen of het bij je zaak past.",
              },
              {
                num: "02",
                title: "Eén avond",
                body: "Jij kiest de datum en het aantal tafels. Je ziet zelf hoe het loopt voordat er iets vastligt.",
              },
              {
                num: "03",
                title: "Vaste plek",
                body: "Werkt het? Dan plannen we het structureel in, op het moment dat voor jou het rustigst uitkomt.",
              },
            ].map((step) => (
              <div key={step.num} className="border-t border-wine/12 pt-3">
                <div className="font-mono text-[11px] font-semibold text-gold">
                  {step.num}
                </div>
                <h3 className="mt-1 font-serif text-lg text-wine">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-[0.92rem] leading-relaxed text-wine/55">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Slot */}
        <section className="mt-16 border-t border-wine/12 pt-8 text-center">
          <p className="font-serif text-lg italic text-wine/70">
            Zeg ja op één keer. Bevalt het, dan plannen we de volgende.
          </p>
          <a
            href="mailto:info@mytable.club?subject=Volle%20tafels%20op%20mijn%20stilste%20moment"
            className="mt-5 inline-block rounded-md bg-wine px-6 py-3 text-[0.95rem] font-semibold text-cream transition-opacity hover:opacity-90"
          >
            Wanneer komt het je uit?
          </a>
        </section>
      </div>

      <Footer dict={footerDict} locale={locale} />
    </div>
  );
}
