import { girlsOnlyPath, isValidLocale } from "@/i18n/config";
import { permanentRedirect, notFound } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

/** Legacy URL: national girls-only landing now lives at `/` and `/en`. */
export default async function GirlsOnlyRedirectPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  permanentRedirect(girlsOnlyPath(locale));
}
