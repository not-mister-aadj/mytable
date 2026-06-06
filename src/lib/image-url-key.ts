/** Same photo via different query strings should count as one image. */
export function imageUrlKey(url: string): string {
  try {
    return new URL(url).pathname.replace(/\/$/, "");
  } catch {
    return url;
  }
}
