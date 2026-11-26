import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MakerCalculator } from "@/components/makers/MakerCalculator";
import { MakerForm } from "@/components/makers/MakerForm";
import { MakerStickyCta } from "@/components/makers/MakerStickyCta";
import { SundayTableSectionNav } from "@/components/sunday-table-lp/SundayTableSectionNav";
import { makerCopy } from "@/lib/makers/copy";
import { absoluteUrl } from "@/lib/seo/site";
import { makersPath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";

const icon = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** Team, camera, euro: for the three facts under the photo. */
const FACT_ICONS = [
  <svg key="team" {...icon} aria-hidden>
    <circle cx="9" cy="8" r="3" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    <path d="M15 14.5c2.8.3 5 2.6 5 5.5" />
  </svg>,
  <svg key="camera" {...icon} aria-hidden>
    <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>,
  <svg key="euro" {...icon} aria-hidden>
    <path d="M17 6.5A7 7 0 1 0 17 17.5" />
    <path d="M4 10.5h9M4 13.5h9" />
  </svg>,
];

/** Team, glass, portfolio, calls, prize: for "Wat je krijgt". */
const COMMUNITY_ICONS = [
  FACT_ICONS[0],
  <svg key="glass" {...icon} aria-hidden>
    <path d="M7 3h10l-1 7a4 4 0 0 1-8 0z" />
    <path d="M12 14v6" />
    <path d="M8 21h8" />
  </svg>,
  FACT_ICONS[1],
  <svg key="call" {...icon} aria-hidden>
    <rect x="3" y="6" width="13" height="12" rx="2" />
    <path d="M16 10l5-3v10l-5-3" />
  </svg>,
  <svg key="prize" {...icon} aria-hidden>
    <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
    <path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4" />
    <path d="M12 13v4M9 20h6" />
  </svg>,
];

function SectionHead({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">{eyebrow}</p>
      <h2 className="mt-3 max-w-xl font-serif text-2xl font-medium tracking-tight text-wine sm:text-3xl">{title}</h2>
      {intro ? <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-wine/60">{intro}</p> : null}
    </>
  );
}

const card = "rounded-[1.5rem] border border-wine/10 bg-white/70 shadow-[0_20px_50px_rgba(43,13,18,0.06)]";

/** /makers, in the style of the Sunday Social date pages. Only linked from the footer. */
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
    <div className="overflow-x-clip bg-cream">
      <Header dict={headerDict} locale={locale} />

      <section className="pb-28 pt-24 sm:pt-32 lg:pb-20">
        <SundayTableSectionNav
          singleColumn
          locale={locale}
          shareUrl={absoluteUrl(makersPath(locale))}
          shareLabel={t.nav.share}
          copiedLabel={t.nav.copied}
          items={[
            { id: "maker-hero", label: t.nav.overview },
            { id: "wat-je-krijgt", label: t.nav.get },
            { id: "zo-werkt-het", label: t.nav.how },
            { id: "verdienen", label: t.nav.earn },
            { id: "kennismaken", label: t.nav.meet },
            { id: "vragen", label: t.nav.faq },
          ]}
        />
        <div className="mx-auto max-w-lg px-5 sm:px-6 lg:max-w-3xl">
          {/* What it is, then the photo and three facts. */}
          <div id="maker-hero" className="min-w-0 scroll-mt-40">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">{t.eyebrow}</p>
            <h1 className="mt-2 font-serif text-[2rem] font-medium leading-[1.05] tracking-tight text-wine text-balance sm:text-[2.75rem]">
              {t.title}
            </h1>
            <p className="mt-2 text-base font-medium text-wine/90 sm:text-lg">{t.heroMeta}</p>
            <div className="h-4" />
            <div className="relative aspect-[16/10] overflow-hidden rounded-[1.75rem] shadow-[0_24px_60px_rgba(43,13,18,0.18)] sm:aspect-[4/3]">
              <Image src="/girls-only/phone-moment.jpg" alt="" fill priority sizes="(max-width: 1024px) 100vw, 640px" className="object-cover" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#14060a]/50 to-transparent" />
              <span className="absolute left-4 top-4 z-10 inline-flex items-center rounded-full bg-gold px-3.5 py-2 text-xs font-semibold uppercase tracking-wide text-wine backdrop-blur-sm">
                {t.badge}
              </span>
            </div>
            <ul className="mt-4 grid grid-cols-3 gap-2 text-center">
              {t.quickFacts.map((fact, i) => (
                <li key={fact} className="flex flex-col items-center gap-1.5 text-xs leading-snug text-wine/75">
                  <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full bg-burgundy/[0.07] text-burgundy">
                    {FACT_ICONS[i % FACT_ICONS.length]}
                  </span>
                  {fact}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[0.98rem] leading-relaxed text-wine/70">{t.intro}</p>
            <a
              href="#kennismaken"
              className="cta-lift cta-lift-burgundy mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-burgundy px-7 text-[0.98rem] font-semibold text-cream shadow-[0_10px_26px_rgba(90,15,27,0.25)] hover:bg-wine sm:w-auto"
            >
              {t.cta}
            </a>
          </div>

          {/* The rest of the story. */}
          <div className="min-w-0">
            <div id="wat-je-krijgt" className="mt-10 scroll-mt-40 border-t border-wine/10 pt-10">
              <SectionHead eyebrow={t.communityEyebrow} title={t.communityTitle} intro={t.communityIntro} />
              <ul className={`mt-6 divide-y divide-wine/10 px-5 sm:px-7 ${card}`}>
                {t.community.map((c, i) => (
                  <li key={c.title} className="flex gap-4 py-5">
                    <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-burgundy/[0.07] text-burgundy">
                      {COMMUNITY_ICONS[i % COMMUNITY_ICONS.length]}
                    </span>
                    <div>
                      <p className="font-serif text-lg font-medium tracking-tight text-wine">{c.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-wine/60">{c.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div id="zo-werkt-het" className="mt-10 scroll-mt-40 border-t border-wine/10 pt-10">
              <SectionHead eyebrow={t.stepsEyebrow} title={t.stepsTitle} />
              <ol className="mt-6 space-y-5">
                {t.steps.map((s, i) => (
                  <li key={s.title} className="flex gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-burgundy text-sm font-semibold text-cream">{i + 1}</span>
                    <div className="pt-1">
                      <p className="font-serif text-lg font-medium tracking-tight text-wine">{s.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-wine/60">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-10 border-t border-wine/10 pt-10">
              <SectionHead eyebrow={t.waysEyebrow} title={t.waysTitle} intro={t.waysIntro} />
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {t.ways.map((w) => (
                  <div key={w.title} className={`px-5 py-5 ${card}`}>
                    <p className="font-serif text-lg font-medium tracking-tight text-wine">{w.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-wine/60">{w.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div id="verdienen" className="mt-10 scroll-mt-40 border-t border-wine/10 pt-10">
              <MakerCalculator locale={locale} />
              <p className="mt-8 font-serif text-xl font-medium tracking-tight text-wine sm:text-2xl">{t.giftTitle}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-wine/60">{t.giftIntro}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {t.gifts.map((g) => (
                  <div key={g.tag} className={`px-5 py-5 ${card}`}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">{g.tag}</p>
                    <p className="mt-2 font-serif text-lg font-medium tracking-tight text-wine">{g.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-wine/60">{g.body}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* The form as a panel, at the bottom of the page. */}
          <div id="kennismaken" className="mt-10 min-w-0 scroll-mt-40">
            <div className="rounded-[1.75rem] border border-wine/10 bg-beige/60 px-5 py-6 shadow-[0_20px_50px_rgba(43,13,18,0.08)] sm:px-8 sm:py-8">
              <p className="font-serif text-2xl text-wine">{t.meetTitle}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-wine/65">{t.meetIntro}</p>
              <ul className="mt-3 space-y-1.5">
                {t.meetPoints.map((p) => (
                  <li key={p} className="flex gap-2.5 text-sm text-wine/75">
                    <span aria-hidden className="text-emerald-700">
                      ✓
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                <MakerForm locale={locale} />
              </div>
            </div>
          </div>

          <div id="vragen" className="mt-12 scroll-mt-40 border-t border-wine/10 pt-10">
            <SectionHead eyebrow={t.faqEyebrow} title={t.faqTitle} />
            <div className={`mt-6 divide-y divide-wine/10 px-6 sm:px-8 ${card}`}>
              {t.faq.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-lg font-medium tracking-tight text-wine [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span
                      aria-hidden
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-wine/8 text-base leading-none text-wine/60 transition-transform duration-200 group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-wine/60">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <MakerStickyCta label={t.cta} />
      <Footer dict={footerDict} locale={locale} />
    </div>
  );
}
