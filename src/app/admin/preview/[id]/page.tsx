import { ExperiencePageContent } from "@/components/experience/ExperiencePageContent";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import {
  isValidPreviewLocale,
  loadEventPreviewPageData,
  parsePreviewLocale,
} from "@/lib/load-event-preview-page";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ locale?: string }>;
};

export default async function AdminEventPreviewEmbedPage({
  params,
  searchParams,
}: Props) {
  await requireAdmin();
  const { id } = await params;
  const { locale: localeParam } = await searchParams;
  const locale = isValidPreviewLocale(localeParam)
    ? localeParam
    : parsePreviewLocale(localeParam);

  const data = await loadEventPreviewPageData(id, locale);
  if (!data) notFound();

  return (
    <div className="min-h-screen bg-cream">
      <ExperiencePageContent
        experience={data.experience}
        related={data.related}
        dict={data.dict}
        locale={data.locale}
        eventVenues={data.eventVenues}
        routePoints={data.routePoints}
      />
    </div>
  );
}
