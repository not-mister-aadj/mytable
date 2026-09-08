import type { Metadata } from "next";
import { wineTastingLpCityPath, wineTastingLpPath } from "@/i18n/config";
import { getWineTastingLpLabels } from "@/i18n/get-format-lp";
import {
  buildFormatLpMetadata,
  formatLpStaticParams,
  renderFormatLpPage,
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
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return formatLpStaticParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return buildFormatLpMetadata(config, params);
}

export default async function WineTastingLpPage({ params }: Props) {
  return renderFormatLpPage(config, params);
}
