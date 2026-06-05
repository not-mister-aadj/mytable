/** Central bedrijfsgegevens voor juridische pagina's en footer. */
export const companyLegal = {
  legalName: "DevBux",
  tradeName: "MyTable",
  website: "mytable.club",
  websiteUrl: "https://mytable.club",
  email: "info@mytable.club",
  address: {
    line1: "Hm van Randwijkhove 77",
    postalCode: "2717 TD",
    city: "Zoetermeer",
    country: "Nederland",
  },
  kvk: "74627120",
  btw: "NL004132989B53",
  /** ISO date string for display, e.g. "7 juni 2026" via locale formatter */
  lastUpdatedIso: "2026-06-07",
  exchangeDeadlineHours: 48,
} as const;

export type CompanyLegalVars = {
  legalName: string;
  tradeName: string;
  website: string;
  websiteUrl: string;
  email: string;
  addressBlock: string;
  kvk: string;
  btw: string;
  exchangeDeadlineHours: string;
};

export function getCompanyLegalVars(locale: "nl" | "en"): CompanyLegalVars {
  const { address } = companyLegal;
  const addressBlock =
    locale === "nl"
      ? `${address.line1}, ${address.postalCode} ${address.city}`
      : `${address.line1}, ${address.postalCode} ${address.city}, ${address.country}`;

  return {
    legalName: companyLegal.legalName,
    tradeName: companyLegal.tradeName,
    website: companyLegal.website,
    websiteUrl: companyLegal.websiteUrl,
    email: companyLegal.email,
    addressBlock,
    kvk: companyLegal.kvk,
    btw: companyLegal.btw,
    exchangeDeadlineHours: String(companyLegal.exchangeDeadlineHours),
  };
}

export function formatLegalUpdated(locale: "nl" | "en"): string {
  const date = new Date(`${companyLegal.lastUpdatedIso}T12:00:00`);
  return new Intl.DateTimeFormat(locale === "nl" ? "nl-NL" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function interpolateLegal(
  text: string,
  vars: CompanyLegalVars,
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = vars[key as keyof CompanyLegalVars];
    return value ?? `{{${key}}}`;
  });
}
