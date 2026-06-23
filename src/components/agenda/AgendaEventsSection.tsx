import type { Locale } from "@/i18n/config";
import { AgendaPageContent } from "@/components/AgendaPageContent";
import { getDictionaryWithAgenda } from "@/i18n/get-dictionary";
import { warmExperienceSlugs } from "@/lib/warm-navigation-cache";

interface AgendaEventsSectionProps {
  locale: Locale;
}

export async function AgendaEventsSection({ locale }: AgendaEventsSectionProps) {
  const dict = await getDictionaryWithAgenda(locale);
  warmExperienceSlugs(
    locale,
    dict.agenda.items.flatMap((item) => (item.slug ? [item.slug] : [])),
  );

  return (
    <AgendaPageContent
      dict={dict.agenda}
      pageLabels={dict.experiencePage}
      locale={locale}
      items={dict.agenda.items}
    />
  );
}
