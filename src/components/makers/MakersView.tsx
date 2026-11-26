import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MakerForm } from "@/components/makers/MakerForm";
import { makerCopy } from "@/lib/makers/copy";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";

function SectionTitle({ children, intro }: { children: React.ReactNode; intro?: string }) {
  return (
    <div>
      <h2 className="font-serif text-[1.7rem] leading-tight text-wine">{children}</h2>
      {intro ? <p className="mt-2 leading-relaxed text-wine/60">{intro}</p> : null}
    </div>
  );
}

/** /makers: for people who photograph food and places. Only linked from the footer. */
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

      <div className="mx-auto max-w-2xl px-5 pb-20 pt-[7.25rem] sm:px-8 sm:pt-36">
        <header>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-burgundy/80">{t.eyebrow}</div>
          <h1 className="mt-3 font-serif text-[2.2rem] font-medium leading-[1.1] tracking-tight text-wine text-pretty sm:text-5xl">
            {t.title}
          </h1>
          <p className="mt-4 text-[1.05rem] leading-relaxed text-wine/70 text-pretty">{t.intro}</p>
          <div className="mt-7">
            <a
              href="#aanmelden"
              className="cta-lift inline-flex min-h-12 items-center rounded-full bg-burgundy px-7 text-[0.98rem] font-semibold text-white transition hover:bg-burgundy/90"
            >
              {t.cta}
            </a>
          </div>
          <div className="relative mt-8 aspect-[16/8] w-full overflow-hidden rounded-xl">
            <Image
              src="/girls-only/phone-moment.jpg"
              alt=""
              fill
              sizes="(min-width: 640px) 42rem, 100vw"
              className="object-cover"
              priority
            />
          </div>
        </header>

        <section className="mt-16">
          <SectionTitle>{t.stepsTitle}</SectionTitle>
          <ol className="mt-6 grid gap-3 sm:grid-cols-3">
            {t.steps.map((s, i) => (
              <li key={s.title} className="rounded-xl border border-wine/10 px-4 py-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-burgundy text-sm font-semibold text-white">{i + 1}</div>
                <div className="mt-3 font-serif text-lg text-wine">{s.title}</div>
                <p className="mt-1 text-[0.92rem] leading-snug text-wine/65">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16">
          <SectionTitle intro={t.waysIntro}>{t.waysTitle}</SectionTitle>
          <div className="mt-6 divide-y divide-wine/10 border-y border-wine/10">
            {t.ways.map((w) => (
              <div key={w.title} className="flex flex-col gap-1 py-4 sm:flex-row sm:gap-4">
                <div className="shrink-0 font-serif text-lg text-burgundy sm:w-40">{w.title}</div>
                <p className="leading-relaxed text-wine/70">{w.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <SectionTitle>{t.getTitle}</SectionTitle>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {t.get.map((g) => (
              <div key={g.title} className="rounded-xl border border-wine/10 bg-beige/50 px-5 py-4">
                <div className="font-serif text-[1.15rem] text-wine">{g.title}</div>
                <p className="mt-1 text-[0.93rem] leading-snug text-wine/65">{g.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <SectionTitle>{t.faqTitle}</SectionTitle>
          <div className="mt-4 divide-y divide-wine/10 border-y border-wine/10">
            {t.faq.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-wine">
                  {f.q}
                  <span aria-hidden className="text-xl leading-none text-wine/40 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-2 leading-relaxed text-wine/70">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="aanmelden" className="mt-16 scroll-mt-28">
          <SectionTitle intro={t.form.intro}>{t.form.title}</SectionTitle>
          <MakerForm locale={locale} />
        </section>
      </div>

      <Footer dict={footerDict} locale={locale} />
    </div>
  );
}
