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
