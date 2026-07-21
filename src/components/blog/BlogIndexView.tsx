import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { agendaPath, blogCategoryPath, blogPath, blogPostPath } from "@/i18n/config";
import type { BlogUiLabels } from "@/i18n/blog-ui";
import {
  BLOG_CATEGORIES,
  BLOG_CATEGORY_ORDER,
  formatReadTime,
  localizeBlogPost,
  type BlogCategoryId,
  type BlogPost,
} from "@/data/blog";
import { BlogMobileStickyCta } from "@/components/blog/BlogMobileStickyCta";

function PostMeta({
  post,
  locale,
}: {
  post: ReturnType<typeof localizeBlogPost>;
  locale: Locale;
}) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium uppercase tracking-[0.14em] text-wine/55">
      <span className="text-rose-deep">{post.categoryLabel}</span>
      <span aria-hidden>·</span>
      <span>{formatReadTime(post.readMinutes, locale)}</span>
    </p>
  );
}

function categoryHref(locale: Locale, category: BlogCategoryId | "all") {
  return category === "all"
    ? blogPath(locale)
    : blogCategoryPath(locale, category);
}

export function BlogIndexView({
  labels,
  locale,
  featured,
  posts,
  activeCategory,
  categoryCounts,
}: {
  labels: BlogUiLabels;
  locale: Locale;
  featured: BlogPost | null;
  posts: BlogPost[];
  activeCategory: BlogCategoryId | "all";
  categoryCounts: Record<BlogCategoryId, number>;
}) {
  const lang = locale === "en" ? "en" : "nl";
  const totalCount = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
  const listPosts = posts.map((post) => localizeBlogPost(post, locale));
  const showFeatured =
    featured != null &&
    (activeCategory === "all" || featured.category === activeCategory);
  const featuredLocal = featured ? localizeBlogPost(featured, locale) : null;
  const listWithoutFeatured = showFeatured
    ? listPosts.filter((post) => post.slug !== featured!.slug)
    : listPosts;

  const filters: { id: BlogCategoryId | "all"; label: string; count: number }[] =
    [
      {
        id: "all",
        label: labels.allArticles,
        count: totalCount,
      },
      ...BLOG_CATEGORY_ORDER.map((id) => ({
        id,
        label: BLOG_CATEGORIES[id][lang],
        count: categoryCounts[id],
      })),
    ];

  return (
    <>
      <section className="border-b border-rose/15 bg-gradient-to-b from-wine via-burgundy to-burgundy pt-[4.5rem] sm:pt-24">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:px-10 lg:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose">
            {labels.eyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl font-serif text-[2rem] font-medium leading-[1.08] tracking-tight text-cream sm:text-5xl">
            {labels.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-cream/75 sm:text-lg">
            {labels.subtitle}
          </p>

          <nav
            aria-label={labels.allArticles}
            className="-mx-5 mt-8 flex gap-2.5 overflow-x-auto px-5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden"
          >
            {filters.map((filter) => {
              const isActive = filter.id === activeCategory;
              return (
                <Link
                  key={filter.id}
                  href={categoryHref(locale, filter.id)}
                  scroll={false}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm transition ${
                    isActive
                      ? "bg-cream font-semibold text-burgundy shadow-sm"
                      : "border border-cream/25 bg-cream/5 text-cream/90 hover:border-cream/45 hover:bg-cream/10"
                  }`}
                >
                  <span>{filter.label}</span>
                  <span
                    className={`tabular-nums ${
                      isActive ? "text-rose-deep" : "text-cream/55"
                    }`}
                  >
                    {filter.count}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </section>

      {showFeatured && featured && featuredLocal ? (
        <section className="border-b border-rose/10 bg-cream py-10 sm:py-14">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <article className="overflow-hidden rounded-[1.75rem] border border-rose/15 bg-beige/50 shadow-[0_18px_50px_rgba(43,13,18,0.06)] lg:grid lg:grid-cols-2">
              <Link
                href={blogPostPath(locale, featured.slug)}
                className="relative aspect-[16/10] overflow-hidden lg:aspect-auto lg:min-h-[22rem]"
              >
                <Image
                  src={featured.image}
                  alt={featuredLocal.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 560px"
                  className="object-cover transition-transform duration-500 hover:scale-[1.02]"
                />
                <span className="absolute left-4 top-4 rounded-full bg-cream/95 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-wine shadow-sm">
                  {labels.featuredLabel}
                </span>
                <span className="absolute bottom-4 left-4 rounded-full bg-wine/80 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-cream backdrop-blur-sm">
                  {featuredLocal.categoryLabel}
                </span>
              </Link>
              <div className="flex flex-col justify-center px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
                <PostMeta post={featuredLocal} locale={locale} />
                <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
                  <Link
                    href={blogPostPath(locale, featured.slug)}
                    className="transition-colors hover:text-burgundy"
                  >
                    {featuredLocal.title}
                  </Link>
                </h2>
                <p className="mt-4 text-base leading-relaxed text-wine/75">
                  {featuredLocal.excerpt}
                </p>
                <Link
                  href={blogPostPath(locale, featured.slug)}
                  className="mt-6 inline-flex text-sm font-semibold text-burgundy transition-colors hover:text-wine"
                >
                  {labels.readArticle} →
                </Link>
              </div>
            </article>
          </div>
        </section>
      ) : null}

      <section className="bg-beige/40 py-12 pb-[max(6.5rem,env(safe-area-inset-bottom))] sm:py-16 lg:pb-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <h2 className="font-serif text-2xl font-medium text-wine sm:text-3xl">
            {activeCategory === "all"
              ? labels.allArticles
              : BLOG_CATEGORIES[activeCategory][lang]}
          </h2>

          {listWithoutFeatured.length === 0 && !showFeatured ? (
            <p className="mt-8 text-base text-wine/65">{labels.emptyCategory}</p>
          ) : (
            <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {listWithoutFeatured.map((post) => (
                <li key={post.slug}>
                  <article className="group h-full">
                    <Link
                      href={blogPostPath(locale, post.slug)}
                      className="relative block aspect-[16/10] overflow-hidden rounded-2xl"
                    >
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    </Link>
                    <div className="pt-4">
                      <PostMeta post={post} locale={locale} />
                      <h3 className="mt-2 font-serif text-xl font-medium tracking-tight text-wine sm:text-2xl">
                        <Link
                          href={blogPostPath(locale, post.slug)}
                          className="transition-colors hover:text-burgundy"
                        >
                          {post.title}
                        </Link>
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-wine/70">
                        {post.excerpt}
                      </p>
                      <Link
                        href={blogPostPath(locale, post.slug)}
                        className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-burgundy hover:text-wine"
                      >
                        {labels.readArticle} →
                      </Link>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section
        id="blog-final-cta"
        className="border-t border-rose/15 bg-gradient-to-b from-rose-soft/60 to-cream py-14 pb-[max(7rem,env(safe-area-inset-bottom))] sm:py-16 lg:pb-16"
      >
        <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
          <h2 className="font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
            {labels.finalCtaTitle}
          </h2>
          <p className="mt-3 text-base text-wine/75">{labels.finalCtaBody}</p>
          <Link
            href={agendaPath(locale)}
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-burgundy px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-cream transition hover:bg-wine sm:text-sm"
          >
            {labels.finalCtaButton}
          </Link>
        </div>
      </section>

      <BlogMobileStickyCta labels={labels} locale={locale} />
    </>
  );
}
