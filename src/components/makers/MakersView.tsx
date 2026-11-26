import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MakerCalculator } from "@/components/makers/MakerCalculator";
import { MakerForm } from "@/components/makers/MakerForm";
import { MakerStickyCta } from "@/components/makers/MakerStickyCta";
import { makerCopy } from "@/lib/makers/copy";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";

function Eyebrow({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return (
    <div className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${light ? "text-cream/70" : "text-burgundy/80"}`}>{children}</div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-serif text-[2rem] leading-[1.1] tracking-tight text-wine text-balance sm:text-[2.6rem]">{children}</h2>;
}

/** /makers: for people who capture food, places and community. Only linked from the footer. */
export function MakersView({
  locale,
  headerDict,
  footerDict,
}: {
  locale: Locale;
  headerDict: Dictionary["header"];
  footerDict: Dictionary["footer"];
}) {
  const t = makerCopy(locale);
  return (
    <div className="overflow-x-clip bg-white">
      <Header dict={headerDict} locale={locale} />

      {/* Hero: the image carries the page, the words sit on it. */}
      <section className="pt-[4.25rem] sm:px-5 sm:pt-24">
        <div id="maker-hero" className="relative mx-auto max-w-6xl overflow-hidden sm:rounded-[1.75rem]">
          <Image
            src="/girls-only/phone-moment.jpg"
            alt=""
            fill
            sizes="(min-width: 1152px) 72rem, 100vw"
            className="object-cover"
            priority
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#1c0609]/95 via-[#1c0609]/55 to-[#1c0609]/10" />
          <div className="relative flex min-h-[calc(100svh-4.25rem)] max-h-[44rem] flex-col justify-end px-5 pb-9 pt-32 sm:min-h-[38rem] sm:px-12 sm:pb-14">
            <Eyebrow light>{t.eyebrow}</Eyebrow>
            <h1 className="mt-4 max-w-3xl font-serif text-[2.6rem] font-medium leading-[1.02] tracking-tight text-cream text-balance sm:text-[4.2rem]">
              {t.title}
            </h1>
            <p className="mt-5 max-w-xl text-[1.05rem] leading-relaxed text-cream/80 text-pretty sm:text-[1.15rem]">{t.intro}</p>
            <div className="mt-8 flex flex-col items-stretch gap-y-4 sm:flex-row sm:items-center sm:gap-x-6">
              <a
                href="#kennismaken"
                className="cta-lift inline-flex min-h-[3.25rem] items-center justify-center rounded-full bg-cream px-7 text-[0.98rem] font-semibold text-wine transition hover:bg-white"
              >
                {t.cta}
              </a>
              <a href="#zo-werkt-het" className="text-center text-[0.95rem] font-semibold text-cream/85 underline-offset-4 hover:underline">
                {t.ctaSecondary}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* The offer in three numbers. */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8">
        <dl className="grid grid-cols-3 divide-x divide-wine/10 border-b border-wine/10">
          {t.stats.map((s) => (
            <div key={s.value} className="px-2.5 py-6 first:pl-0 last:pr-0 sm:px-8 sm:py-10">
              <dt className="font-serif text-[1.35rem] leading-none tracking-tight text-burgundy sm:text-[3.2rem]">{s.value}</dt>
              <dd className="mt-2 text-[0.78rem] leading-snug text-wine/60 sm:text-[0.95rem]">{s.label}</dd>
            </div>
          ))}
        </dl>
        <div className="scrollbar-none -mx-5 flex items-center gap-2 overflow-x-auto px-5 py-5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:py-6">
          <span className="mr-1 shrink-0 text-[0.85rem] text-wine/50">{t.forWhoTitle}</span>
          {t.forWho.map((w) => (
            <span key={w} className="shrink-0 rounded-full border border-wine/12 px-3.5 py-1.5 text-[0.85rem] text-wine/75">
              {w}
            </span>
          ))}
        </div>
      </section>

      {/* What makers get: the team, the portfolio, the calls, the prizes. */}
      <section className="mx-auto mt-16 max-w-6xl px-5 sm:mt-24 sm:px-8">
        <div className="max-w-2xl">
          <H2>{t.communityTitle}</H2>
          <p className="mt-3 text-[1.05rem] leading-relaxed text-wine/60">{t.communityIntro}</p>
        </div>
        <div className="scrollbar-none -mx-5 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:mt-10 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0">
          {t.community.map((c, i) => (
            <div
              key={c.title}
              className="w-[78%] shrink-0 snap-start scroll-ml-5 rounded-[1.5rem] bg-beige/60 px-6 py-7 sm:w-auto sm:px-9 sm:py-10"
            >
              <div className="font-serif text-[0.95rem] text-burgundy/50">{String(i + 1).padStart(2, "0")}</div>
              <div className="mt-6 font-serif text-[1.6rem] leading-tight text-wine sm:mt-8 sm:text-[1.9rem]">{c.title}</div>
              <p className="mt-3 max-w-sm leading-relaxed text-wine/65">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps. */}
      <section id="zo-werkt-het" className="mx-auto mt-16 max-w-6xl scroll-mt-28 px-5 sm:mt-24 sm:px-8">
        <H2>{t.stepsTitle}</H2>
        <ol className="mt-8 grid sm:mt-10 sm:grid-cols-3 sm:gap-8">
          {t.steps.map((s, i) => (
            <li key={s.title} className="flex gap-5 border-t border-wine/15 py-5 sm:block sm:py-0 sm:pt-6">
              <div className="w-10 shrink-0 font-serif text-[1.6rem] leading-none text-burgundy/35 sm:w-auto sm:text-[2.4rem]">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div>
                <div className="font-serif text-[1.3rem] leading-tight text-wine sm:mt-4 sm:text-[1.45rem]">{s.title}</div>
                <p className="mt-1.5 leading-relaxed text-wine/65 sm:mt-2">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* How they work with us. */}
      <section className="mx-auto mt-16 max-w-6xl px-5 sm:mt-24 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-[1fr_1.4fr] sm:gap-16">
          <div>
            <H2>{t.waysTitle}</H2>
            <p className="mt-4 leading-relaxed text-wine/60">{t.waysIntro}</p>
          </div>
          <div className="divide-y divide-wine/10 border-y border-wine/10">
            {t.ways.map((w) => (
              <div key={w.title} className="py-6">
                <div className="font-serif text-[1.35rem] text-wine">{w.title}</div>
                <p className="mt-1.5 leading-relaxed text-wine/65">{w.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The extra: what a maker earns, and what their bookers get. */}
      <section className="mx-auto mt-16 max-w-6xl px-5 sm:mt-24 sm:px-8">
        <MakerCalculator locale={locale} />
        <div className="mt-12 max-w-2xl">
          <h3 className="font-serif text-[1.7rem] leading-tight text-wine">{t.giftTitle}</h3>
          <p className="mt-2 leading-relaxed text-wine/60">{t.giftIntro}</p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4">
          {t.gifts.map((g) => (
            <div key={g.tag} className="rounded-[1.5rem] border border-wine/10 px-6 py-6 sm:px-9 sm:py-7">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-burgundy/80">{g.tag}</div>
              <div className="mt-3 font-serif text-[1.5rem] leading-tight text-wine">{g.title}</div>
              <p className="mt-2 max-w-sm leading-relaxed text-wine/65">{g.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Questions. */}
      <section className="mx-auto mt-16 max-w-6xl px-5 sm:mt-24 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-[1fr_1.4fr] sm:gap-16">
          <H2>{t.faqTitle}</H2>
          <div className="divide-y divide-wine/10 border-y border-wine/10">
            {t.faq.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[1.02rem] font-semibold text-wine">
                  {f.q}
                  <span aria-hidden className="text-2xl font-light leading-none text-wine/40 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-xl leading-relaxed text-wine/70">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* First a short call. */}
      <section id="kennismaken" className="mx-auto mt-16 max-w-6xl scroll-mt-24 px-5 pb-24 sm:mt-24 sm:px-8">
        <div className="grid gap-10 rounded-[1.75rem] bg-beige/60 px-6 py-10 sm:grid-cols-[1fr_1.4fr] sm:gap-16 sm:px-12 sm:py-14">
          <div>
            <H2>{t.meetTitle}</H2>
            <p className="mt-4 leading-relaxed text-wine/65">{t.meetIntro}</p>
            <ul className="mt-6 space-y-2.5">
              {t.meetPoints.map((p) => (
                <li key={p} className="flex gap-3 text-wine/75">
                  <svg viewBox="0 0 20 20" aria-hidden className="mt-1 h-4 w-4 shrink-0 text-burgundy" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <MakerForm locale={locale} />
        </div>
      </section>

      <MakerStickyCta label={t.cta} />
      <Footer dict={footerDict} locale={locale} />
    </div>
  );
}
