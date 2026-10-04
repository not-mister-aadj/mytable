import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JouwTafelMembershipPage, jouwTafelMembershipMetadata } from "@/components/jouw-tafel/JouwTafelMembershipPage";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "en") return {};
  return jouwTafelMembershipMetadata("en");
}

/** English version of /jouw-tafel/lid. */
export default async function YourTableMembershipRoute({ params, searchParams }: Props) {
  const { locale } = await params;
  if (locale !== "en") notFound();
  return <JouwTafelMembershipPage locale="en" searchParams={await searchParams} />;
}
