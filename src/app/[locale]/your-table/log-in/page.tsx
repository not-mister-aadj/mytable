import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  JouwTafelPlaceholderPage,
  jouwTafelPlaceholderMetadata,
} from "@/components/jouw-tafel/JouwTafelPage";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "en") return {};
  return jouwTafelPlaceholderMetadata("en", "login");
}

/** English version of /jouw-tafel/inloggen. */
export default async function YourTableLogInRoute({ params }: Props) {
  const { locale } = await params;
  if (locale !== "en") notFound();
  return <JouwTafelPlaceholderPage locale="en" kind="login" />;
}
