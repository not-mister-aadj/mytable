/** Public CDN for email icons — must use www (bare domain 308-redirects, Gmail skips those). */
export const EMAIL_ICON_CDN = "https://www.mytable.club";

export function emailIconUrl(name: string): string {
  return `${EMAIL_ICON_CDN}/email/icons/${name}.png`;
}

/** Legacy/alternate URLs to replace when embedding inline attachments. */
export function emailIconVariants(name: string): string[] {
  return [
    `${EMAIL_ICON_CDN}/email/icons/${name}.png`,
    `https://mytable.club/email/icons/${name}.png`,
    `/email/icons/${name}.png`,
  ];
}
