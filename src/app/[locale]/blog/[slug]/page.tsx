import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { BlogArticleView } from "@/components/blog/BlogArticleView";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  blogPosts,
  estimateBlogWordCount,
  getBlogPost,
  getBlogPostUpdatedAt,
  getRelatedBlogPosts,
  localizeBlogPost,
} from "@/data/blog";
import {
  blogCategoryPath,
  blogFeedPath,
  blogPath,
  blogPostPath,
  isValidLocale,
  localePath,
  type Locale,
} from "@/i18n/config";
import { getBlogUiLabels } from "@/i18n/blog-ui";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  blogPostingJsonLd,
  breadcrumbJsonLd,
  organizationJsonLd,
} from "@/lib/seo/json-ld";
import { absoluteUrl } from "@/lib/seo/site";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 3600;

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) return {};
  const post = getBlogPost(slug);
  if (!post) return {};
  const local = localizeBlogPost(post, locale);
  const meta = buildPageMetadata({
    locale,
    kind: "blogPost",
    title: `${local.title} | MyTable`,
    description: local.metaDescription,
    slug,
    image: post.image,
    article: {
      publishedTime: post.publishedAt,
      modifiedTime: getBlogPostUpdatedAt(post),
      section: local.categoryLabel,
      tags: [local.categoryLabel, "MyTable", "wijnproeverij", "girls-only"],
    },
  });

  return {
    ...meta,
    alternates: {
      ...meta.alternates,
      types: {
        "application/rss+xml": blogFeedPath(locale),
      },
    },
  };
}

export function generateStaticParams() {
  return ["nl", "en"].flatMap((locale) =>
    blogPosts.map((post) => ({ locale, slug: post.slug })),
  );
}

export default async function BlogArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();

  const post = getBlogPost(slug);
  if (!post) notFound();

  const dict = getDictionary(locale);
  const labels = getBlogUiLabels(locale);
  const local = localizeBlogPost(post, locale as Locale);
  const related = getRelatedBlogPosts(slug, 3);
  const pageUrl = absoluteUrl(blogPostPath(locale, slug));
  const updatedAt = getBlogPostUpdatedAt(post);

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
              name: local.categoryLabel,
              path: blogCategoryPath(locale, post.category),
            },
            {
              name: local.title,
              path: blogPostPath(locale, slug),
            },
          ]),
          ...blogPostingJsonLd({
            locale: locale as Locale,
            slug: post.slug,
            title: local.title,
            description: local.metaDescription,
            publishedAt: post.publishedAt,
            updatedAt,
            image: post.image,
            categoryLabel: local.categoryLabel,
            readMinutes: post.readMinutes,
            wordCount: estimateBlogWordCount(post, locale as Locale),
            keywords: [
              local.categoryLabel,
              "MyTable",
              locale === "en" ? "wine tasting" : "wijnproeverij",
              "girls-only",
            ],
          }),
        ]}
      />
      <Header dict={dict.header} locale={locale} />
      <main>
        <BlogArticleView
          labels={labels}
          locale={locale}
          post={post}
          related={related}
        />
      </main>
      <Footer dict={dict.footer} locale={locale} />
    </>
  );
}
