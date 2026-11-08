import type { Metadata } from "next";
import { applyMetadata, renderApplyPage } from "@/components/ambassadors/apply-page";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return applyMetadata((await params).locale);
}

export default async function AmbassadorApplyPage({ params }: Props) {
  return renderApplyPage((await params).locale, "nl");
}
