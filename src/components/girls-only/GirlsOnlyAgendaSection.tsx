import type { Locale } from "@/i18n/config";
import type { GirlsOnlyPageLabels } from "@/i18n/girls-only-page.types";
import { getDictionaryWithAgenda } from "@/i18n/get-dictionary";
import { warmExperienceSlugs } from "@/lib/warm-navigation-cache";
import { GirlsOnlyLanding } from "./GirlsOnlyLanding";

interface GirlsOnlyAgendaSectionProps {
  locale: Locale;
  labels: GirlsOnlyPageLabels;
}

export async function GirlsOnlyAgendaSection({
  locale,
  labels,
}: GirlsOnlyAgendaSectionProps) {
  const agendaDict = await getDictionaryWithAgenda(locale);
  warmExperienceSlugs(
    locale,
    agendaDict.agenda.items.flatMap((item) => (item.slug ? [item.slug] : [])),
  );

  return (
    <GirlsOnlyLanding
      labels={labels}
      locale={locale}
      agendaItems={agendaDict.agenda.items}
    />
  );
}
