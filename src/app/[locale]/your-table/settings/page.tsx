import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JouwTafelSettingsPage, jouwTafelSettingsMetadata } from "@/components/jouw-tafel/JouwTafelSettingsPage";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "en") return {};
  return jouwTafelSettingsMetadata("en");
}

/** English version of /jouw-tafel/instellingen. */
export default async function YourTableSettingsRoute({ params, searchParams }: Props) {
  const { locale } = await params;
  if (locale !== "en") notFound();
  return <JouwTafelSettingsPage locale="en" searchParams={await searchParams} />;
}
