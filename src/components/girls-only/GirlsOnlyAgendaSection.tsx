import { agendaPath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import type { GirlsOnlyPageLabels } from "@/i18n/girls-only-page.types";
import { Header } from "@/components/Header";
import { GirlsOnlyLandingView } from "./GirlsOnlyLandingView";

interface GirlsOnlyAgendaSectionProps {
  locale: Locale;
  labels: GirlsOnlyPageLabels;
  headerDict: Dictionary["header"];
}

export async function GirlsOnlyAgendaSection({
  locale,
  labels,
  headerDict,
}: GirlsOnlyAgendaSectionProps) {
  const agendaHref = agendaPath(locale);

  return (
    <>
      <Header dict={headerDict} locale={locale} />
      <GirlsOnlyLandingView
        labels={labels}
        locale={locale}
        agendaHref={agendaHref}
      />
    </>
  );
}
