import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  JouwTafelWelcomePage,
  jouwTafelWelcomeMetadata,
} from "@/components/jouw-tafel/JouwTafelAccountPages";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "en") return {};
  return jouwTafelWelcomeMetadata("en");
}

/** English version of /jouw-tafel/welkom. */
export default async function YourTableWelcomeRoute({ params }: Props) {
  const { locale } = await params;
  if (locale !== "en") notFound();
  return <JouwTafelWelcomePage locale="en" />;
}
