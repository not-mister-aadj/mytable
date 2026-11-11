import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AmbassadorCta } from "@/components/ambassadors/AmbassadorCta";
import { AMBASSADOR_ROLES, ambassadorCopy } from "@/lib/ambassadors/copy";
import { ambassadorsApplyPath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";

function SectionTitle({ children, intro }: { children: React.ReactNode; intro?: string }) {
  return (
    <div>
      <h2 className="font-serif text-[1.7rem] leading-tight text-wine">{children}</h2>
      {intro ? <p className="mt-2 text-wine/60">{intro}</p> : null}
    </div>
  );
}

/** /ambassadors: the programme, built like the big student ambassador pages; the form is on its own page. */
export function AmbassadorsView({
  locale,
  headerDict,
  footerDict,
}: {
  locale: Locale;
  headerDict: Dictionary["header"];
  footerDict: Dictionary["footer"];
}) {
  const t = ambassadorCopy(locale);
  const apply = ambassadorsApplyPath(locale);
  return (
    <div className="overflow-x-clip bg-white">
      <Header dict={headerDict} locale={locale} />

      <div className="mx-auto max-w-2xl px-5 pb-20 pt-[7.25rem] sm:px-8 sm:pt-36">
        <header>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-burgundy/80">{t.eyebrow}</div>
          <h1 className="mt-3 font-serif text-[2.2rem] font-medium leading-[1.1] tracking-tight text-wine text-pretty sm:text-5xl">
            {t.title}
          </h1>
          <p className="mt-4 text-[1.05rem] leading-relaxed text-wine/70 text-pretty">{t.intro}</p>
          <div className="mt-7">
            <AmbassadorCta href={apply} label={t.cta} location="hero" />
          </div>
          <ul className="mt-4 flex flex-wrap gap-2">
            {t.facts.map((f) => (
              <li key={f} className="rounded-full bg-beige px-3 py-1 text-[0.82rem] text-wine/70">
                {f}
              </li>
            ))}
          </ul>
          <div className="relative mt-8 aspect-[16/8] w-full overflow-hidden rounded-xl">
            <Image
              src="/girls-only/group-bar.jpg"
              alt={t.imageAlt}
              fill
              sizes="(min-width: 640px) 42rem, 100vw"
              className="object-cover"
              priority
            />
          </div>
        </header>

        <section className="mt-16">
          <SectionTitle intro={t.perksIntro}>{t.perksTitle}</SectionTitle>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {t.perks.map((p) => (
              <div key={p.title} className="rounded-xl border border-wine/10 bg-beige/50 px-5 py-4">
                <div className="font-serif text-[1.15rem] text-wine">{p.title}</div>
                <p className="mt-1 text-[0.93rem] leading-snug text-wine/65">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <SectionTitle intro={t.rolesIntro}>{t.rolesTitle}</SectionTitle>
          <div className="mt-6 divide-y divide-wine/10 border-y border-wine/10">
            {AMBASSADOR_ROLES.map((id) => (
              <div key={id} className="flex gap-4 py-4">
                <div className="w-24 shrink-0 font-serif text-lg text-burgundy">{t.roles[id].title}</div>
                <p className="leading-relaxed text-wine/70">{t.roles[id].body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <SectionTitle intro={t.semesterIntro}>{t.semesterTitle}</SectionTitle>
          <ol className="relative mt-6 space-y-6 border-l border-burgundy/20 pl-6">
            {t.semester.map((s, i) => (
              <li key={s.title} className="relative">
                <span aria-hidden className="absolute -left-[1.85rem] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-burgundy" />
                <div className="font-semibold text-wine">{i + 1} · {s.title}</div>
                <p className="mt-1 leading-relaxed text-wine/65">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16">
          <SectionTitle>{t.whoTitle}</SectionTitle>
          <ul className="mt-5 space-y-2.5">
            {t.who.map((w) => (
              <li key={w} className="flex gap-3 leading-relaxed text-wine/75">
                <svg viewBox="0 0 20 20" aria-hidden className="mt-1 h-4 w-4 shrink-0 text-burgundy" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {w}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16">
          <SectionTitle>{t.stepsTitle}</SectionTitle>
          <ol className="mt-6 grid gap-3 sm:grid-cols-3">
            {t.steps.map((s, i) => (
              <li key={s.title} className="rounded-xl border border-wine/10 px-4 py-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-burgundy font-semibold text-white text-sm">{i + 1}</div>
                <div className="mt-3 font-serif text-lg text-wine">{s.title}</div>
                <p className="mt-1 text-[0.92rem] leading-snug text-wine/65">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16">
          <SectionTitle>{t.faqTitle}</SectionTitle>
          <div className="mt-4 divide-y divide-wine/10 border-y border-wine/10">
            {t.faq.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-wine">
                  {f.q}
                  <span aria-hidden className="text-xl leading-none text-wine/40 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 leading-relaxed text-wine/70">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-2xl bg-wine px-6 py-9 text-center text-cream sm:px-10">
          <h2 className="font-serif text-[1.7rem] leading-tight">{t.closingTitle}</h2>
          <p className="mt-2 text-cream/75">{t.closingBody}</p>
          <div className="mt-6">
            <AmbassadorCta href={apply} label={t.cta} location="closing" />
          </div>
        </section>
      </div>

      <Footer dict={footerDict} locale={locale} />
    </div>
  );
}
