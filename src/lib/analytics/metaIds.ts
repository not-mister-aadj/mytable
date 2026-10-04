export function metaPurchaseEventId(bookingId: string): string {
  return `purchase_${bookingId}`;
}

export function metaInitiateCheckoutEventId(bookingId: string): string {
  return `checkout_${bookingId}`;
}

export function metaLeadEventId(waitlistId: string): string {
  return `lead_${waitlistId}`;
}

/** The quiz's Lead (/jouw-tafel/start), one per account: the browser Pixel
 * and CAPI send the same id so Meta deduplicates them. */
export function metaQuizLeadEventId(userId: string): string {
  return `quiz_lead_${userId}`;
}

export function metaCompleteRegistrationEventId(userId: string): string {
  return `registration_${userId}`;
}

export function metaViewContentEventId(eventId: string): string {
  return `viewcontent_${eventId}`;
}

/** A started membership (Meta's standard Subscribe): the browser Pixel on
 * the return page and CAPI from the webhook send the same id per
 * subscription, so Meta deduplicates them. */
export function metaSubscribeEventId(subscriptionId: string): string {
  return `subscribe_${subscriptionId}`;
}

/** The Purchase sent alongside a started membership, so ad sets that
 * optimise for Purchase see membership sales too. Own id, deduplicated
 * between Pixel and CAPI like Subscribe. */
export function metaMembershipPurchaseEventId(subscriptionId: string): string {
  return `purchase_sub_${subscriptionId}`;
}
