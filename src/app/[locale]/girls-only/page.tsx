import { girlsOnlyPath, isValidLocale } from "@/i18n/config";
import { permanentRedirect, notFound } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toQueryString(
  searchParams: Record<string, string | string[] | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else {
      params.set(key, value);
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Legacy URL: national girls-only landing now lives at `/` and `/en`. */
export default async function GirlsOnlyRedirectPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const query = toQueryString(await searchParams);
  permanentRedirect(`${girlsOnlyPath(locale)}${query}`);
}
