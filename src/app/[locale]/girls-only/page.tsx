import { clubmemberPath, isValidLocale, type Locale } from "@/i18n/config";
import { notFound, redirect } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

/** Legacy hub URL → Clubmember. City SEO pages stay under /girls-only/[city]. */
export default async function GirlsOnlyHubRedirect({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  redirect(clubmemberPath(locale as Locale));
}
