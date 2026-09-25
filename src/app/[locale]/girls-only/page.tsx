import { isValidLocale, sundayTableLpPath, type Locale } from "@/i18n/config";
import { notFound, redirect } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

/** Legacy hub URL → Sunday Table. City pages moved to /sunday-table/[city]. */
export default async function GirlsOnlyHubRedirect({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  redirect(sundayTableLpPath(locale as Locale));
}
