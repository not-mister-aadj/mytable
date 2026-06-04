"use client";

import { useMemo } from "react";
import type { Venue } from "@/db/schema";
import { ExperiencePageContent } from "@/components/experience/ExperiencePageContent";
import { nl } from "@/i18n/dictionaries/nl";
import { en } from "@/i18n/dictionaries/en";
import { enrichExperience } from "@/lib/experience-detail";
import {
  buildDetailPreviewExperience,
  type PreviewEventData,
} from "./event-preview";
import { buildPreviewVenues } from "./preview-venues";

export function AdminDetailPreview({
  data,
  allVenues = [],
}: {
  data: PreviewEventData;
  allVenues?: Venue[];
}) {
  const locale = data.previewLocale ?? "nl";
  const dict = locale === "en" ? en : nl;

  const experience = useMemo(
    () => enrichExperience(buildDetailPreviewExperience(data)),
    [data],
  );

  const eventVenues = useMemo(
    () => buildPreviewVenues(data, allVenues),
    [data, allVenues],
  );

  return (
    <div className="bg-cream [&_a]:pointer-events-none">
      <ExperiencePageContent
        experience={experience}
        related={[]}
        dict={dict}
        locale={locale}
        eventVenues={eventVenues.length > 0 ? eventVenues : undefined}
        previewMode
      />
    </div>
  );
}
