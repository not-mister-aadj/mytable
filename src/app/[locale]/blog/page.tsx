import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { BlogIndexView } from "@/components/blog/BlogIndexView";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getBlogCategoryCounts,
  getBlogPostsSorted,
  getFeaturedBlogPost,
  localizeBlogPost,
} from "@/data/blog";
import { blogPath, isValidLocale, localePath, type Locale } from "@/i18n/config";
import { getBlogUiLabels } from "@/i18n/blog-ui";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  blogJsonLd,
  breadcrumbJsonLd,
  itemListJsonLd,
  organizationJsonLd,
} from "@/lib/seo/json-ld";
import { absoluteUrl } from "@/lib/seo/site";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 3600;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const labels = getBlogUiLabels(locale);
  const meta = buildPageMetadata({
    locale,
    kind: "blog",
    title:
      locale === "en"
        ? "Blog | Girls-only wine tasting tips & guides | MyTable"
        : "Blog | Tips & gidsen girls-only wijnproeverijen | MyTable",
    description: labels.subtitle,
    image: "/blog/25-sociale-activiteiten-voor-volwassenen.png",
  });
  return {
    ...meta,
    alternates: {
      ...meta.alternates,
      types: {
        "application/rss+xml": `${blogPath(locale)}/feed.xml`,
      },
    },
  };
}

export function generateStaticParams() {
  return [{ locale: "nl" }, { locale: "en" }];
}

export default async function BlogIndexPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const labels = getBlogUiLabels(locale);
  const posts = getBlogPostsSorted();
  const featured = getFeaturedBlogPost() ?? null;
  const categoryCounts = getBlogCategoryCounts();
  const pageUrl = absoluteUrl(blogPath(locale));

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(),
          breadcrumbJsonLd(pageUrl, [
            { name: "MyTable", path: localePath(locale) },
            {
              name: labels.breadcrumbBlog,
              path: blogPath(locale),
            },
          ]),
          blogJsonLd({
            locale: locale as Locale,
            title: labels.title,
            description: labels.subtitle,
            posts: posts.map((post) => {
              const local = localizeBlogPost(post, locale as Locale);
              return {
                slug: post.slug,
                title: local.title,
                description: local.metaDescription,
                publishedAt: post.publishedAt,
                updatedAt: post.updatedAt,
                image: post.image,
              };
            }),
          }),
          itemListJsonLd({
            name: labels.title,
            description: labels.subtitle,
            pageUrl,
            items: posts.map((post, index) => {
              const local = localizeBlogPost(post, locale as Locale);
              return {
                name: local.title,
                url: absoluteUrl(`${blogPath(locale)}/${post.slug}`),
                position: index + 1,
              };
            }),
          }),
        ]}
      />
      <Header dict={dict.header} locale={locale} />
      <main>
        <BlogIndexView
          labels={labels}
          locale={locale}
          featured={featured}
          posts={posts}
          activeCategory="all"
          categoryCounts={categoryCounts}
        />
      </main>
      <Footer dict={dict.footer} locale={locale} />
    </>
  );
}
