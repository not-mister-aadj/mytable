import type { Metadata } from "next";
import { chefsSpecialLpCityPath, chefsSpecialLpPath } from "@/i18n/config";
import { getChefsSpecialLpLabels } from "@/i18n/get-format-lp";
import {
  buildFormatLpCityMetadata,
  formatLpCityStaticParams,
  renderFormatLpCityPage,
  type FormatLpPageConfig,
} from "@/lib/format-lp-page";

const config: FormatLpPageConfig = {
  getLabels: getChefsSpecialLpLabels,
  path: chefsSpecialLpPath,
  cityPath: chefsSpecialLpCityPath,
  metadataKind: "chefsSpecialLp",
  metadataCityKind: "chefsSpecialLpCity",
  image: "/girls-only/table-group.jpg",
  waitlistInterest: "chefs_special",
  serviceType: (locale) =>
    locale === "en" ? "Chef's table dinner" : "Chef's Table diner",
};

export const revalidate = 60;

type Props = {
  params: Promise<{ locale: string; city: string }>;
};

export function generateStaticParams() {
  return formatLpCityStaticParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return buildFormatLpCityMetadata(config, params);
}

export default async function ChefsSpecialLpCityPage({ params }: Props) {
  return renderFormatLpCityPage(config, params);
}
