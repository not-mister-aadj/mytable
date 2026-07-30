export type BlogUiLabels = {
  eyebrow: string;
  title: string;
  subtitle: string;
  featuredLabel: string;
  readArticle: string;
  allArticles: string;
  relatedTitle: string;
  breadcrumbHome: string;
  breadcrumbBlog: string;
  finalCtaTitle: string;
  finalCtaBody: string;
  finalCtaButton: string;
  emptyCategory: string;
  keepReading: string;
  tocLabel: string;
  sidebarCtaEyebrow: string;
  sidebarCtaTitle: string;
  sidebarCtaBody: string;
  sidebarCtaButton: string;
  sidebarCtaFootnote: string;
};

export const blogUiNl: BlogUiLabels = {
  eyebrow: "MyTable blog",
  title: "Tips, tafels en eerlijke gidsen over wijnproeverijen",
  subtitle:
    "Praktische artikelen over solo boeken, wijnspijs, steden en hoe MyTable werkt. Voor iedereen die een gezellige zondagmiddag zoekt zonder gedoe.",
  featuredLabel: "Uitgelicht artikel",
  readArticle: "Lees artikel",
  allArticles: "Alle artikelen",
  relatedTitle: "Meer lezen",
  breadcrumbHome: "Home",
  breadcrumbBlog: "Blog",
  finalCtaTitle: "Liever meteen een tafel boeken?",
  finalCtaBody:
    "Bekijk open tafels in de agenda, of kies Sunday Table als je nieuwe mensen wilt leren kennen.",
  finalCtaButton: "Bekijk beschikbare tafels",
  emptyCategory: "Nog geen artikelen in deze categorie.",
  keepReading: "Verder lezen op MyTable",
  tocLabel: "In dit artikel",
  sidebarCtaEyebrow: "Sunday Table",
  sidebarCtaTitle: "Liever meteen aanschuiven?",
  sidebarCtaBody:
    "Boek een wijnproeverij bij MyTable: vier wijnen, bites en een tafelmix die klopt.",
  sidebarCtaButton: "Bekijk beschikbare tafels",
  sidebarCtaFootnote: "Solo welkom · vanaf €49 p.p. · 2 min boeken",
};

export const blogUiEn: BlogUiLabels = {
  eyebrow: "MyTable blog",
  title: "Tips, tables and honest guides to wine tastings",
  subtitle:
    "Practical articles about booking solo, wine and bites, cities and how MyTable works. For anyone looking for an easy Sunday afternoon.",
  featuredLabel: "Featured article",
  readArticle: "Read article",
  allArticles: "All articles",
  relatedTitle: "More to read",
  breadcrumbHome: "Home",
  breadcrumbBlog: "Blog",
  finalCtaTitle: "Rather book a table now?",
  finalCtaBody:
    "See open tables on the agenda, or choose Sunday Table if you want to meet new people.",
  finalCtaButton: "See available tables",
  emptyCategory: "No articles in this category yet.",
  keepReading: "Keep exploring on MyTable",
  tocLabel: "In this article",
  sidebarCtaEyebrow: "Sunday Table",
  sidebarCtaTitle: "Rather take a seat now?",
  sidebarCtaBody:
    "Book a MyTable wine tasting: four wines, bites and a table mix that works.",
  sidebarCtaButton: "See available tables",
  sidebarCtaFootnote: "Solo welcome · from €49 pp · 2 min to book",
};

export function getBlogUiLabels(locale: "nl" | "en"): BlogUiLabels {
  return locale === "en" ? blogUiEn : blogUiNl;
}
