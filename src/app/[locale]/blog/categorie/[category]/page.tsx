import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { BlogIndexView } from "@/components/blog/BlogIndexView";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  BLOG_CATEGORIES,
  BLOG_CATEGORY_ORDER,
  getBlogCategoryCounts,
  getBlogCategorySeo,
  getBlogPostsSorted,
  getFeaturedBlogPost,
  isBlogCategoryId,
  localizeBlogPost,
} from "@/data/blog";
import {
  blogCategoryPath,
  blogPath,
  isValidLocale,
  localePath,
  type Locale,
} from "@/i18n/config";
import { getBlogUiLabels } from "@/i18n/blog-ui";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbJsonLd,
  itemListJsonLd,
  organizationJsonLd,
} from "@/lib/seo/json-ld";
import { absoluteUrl } from "@/lib/seo/site";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 3600;

type Props = {
  params: Promise<{ locale: string; category: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, category } = await params;
  if (!isValidLocale(locale) || !isBlogCategoryId(category)) return {};
  const seo = getBlogCategorySeo(category, locale);
  return buildPageMetadata({
    locale,
    kind: "blogCategory",
    title: seo.title,
    description: seo.description,
    slug: category,
    image: "/blog/25-sociale-activiteiten-voor-volwassenen.png",
  });
}

export function generateStaticParams() {
  return ["nl", "en"].flatMap((locale) =>
    BLOG_CATEGORY_ORDER.map((category) => ({ locale, category })),
  );
}

export default async function BlogCategoryPage({ params }: Props) {
  const { locale, category } = await params;
  if (!isValidLocale(locale) || !isBlogCategoryId(category)) notFound();

  const dict = getDictionary(locale);
  const labels = getBlogUiLabels(locale);
  const lang = locale === "en" ? "en" : "nl";
  const categoryLabel = BLOG_CATEGORIES[category][lang];
  const seo = getBlogCategorySeo(category, locale);
  const posts = getBlogPostsSorted().filter((post) => post.category === category);
  const featuredCandidate = getFeaturedBlogPost();
  const featured =
    featuredCandidate?.category === category ? featuredCandidate : null;
  const categoryCounts = getBlogCategoryCounts();
  const pageUrl = absoluteUrl(blogCategoryPath(locale, category));

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
            {
              name: categoryLabel,
              path: blogCategoryPath(locale, category),
            },
          ]),
          itemListJsonLd({
            name: seo.title,
            description: seo.description,
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
          activeCategory={category}
          categoryCounts={categoryCounts}
        />
      </main>
      <Footer dict={dict.footer} locale={locale} />
    </>
  );
}
