import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JouwTafelQuizPage, jouwTafelQuizMetadata } from "@/components/jouw-tafel/JouwTafelQuizPage";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "en") return {};
  return jouwTafelQuizMetadata("en");
}

/** English version of /jouw-tafel/start. */
export default async function YourTableStartRoute({ params, searchParams }: Props) {
  const { locale } = await params;
  if (locale !== "en") notFound();
  return <JouwTafelQuizPage locale="en" searchParams={await searchParams} />;
}
