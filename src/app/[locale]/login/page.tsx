import { redirect } from "next/navigation";

/** Legacy URL — sign-in is a modal (BeSquare-style). */
export default async function LoginRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(locale === "en" ? "/en?signin=1" : "/?signin=1");
}
