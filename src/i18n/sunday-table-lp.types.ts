export type SundayTableLpLabels = {
  meta: {
    title: string;
    titleCity: string;
    description: string;
    descriptionCity: string;
  };
  brand: string;
  headline: string;
  headlineCity: string;
  line: string;
  lineCity: string;
  cta: string;
  secondaryCta: string;
  how: {
    eyebrow: string;
    title: string;
    body: string;
    steps: Array<{ title: string; body: string }>;
  };
  proof: {
    eyebrow: string;
    title: string;
  };
  pricing: {
    eyebrow: string;
    title: string;
    body: string;
    trialLabel: string;
    trialPrice: string;
    trialHint: string;
    popularLabel: string;
    popularPrice: string;
    popularHint: string;
    yearLabel: string;
    yearPrice: string;
    yearHint: string;
  };
  cities: {
    eyebrow: string;
    title: string;
    body: string;
    comingSoon: string;
    comingSoonCities: string;
  };
  final: {
    title: string;
    titleCity: string;
    body: string;
    cta: string;
  };
};
