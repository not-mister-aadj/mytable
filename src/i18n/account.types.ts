export type AccountAuthLabels = {
  eyebrow: string;
  title: string;
  subtitle: string;
  close: string;
  orEmail: string;
  email: {
    label: string;
    placeholder: string;
    cta: string;
    sending: string;
  };
  otp: {
    sentTitle: string;
    hint: string;
    label: string;
    noCode: string;
    resend: string;
    resendCountdown: string;
    back: string;
  };
  oauth: {
    google: string;
    apple: string;
  };
  legalBeforeTerms: string;
  legalTerms: string;
  legalAnd: string;
  legalPrivacy: string;
  errors: {
    otpSend: string;
    otpRateLimit: string;
    otpVerify: string;
    google: string;
    apple: string;
    authFailed: string;
    config: string;
  };
};

export type AccountOnboardingLabels = {
  stepLabel: string;
  continue: string;
  skip: string;
  back: string;
  signOut: string;
  signingOut: string;
  language: {
    title: string;
    subtitle: string;
    dutch: string;
    english: string;
  };
  brand: {
    tagline: string;
    body: string;
  };
  /** Lifestyle promise screens after intent (Vibend-style) */
  stories: {
    meet: Array<{
      title: string;
      subtitle: string;
      image: string;
      imageAlt: string;
      cta: string;
    }>;
    culinary: Array<{
      title: string;
      subtitle: string;
      image: string;
      imageAlt: string;
      cta: string;
    }>;
    both: Array<{
      title: string;
      subtitle: string;
      image: string;
      imageAlt: string;
      cta: string;
    }>;
  };
  goal: {
    title: string;
    lines: string[];
    notDating: string;
    cta: string;
  };
  intent: {
    title: string;
    subtitle: string;
    meetTitle: string;
    meetHint: string;
    culinaryTitle: string;
    culinaryHint: string;
    bothTitle: string;
    bothHint: string;
  };
  company: {
    title: string;
    subtitle: string;
    subtitleCulinary: string;
    solo: string;
    soloHint: string;
    withSomeone: string;
    withSomeoneHint: string;
    withFriends: string;
    withFriendsHint: string;
    withPartner: string;
    withPartnerHint: string;
    withDate: string;
    withDateHint: string;
    withGroup: string;
    withGroupHint: string;
  };
  name: {
    title: string;
    subtitle: string;
    label: string;
    placeholder: string;
    required: string;
  };
  birthdate: {
    title: string;
    subtitle: string;
    day: string;
    month: string;
    year: string;
    ageHint: string;
    underage: string;
    invalid: string;
    months: [
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
    ];
  };
  city: {
    title: string;
    subtitle: string;
    flexible: string;
    maxHint: string;
  };
  gender: {
    title: string;
    subtitle: string;
    woman: string;
    man: string;
    nonBinary: string;
    preferNot: string;
  };
  tableType: {
    title: string;
    subtitle: string;
    girlsOnly: string;
    girlsOnlyHint: string;
    mixed: string;
    mixedHint: string;
    noPreference: string;
    noPreferenceHint: string;
  };
  personality: {
    title: string;
    subtitle: string;
    introverted: string;
    introvertedHint: string;
    ambivert: string;
    ambivertHint: string;
    extroverted: string;
    extrovertedHint: string;
  };
  /** Path-specific “say yes” card before vibe / signup */
  commit: {
    meet: { title: string; body: string; cta: string };
    culinary: { title: string; body: string; cta: string };
    both: { title: string; body: string; cta: string };
  };
  /** Promise / vibe card before signup (or done when already signed in) */
  vibe: {
    meet: { title: string; subtitle: string; cta: string; imageAlt: string };
    culinary: { title: string; subtitle: string; cta: string; imageAlt: string };
    both: { title: string; subtitle: string; cta: string; imageAlt: string };
  };
  signupEnd: {
    title: string;
    subtitle: string;
  };
  membership: {
    title: string;
    body: string;
    perk1: string;
    perk2: string;
    perk3: string;
    ctaYes: string;
    ctaSkip: string;
  };
  tastes: {
    title: string;
    subtitle: string;
    note: string;
    wineWalk: string;
    wineWalkHint: string;
    foodWalk: string;
    foodWalkHint: string;
    tasting: string;
    tastingHint: string;
    dinner: string;
    dinnerHint: string;
  };
  done: {
    title: string;
    subtitle: string;
    summaryIntentMeet: string;
    summaryIntentCulinary: string;
    summaryIntentBoth: string;
    summaryName: string;
    summaryAge: string;
    summaryCompanySolo: string;
    summaryCompanySomeone: string;
    summaryCompanyFriends: string;
    summaryCompanyPartner: string;
    summaryCompanyDate: string;
    summaryCompanyGroup: string;
    summaryCities: string;
    summaryFlexible: string;
    summaryTableGirls: string;
    summaryTableMixed: string;
    summaryTableAny: string;
    summaryPersonalityIntroverted: string;
    summaryPersonalityAmbivert: string;
    summaryPersonalityExtroverted: string;
    summaryCommunity: string;
    summaryTastes: string;
    primaryMeet: string;
    primaryCulinary: string;
    secondary: string;
  };
  welcomeBack: {
    title: string;
    subtitle: string;
    meetCta: string;
    meetHint: string;
    culinaryCta: string;
    culinaryHint: string;
    redo: string;
  };
};

export type AccountPageLabels = {
  meta: { title: string; description: string };
  auth: AccountAuthLabels;
  onboarding: AccountOnboardingLabels;
  settings: AccountSettingsLabels;
};

export type AccountSettingsLabels = {
  title: string;
  subtitle: string;
  emailLabel: string;
  languageLabel: string;
  save: string;
  saving: string;
  saved: string;
  saveError: string;
  signOut: string;
  signingOut: string;
  sectionProfile: string;
  sectionPath: string;
  sectionGender: string;
  sectionTable: string;
  sectionPersonality: string;
  sectionCities: string;
  sectionTastes: string;
  communityLabel: string;
  communityHint: string;
  exploreMeet: string;
  exploreCulinary: string;
  redoOnboarding: string;
};
