export const emailBrand = {
  cream: "#FAF3EF",
  card: "#FFFFFF",
  pillBg: "#F0E4D6",
  iconCircle: "#F5EDE3",
  burgundy: "#600D1E",
  burgundyDark: "#4A0816",
  darkText: "#2A1218",
  mutedText: "#7A6568",
  gold: "#C19A6B",
  divider: "#EDE4DA",
  tagline: "Goede smaak. Goed gezelschap.",
} as const;

export const emailFonts = {
  serif: "Georgia, 'Times New Roman', Times, serif",
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
} as const;

export const emailRadii = {
  card: "16px",
  pill: "999px",
} as const;

export const emailShadow = {
  card: "0 2px 14px rgba(96, 13, 30, 0.06)",
} as const;

export const emailSpacing = {
  cardGap: "20px",
  cardPaddingTop: "28px",
  cardPaddingRight: "28px",
  cardPaddingBottom: "28px",
  cardPaddingLeft: "40px",
  cardPaddingMobileTop: "22px",
  cardPaddingMobileRight: "22px",
  cardPaddingMobileBottom: "22px",
  cardPaddingMobileLeft: "28px",
  divider: "20px",
  listGap: "20px",
  footerTop: "40px",
} as const;

export const emailType = {
  label: {
    fontSize: "9px",
    fontWeight: 600 as const,
    letterSpacing: "0.13em",
    textTransform: "uppercase" as const,
    color: emailBrand.gold,
    margin: "0 0 5px",
  },
  sectionLabel: {
    fontSize: "9px",
    fontWeight: 600 as const,
    letterSpacing: "0.15em",
    textTransform: "uppercase" as const,
    color: emailBrand.gold,
    margin: "0 0 8px",
  },
  body: {
    fontSize: "14px",
    lineHeight: "22px",
    color: emailBrand.mutedText,
  },
  bodySmall: {
    fontSize: "13px",
    lineHeight: "20px",
    color: emailBrand.mutedText,
  },
  value: {
    fontSize: "13px",
    lineHeight: "18px",
    fontWeight: 600 as const,
    color: emailBrand.darkText,
    margin: 0,
  },
} as const;
