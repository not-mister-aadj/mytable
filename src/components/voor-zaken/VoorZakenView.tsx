import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MixerCalculator } from "@/components/voor-zaken/MixerCalculator";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-wine/45">
      {children}
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
          <SectionEyebrow>MyTable · voor zaken · de Mixer</SectionEyebrow>
          <h1 className="mt-3 font-serif text-3xl font-medium leading-[1.15] tracking-tight text-wine text-pretty sm:text-4xl">
            Wat je eraan overhoudt
          </h1>
          <p className="mt-4 text-[1.02rem] leading-relaxed text-wine/70 text-pretty">
            Elk glas bij de Mixer gaat onder jouw eigen kaartprijs de deur
            uit: de echte flesprijs gedeeld door het aantal glazen, met nog
            wat ervan af. Dat is geen korting die je weggeeft,{" "}
            <b className="font-semibold text-wine">
              het is een investering in vaste gasten
            </b>
            .
          </p>

          <div className="relative mt-6 aspect-[16/6] w-full overflow-hidden rounded-lg">
            <Image
              src="/girls-only/table-wine-laughing.jpg"
              alt="Gasten aan een Mixer-tafel, glas wijn in de hand, in gesprek"
              fill
              sizes="(min-width: 640px) 42rem, 100vw"
              className="object-cover"
              priority
            />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { n: "€0", l: "kosten om mee te doen" },
              { n: "2 uur", l: "per event" },
              { n: "16 tot 24", l: "gasten gemiddeld" },
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

        {/* De ruil */}
        <section className="mt-16">
          <h2 className="font-serif text-2xl text-wine">
            De ruil die je eigenlijk maakt
          </h2>
          <p className="mt-3 text-[1rem] leading-relaxed text-wine/60 text-pretty">
            Geen &ldquo;lagere marge.&rdquo; Je zet voor één event je
            glasprijs onder je eigen kaart, en krijgt daarvoor een zaal vol
            nieuwe gezichten terug. De vraag is niet of je iets weggeeft, dat
            doe je, de vraag is of wat ervoor terugkomt meer waard is.
          </p>
          <ul className="mt-5 space-y-3">
            {[
              <>
                <b className="font-semibold text-wine">Wat je weggeeft:</b>{" "}
                het verschil tussen jouw normale glasprijs en de
                Mixer-prijs, op elk glas dat tijdens dat event wordt
                geschonken.
              </>,
              <>
                <b className="font-semibold text-wine">
                  Wat je ervoor terugkrijgt:
                </b>{" "}
                gasten die je anders nooit had gevonden, een deel daarvan
                wordt vaste gast, tegen je volle prijs, jarenlang.
              </>,
              <>
                <b className="font-semibold text-wine">
                  Waarom het beter werkt dan adverteren:
                </b>{" "}
                een nieuwe klant via een advertentie kost geld, zonder
                garantie dat diegene ooit komt opdagen, laat staan het leuk
                vindt. Een Mixer-gast heeft bij jou al aan een event
                meegedaan voordat je er een cent aan hebt uitgegeven.
              </>,
            ].map((item, i) => (
              <li key={i} className="relative pl-5 text-[0.98rem] leading-relaxed text-wine/65">
                <span className="absolute left-0 top-[9px] h-1.5 w-1.5 rounded-full bg-gold" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Wie er aan tafel zit */}
        <section className="mt-16">
          <h2 className="font-serif text-2xl text-wine">
            Wie er aan tafel zit
          </h2>
          <p className="mt-3 text-[1rem] leading-relaxed text-wine/60 text-pretty">
            Onze wachtlijst is geen willekeurige groep, dit is wie er
            daadwerkelijk aanschuift. Cijfers uit onze eigen aanmeldingen,
            geen schatting.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-[0.8fr_1fr]">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg sm:aspect-auto sm:h-full">
              <Image
                src="/girls-only/wine-tasting-toast.jpg"
                alt="Gasten proosten met een glas wijn"
                fill
                sizes="(min-width: 640px) 16rem, 100vw"
                className="object-cover"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 self-start">
              {[
                { n: "89%", l: "is vrouw" },
                { n: "60%", l: "wil vooral nieuwe mensen ontmoeten" },
                { n: "51%", l: "komt uit Rotterdam zelf" },
                { n: "45%", l: "wil vooral nieuwe plekken ontdekken" },
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

        {/* Calculator */}
        <section className="mt-16">
          <h2 className="font-serif text-2xl text-wine">
            Reken je eigen cijfers door
          </h2>
          <p className="mt-3 text-[1rem] leading-relaxed text-wine/60 text-pretty">
            Vul je eigen getallen in. De standaardwaarden zijn een gemiddeld
            Mixer-event.
          </p>
          <MixerCalculator />
        </section>

        {/* Het cijfer dat er echt toe doet */}
        <section className="mt-16">
          <h2 className="font-serif text-2xl text-wine">
            Het cijfer dat er echt toe doet
          </h2>
          <p className="mt-3 text-[1rem] leading-relaxed text-wine/60 text-pretty">
            Niet het rendement bij je huidige inschatting, maar het
            terugkeerpercentage waarbij het event zichzelf terugbetaalt.
            Onder de vereiste terugkeer hierboven ("moeten er minstens
            terugkomen") zit je onder water, ook als niemand ooit
            terugkomt. Erboven is elke extra terugkerende gast pure winst.
          </p>
          <p className="mt-3 text-[1rem] leading-relaxed text-wine/60 text-pretty">
            Bij de standaardwaarden heb je minder dan 1 op de 20 gasten
            nodig die één keer terugkomen en normaal besteden, om terug te
            verdienen wat je dat event investeerde. WijnSpijs&rsquo; eigen
            ondervraagde restaurants zien 93,5% terugkeer, minstens één
            keer. Zelfs een fractie daarvan haalt bij de meeste zaken
            ruimschoots de quitte-grens.
          </p>
        </section>

        {/* Hoe je erin komt */}
        <section className="mt-16">
          <h2 className="font-serif text-2xl text-wine">Hoe je erin komt</h2>
          <p className="mt-3 text-[1rem] leading-relaxed text-wine/60 text-pretty">
            Geen inschrijfformulier, geen wachtlijst vol restaurants die
            erop staan te springen. Gewoon een kort gesprek.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                num: "01",
                title: "Kennismaking",
                body: "Wij nemen contact op, of jij met ons. Geen verplichting, we kijken gewoon of het past bij jouw zaak.",
              },
              {
                num: "02",
                title: "Eén proefevent",
                body: "Een eerste Mixer, kleine groep. Jij ziet zelf hoe het loopt voordat er iets vastligt.",
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

        <p className="mt-16 border-t border-wine/12 pt-8 text-center font-serif text-lg italic text-wine/70">
          Je levert geen marge in. Je koopt vaste gasten, goedkoper dan een
          advertentie ooit zou kunnen.
        </p>
      </div>

      <Footer dict={footerDict} locale={locale} />
    </div>
  );
}
