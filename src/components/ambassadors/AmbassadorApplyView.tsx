import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AmbassadorForm } from "@/components/ambassadors/AmbassadorForm";
import { ambassadorCopy } from "@/lib/ambassadors/copy";
import { ambassadorsPath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";

/** /ambassadors/aanmelden (EN /en/ambassadors/apply): the application form on its own page. */
export function AmbassadorApplyView({
  locale,
  headerDict,
  footerDict,
}: {
  locale: Locale;
  headerDict: Dictionary["header"];
  footerDict: Dictionary["footer"];
}) {
  const t = ambassadorCopy(locale).apply;
  return (
    <div className="overflow-x-clip bg-white">
      <Header dict={headerDict} locale={locale} />
      <div className="mx-auto max-w-2xl px-5 pb-20 pt-[7.25rem] sm:px-8 sm:pt-36">
        <Link href={ambassadorsPath(locale)} className="text-[0.88rem] text-wine/55 hover:text-burgundy">
          ← {t.back}
        </Link>
        <div className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-burgundy/80">{t.eyebrow}</div>
        <h1 className="mt-3 font-serif text-[2rem] font-medium leading-[1.1] tracking-tight text-wine sm:text-4xl">{t.title}</h1>
        <p className="mt-3 leading-relaxed text-wine/65">{t.intro}</p>
        <AmbassadorForm locale={locale} />
      </div>
      <Footer dict={footerDict} locale={locale} />
    </div>
  );
}
