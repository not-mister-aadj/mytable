import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JouwTafelTablePage, jouwTafelTableMetadata } from "@/components/jouw-tafel/JouwTafelTablePages";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "en") return {};
  return jouwTafelTableMetadata("en");
}

/** English version of /jouw-tafel/tafel/{slug}. */
export default async function YourTableTableRoute({ params }: Props) {
  const { locale, slug } = await params;
  if (locale !== "en") notFound();
  return <JouwTafelTablePage locale={"en"} slug={slug} />;
}
