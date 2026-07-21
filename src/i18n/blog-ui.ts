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
  title: "Tips, tafels en eerlijke gidsen over girls-only wijnproeverijen",
  subtitle:
    "Praktische artikelen over solo boeken, wijnspijs, steden en hoe MyTable werkt. Geschreven voor women die een gezellige zondagmiddag zoeken zonder gedoe.",
  featuredLabel: "Uitgelicht artikel",
  readArticle: "Lees artikel",
  allArticles: "Alle artikelen",
  relatedTitle: "Meer lezen",
  breadcrumbHome: "Home",
  breadcrumbBlog: "Blog",
  finalCtaTitle: "Liever meteen een tafel boeken?",
  finalCtaBody:
    "Bekijk open girls-only zondagen, of zet je op de priority list voor jouw stad.",
  finalCtaButton: "Bekijk beschikbare tafels",
  emptyCategory: "Nog geen artikelen in deze categorie.",
  keepReading: "Verder lezen op MyTable",
  tocLabel: "In dit artikel",
  sidebarCtaEyebrow: "Girls-only zondag",
  sidebarCtaTitle: "Liever meteen aanschuiven?",
  sidebarCtaBody:
    "Boek een wijnproeverij bij MyTable: vier wijnen, bites en een tafelmix die klopt.",
  sidebarCtaButton: "Bekijk beschikbare tafels",
  sidebarCtaFootnote: "Solo welkom · Vanaf €39 · 2 min boeken",
};

export const blogUiEn: BlogUiLabels = {
  eyebrow: "MyTable blog",
  title: "Tips, tables and honest guides to girls-only wine tastings",
  subtitle:
    "Practical articles about booking solo, wine and bites, cities and how MyTable works. Written for women looking for an easy Sunday afternoon.",
  featuredLabel: "Featured article",
  readArticle: "Read article",
  allArticles: "All articles",
  relatedTitle: "More to read",
  breadcrumbHome: "Home",
  breadcrumbBlog: "Blog",
  finalCtaTitle: "Rather book a table now?",
  finalCtaBody:
    "See open girls-only Sundays, or join the priority list for your city.",
  finalCtaButton: "See available tables",
  emptyCategory: "No articles in this category yet.",
  keepReading: "Keep exploring on MyTable",
  tocLabel: "In this article",
  sidebarCtaEyebrow: "Girls-only Sunday",
  sidebarCtaTitle: "Rather take a seat now?",
  sidebarCtaBody:
    "Book a MyTable wine tasting: four wines, bites and a table mix that works.",
  sidebarCtaButton: "See available tables",
  sidebarCtaFootnote: "Solo welcome · From €39 · 2 min to book",
};

export function getBlogUiLabels(locale: "nl" | "en"): BlogUiLabels {
  return locale === "en" ? blogUiEn : blogUiNl;
}
