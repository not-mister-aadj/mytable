import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  JouwTafelAuthPage,
  jouwTafelAuthMetadata,
  type AccountSearchParams,
} from "@/components/jouw-tafel/JouwTafelAccountPages";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<AccountSearchParams>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "en") return {};
  return jouwTafelAuthMetadata("en", "login");
}

/** English version of /jouw-tafel/inloggen. */
export default async function YourTableLogInRoute({ params, searchParams }: Props) {
  const { locale } = await params;
  if (locale !== "en") notFound();
  return <JouwTafelAuthPage locale="en" screen="login" searchParams={await searchParams} />;
}
