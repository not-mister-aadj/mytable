import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JouwTafelReservePage, jouwTafelReserveMetadata } from "@/components/jouw-tafel/JouwTafelTablePages";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "en") return {};
  return jouwTafelReserveMetadata("en");
}

/** English version of /jouw-tafel/tafel/{slug}/reserveren. */
export default async function YourTableReserveRoute({ params }: Props) {
  const { locale, slug } = await params;
  if (locale !== "en") notFound();
  return <JouwTafelReservePage locale={"en"} slug={slug} />;
}
