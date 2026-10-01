import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import { JouwTafelIntroFallback, JouwTafelQuiz } from "@/components/jouw-tafel/JouwTafelQuiz";
import type { Locale } from "@/i18n/config";
import { getJouwTafelData } from "@/lib/jouw-tafel/data";

/** Ad landing page only: kept out of search results and the sitemap. */
export function jouwTafelMetadata(locale: Locale): Metadata {
  return {
    title: locale === "en" ? "Your table | MyTable" : "Jouw tafel | MyTable",
    description:
      locale === "en"
        ? "Five short questions, then you'll see your Sunday Table right away."
        : "Vijf korte vragen, daarna zie je meteen jouw Sunday Table.",
    robots: {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    },
  };
}

/**
 * "Jouw tafel" quiz funnel for paid social. Logo only, no navigation, so the
 * only way forward is through the questions. The step lives in `?stap=`,
 * read on the client, so this page itself stays cacheable.
 */
export async function JouwTafelPage({ locale }: { locale: Locale }) {
  const data = await getJouwTafelData();
  return (
    <div className="min-h-[100svh] bg-cream">
      <header className="flex justify-center pt-5 pb-1">
        <Logo priority />
      </header>
      <main>
        <Suspense fallback={<JouwTafelIntroFallback locale={locale} />}>
          <JouwTafelQuiz locale={locale} data={data} />
        </Suspense>
      </main>
    </div>
  );
}
