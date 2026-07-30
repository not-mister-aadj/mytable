import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostHogProvider } from "@/components/PostHogProvider";
import { MetaPixelProvider } from "@/components/MetaPixelProvider";
import { PrefetchCriticalRoutes } from "@/components/PrefetchCriticalRoutes";
import { SetHtmlLang } from "@/components/SetHtmlLang";
import { AuthProviders } from "@/features/auth/AuthProviders";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: {
      default: dict.meta.title,
      template: "%s",
    },
    description: dict.meta.description,
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return (
    <PostHogProvider>
      <MetaPixelProvider>
        <AuthProviders locale={locale as Locale} nav={dict.header.nav}>
          <SetHtmlLang locale={locale} />
          <PrefetchCriticalRoutes locale={locale} />
          {children}
        </AuthProviders>
      </MetaPixelProvider>
    </PostHogProvider>
  );
}

export function generateStaticParams() {
  return [{ locale: "nl" }, { locale: "en" }];
}
