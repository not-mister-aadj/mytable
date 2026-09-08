import type { Metadata } from "next";
import { wineWalkLpCityPath, wineWalkLpPath } from "@/i18n/config";
import { getWineWalkLpLabels } from "@/i18n/get-format-lp";
import {
  buildFormatLpCityMetadata,
  formatLpCityStaticParams,
  renderFormatLpCityPage,
  type FormatLpPageConfig,
} from "@/lib/format-lp-page";

const config: FormatLpPageConfig = {
  getLabels: getWineWalkLpLabels,
  path: wineWalkLpPath,
  cityPath: wineWalkLpCityPath,
  metadataKind: "wineWalkLp",
  metadataCityKind: "wineWalkLpCity",
  image: "/girls-only/duo-table.jpg",
  waitlistInterest: "wine_walk",
  serviceType: (locale) => (locale === "en" ? "Wine walk" : "Wijnwalk"),
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

export default async function WineWalkLpCityPage({ params }: Props) {
  return renderFormatLpCityPage(config, params);
}
