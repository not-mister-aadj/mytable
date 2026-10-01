import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JouwTafelPage, jouwTafelMetadata } from "@/components/jouw-tafel/JouwTafelPage";

export const revalidate = 300;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "en") return {};
  return jouwTafelMetadata("en");
}

/** English version of /jouw-tafel, at /en/your-table. English only, like
 * /en/terms next to /algemene-voorwaarden. */
export default async function YourTableRoute({ params }: Props) {
  const { locale } = await params;
  if (locale !== "en") notFound();
  return <JouwTafelPage locale="en" />;
}
