/** PostHog event names — keep in sync across client + server. */
export const PostHogEvents = {
  eventPageViewed: "event_page_viewed",
  checkoutStarted: "checkout_started",
  bookingPaid: "booking_paid",
  waitlistSignup: "waitlist_signup",
} as const;

export type PostHogEventName =
  (typeof PostHogEvents)[keyof typeof PostHogEvents];
