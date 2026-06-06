export function getGoogleAdsConversionId(): string | null {
  return process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID?.trim() || null;
}

export function getGoogleAdsConversionLabel(): string | null {
  return process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL?.trim() || null;
}

export function isGoogleAdsConfigured(): boolean {
  return Boolean(getGoogleAdsConversionId() && getGoogleAdsConversionLabel());
}

export function getGoogleAdsSendTo(): string | null {
  const id = getGoogleAdsConversionId();
  const label = getGoogleAdsConversionLabel();
  if (!id || !label) return null;
  return `${id}/${label}`;
}
