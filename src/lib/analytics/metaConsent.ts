/** Gate Meta Pixel until a cookie-consent banner is wired. Defaults to enabled. */
let marketingConsentGranted = true;

export function setMetaPixelConsent(granted: boolean): void {
  marketingConsentGranted = granted;
}

export function hasMetaPixelConsent(): boolean {
  return marketingConsentGranted;
}
