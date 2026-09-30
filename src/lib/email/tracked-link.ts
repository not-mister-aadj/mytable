import { createHash } from "node:crypto";

/**
 * A short code that is the same every time for one recipient of one mail
 * campaign, so a click or a booking can be traced back to who got the mail
 * without putting their email address in the link. Recompute it from the
 * send list to see who clicked: nothing has to be stored at send time.
 */
export function recipientRef(campaign: string, email: string): string {
  return createHash("sha256")
    .update(`${campaign.trim().toLowerCase()}:${email.trim().toLowerCase()}`)
    .digest("hex")
    .slice(0, 10);
}

/**
 * The link to put behind a button in a campaign mail. Adds UTM tags for the
 * campaign and `r`, the recipient's code. The site keeps both in the browser
 * (`src/lib/analytics/utm.ts`) and the checkout stores them on the booking as
 * a `checkout_utm` booking event, so a sale shows which mail it came from.
 */
export function trackedLink(
  url: string,
  options: { campaign: string; email: string; source?: string; medium?: string },
): string {
  const link = new URL(url);
  link.searchParams.set("utm_source", options.source ?? "mail");
  link.searchParams.set("utm_medium", options.medium ?? "email");
  link.searchParams.set("utm_campaign", options.campaign);
  link.searchParams.set("r", recipientRef(options.campaign, options.email));
  return link.toString();
}
