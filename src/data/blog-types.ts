export type BlogCategoryId = "tips" | "girls-only" | "cities" | "how-it-works";

export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] };

export type BlogPost = {
  slug: string;
  category: BlogCategoryId;
  publishedAt: string;
  /** ISO date; defaults to publishedAt for SEO dateModified */
  updatedAt?: string;
  readMinutes: number;
  image: string;
  featured?: boolean;
  title: { nl: string; en: string };
  excerpt: { nl: string; en: string };
  metaDescription: { nl: string; en: string };
  /** Internal paths for SEO linking, e.g. /agenda or /girls-only/rotterdam */
  relatedPaths?: { path: string; label: { nl: string; en: string } }[];
  body: { nl: BlogBlock[]; en: BlogBlock[] };
};
