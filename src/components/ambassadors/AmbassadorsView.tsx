import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AmbassadorForm } from "@/components/ambassadors/AmbassadorForm";
import { AMBASSADOR_ROLES, ambassadorCopy } from "@/lib/ambassadors/copy";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-wine/45">{children}</div>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-serif text-2xl text-wine">{children}</h2>;
}

/** /ambassadors: what the role is, what you get, and the application form. */
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
  return (
    <div className="overflow-x-clip bg-white">
      <Header dict={headerDict} locale={locale} />

      <div className="mx-auto max-w-2xl px-5 pb-20 pt-[7.25rem] sm:px-8 sm:pt-36">
        <header>
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <h1 className="mt-3 font-serif text-3xl font-medium leading-[1.15] tracking-tight text-wine text-pretty sm:text-4xl">
            {t.title}
          </h1>
          <p className="mt-4 text-[1.02rem] leading-relaxed text-wine/70 text-pretty">{t.intro}</p>
          <a
            href="#aanmelden"
            className="cta-lift mt-6 inline-flex min-h-11 items-center rounded-full bg-burgundy px-6 text-[0.95rem] font-semibold text-white transition hover:bg-burgundy/90"
          >
            {t.cta}
          </a>
          <div className="relative mt-8 aspect-[16/7] w-full overflow-hidden rounded-lg">
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

        <section className="mt-14">
          <SectionTitle>{t.whatTitle}</SectionTitle>
          <p className="mt-3 leading-relaxed text-wine/70 text-pretty">{t.whatBody}</p>
        </section>

        <section className="mt-14">
          <SectionTitle>{t.rolesTitle}</SectionTitle>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {AMBASSADOR_ROLES.map((id) => (
              <div key={id} className="rounded-lg border border-wine/10 bg-beige/50 px-4 py-4">
                <div className="font-serif text-lg text-wine">{t.roles[id].title}</div>
                <p className="mt-1.5 text-[0.92rem] leading-snug text-wine/65">{t.roles[id].body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <SectionTitle>{t.getTitle}</SectionTitle>
          <ul className="mt-5 space-y-4">
            {t.get.map((g) => (
              <li key={g.title} className="flex gap-3">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-burgundy" />
                <p className="leading-relaxed text-wine/70">
                  <b className="font-semibold text-wine">{g.title}.</b> {g.body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14">
          <SectionTitle>{t.milestonesTitle}</SectionTitle>
          <p className="mt-3 leading-relaxed text-wine/70">{t.milestonesBody}</p>
          <ol className="mt-5 space-y-2">
            {t.milestones.map((m, i) => (
              <li key={m} className="flex items-center gap-3 rounded-md border border-wine/10 px-4 py-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-burgundy/10 font-serif text-burgundy">
                  {i + 1}
                </span>
                <span className="text-[0.95rem] text-wine">{m}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14">
          <SectionTitle>{t.whoTitle}</SectionTitle>
          <ul className="mt-4 space-y-2">
            {t.who.map((w) => (
              <li key={w} className="flex gap-3 leading-relaxed text-wine/70">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-wine/30" />
                {w}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14">
          <SectionTitle>{t.stepsTitle}</SectionTitle>
          <ol className="mt-5 grid gap-3 sm:grid-cols-3">
            {t.steps.map((s, i) => (
              <li key={s.title} className="rounded-lg border border-wine/10 px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-burgundy/80">{i + 1}</div>
                <div className="mt-1 font-serif text-lg text-wine">{s.title}</div>
                <p className="mt-1 text-[0.92rem] leading-snug text-wine/65">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="aanmelden" className="mt-16 scroll-mt-28 rounded-2xl border border-wine/10 bg-beige/40 px-5 py-7 sm:px-8">
          <SectionTitle>{t.form.title}</SectionTitle>
          <p className="mt-2 text-wine/65">{t.form.intro}</p>
          <AmbassadorForm locale={locale} />
        </section>

        <section className="mt-14">
          <SectionTitle>{t.faqTitle}</SectionTitle>
          <dl className="mt-4 divide-y divide-wine/10">
            {t.faq.map((f) => (
              <div key={f.q} className="py-4">
                <dt className="font-semibold text-wine">{f.q}</dt>
                <dd className="mt-1 leading-relaxed text-wine/70">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <Footer dict={footerDict} locale={locale} />
    </div>
  );
}
