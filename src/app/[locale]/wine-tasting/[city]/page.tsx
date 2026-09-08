import type { Metadata } from "next";
import { wineTastingLpCityPath, wineTastingLpPath } from "@/i18n/config";
import { getWineTastingLpLabels } from "@/i18n/get-format-lp";
import {
  buildFormatLpCityMetadata,
  formatLpCityStaticParams,
  renderFormatLpCityPage,
  type FormatLpPageConfig,
} from "@/lib/format-lp-page";

const config: FormatLpPageConfig = {
  getLabels: getWineTastingLpLabels,
  path: wineTastingLpPath,
  cityPath: wineTastingLpCityPath,
  metadataKind: "wineTastingLp",
  metadataCityKind: "wineTastingLpCity",
  image: "/girls-only/wine-moment.jpg",
  waitlistInterest: "wine_tasting",
  serviceType: (locale) => (locale === "en" ? "Wine tasting" : "Wijnproeverij"),
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

export default async function WineTastingLpCityPage({ params }: Props) {
  return renderFormatLpCityPage(config, params);
}
