import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import {
  agendaPath,
  blogCategoryPath,
  blogPath,
  blogPostPath,
  localePath,
} from "@/i18n/config";
import type { BlogUiLabels } from "@/i18n/blog-ui";
import {
  formatReadTime,
  getBlogPostUpdatedAt,
  localizeBlogPost,
  type BlogBlock,
  type BlogPost,
} from "@/data/blog";
import {
  BlogArticleSidebar,
  type BlogTocItem,
} from "@/components/blog/BlogArticleSidebar";
import { BlogMobileStickyCta } from "@/components/blog/BlogMobileStickyCta";

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildToc(body: BlogBlock[]): BlogTocItem[] {
  const used = new Map<string, number>();
  const items: BlogTocItem[] = [];

  for (const block of body) {
    if (block.type !== "h2") continue;
    const base = slugifyHeading(block.text) || "section";
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    const id = count === 0 ? base : `${base}-${count + 1}`;
    items.push({ id, label: block.text });
  }

  return items;
}

export function BlogArticleView({
  labels,
  locale,
  post,
  related,
}: {
  labels: BlogUiLabels;
  locale: Locale;
  post: BlogPost;
  related: BlogPost[];
}) {
  const local = localizeBlogPost(post, locale);
  const relatedLocal = related.map((item) => localizeBlogPost(item, locale));
  const toc = buildToc(local.body);
  const contentId = "blog-article-content";
  const headingIds = toc.map((item) => item.id);
  const updatedAt = getBlogPostUpdatedAt(post);

  let h2Index = 0;

  return (
    <>
      <article
        className="bg-cream pt-[4.5rem] sm:pt-24"
        itemScope
        itemType="https://schema.org/BlogPosting"
      >
        <meta itemProp="headline" content={local.title} />
        <meta itemProp="datePublished" content={post.publishedAt} />
        <meta itemProp="dateModified" content={updatedAt} />

        <div className="mx-auto max-w-7xl px-5 py-8 pb-[max(6.5rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-12 lg:px-10 lg:pb-12">
          <div className="max-w-3xl">
            <nav aria-label="Breadcrumb" className="text-sm text-wine/55">
              <ol className="flex flex-wrap items-center gap-2">
                <li>
                  <Link
                    href={localePath(locale)}
                    className="hover:text-burgundy"
                  >
                    {labels.breadcrumbHome}
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li>
                  <Link href={blogPath(locale)} className="hover:text-burgundy">
                    {labels.breadcrumbBlog}
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li>
                  <Link
                    href={blogCategoryPath(locale, post.category)}
                    className="hover:text-burgundy"
                  >
                    {local.categoryLabel}
                  </Link>
                </li>
              </ol>
            </nav>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-rose-deep">
              <Link
                href={blogCategoryPath(locale, post.category)}
                className="hover:text-burgundy"
              >
                {local.categoryLabel}
              </Link>
            </p>
            <h1 className="mt-3 font-serif text-[2rem] font-medium leading-[1.08] tracking-tight text-wine sm:text-5xl">
              {local.title}
            </h1>
            <p className="mt-4 text-sm text-wine/60">
              {formatReadTime(post.readMinutes, locale)}
            </p>
            <p
              className="mt-6 text-lg leading-relaxed text-wine/80 sm:text-xl"
              itemProp="description"
            >
              {local.excerpt}
            </p>
          </div>

          <div className="mt-8 max-w-4xl lg:mt-10">
            <div className="relative aspect-[16/9] overflow-hidden rounded-3xl shadow-[0_20px_50px_rgba(43,13,18,0.1)] sm:aspect-[2/1]">
              <Image
                src={post.image}
                alt={local.title}
                fill
                priority
                sizes="(max-width: 896px) 100vw, 896px"
                className="object-cover object-[center_35%]"
              />
            </div>
          </div>

          <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_19rem] xl:gap-16">
            <div
              id={contentId}
              className="min-w-0 space-y-5 sm:space-y-6 lg:order-1"
              itemProp="articleBody"
            >
              {local.body.map((block, index) => {
                if (block.type === "h2") {
                  const id = headingIds[h2Index] ?? `section-${h2Index}`;
                  h2Index += 1;
                  return (
                    <h2
                      key={`${block.type}-${index}`}
                      id={id}
                      className="scroll-mt-28 pt-6 font-serif text-2xl font-medium tracking-tight text-wine first:pt-0 sm:pt-8 sm:text-3xl"
                    >
                      {block.text}
                    </h2>
                  );
                }
                if (block.type === "h3") {
                  return (
                    <h3
                      key={`${block.type}-${index}`}
                      className="pt-2 font-serif text-xl font-medium tracking-tight text-wine sm:text-2xl"
                    >
                      {block.text}
                    </h3>
                  );
                }
                if (block.type === "ul") {
                  return (
                    <ul
                      key={`${block.type}-${index}`}
                      className="list-disc space-y-2.5 pl-5 text-base leading-relaxed text-wine/80 marker:text-rose-deep"
                    >
                      {block.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p
                    key={`${block.type}-${index}`}
                    className="text-base leading-[1.75] text-wine/80 sm:text-[1.0625rem]"
                  >
                    {block.text}
                  </p>
                );
              })}

              {local.relatedLinks.length > 0 ? (
                <aside className="mt-4 rounded-2xl border border-rose/20 bg-beige/60 p-5 sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-wine/55">
                    {labels.keepReading}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {local.relatedLinks.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-sm font-semibold text-burgundy transition-colors hover:text-wine"
                        >
                          {link.label} →
                        </Link>
                      </li>
                    ))}
                  </ul>
                </aside>
              ) : null}
            </div>

            <div className="order-first lg:order-2 lg:pt-1">
              <BlogArticleSidebar
                labels={labels}
                locale={locale}
                toc={toc}
                contentId={contentId}
              />
            </div>
          </div>
        </div>
      </article>

      {relatedLocal.length > 0 ? (
        <section className="border-t border-rose/15 bg-beige/40 py-12 pb-[max(6.5rem,env(safe-area-inset-bottom))] sm:py-16 lg:pb-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <h2 className="font-serif text-2xl font-medium text-wine sm:text-3xl">
              {labels.relatedTitle}
            </h2>
            <ul className="mt-8 grid gap-8 sm:grid-cols-3">
              {relatedLocal.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={blogPostPath(locale, item.slug)}
                    className="group block"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-rose-deep">
                      {item.categoryLabel}
                    </p>
                    <h3 className="mt-1 font-serif text-xl font-medium text-wine transition-colors group-hover:text-burgundy">
                      {item.title}
                    </h3>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

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
