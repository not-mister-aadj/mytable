/** Icon paths for email HTML. Relative so admin preview works on any host; send replaces with cid: inline attachments. */
export function emailIconUrl(name: string): string {
  return `/email/icons/${name}.png`;
}
