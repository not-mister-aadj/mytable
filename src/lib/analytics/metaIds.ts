export function metaPurchaseEventId(bookingId: string): string {
  return `purchase_${bookingId}`;
}

export function metaInitiateCheckoutEventId(bookingId: string): string {
  return `checkout_${bookingId}`;
}

export function metaLeadEventId(waitlistId: string): string {
  return `lead_${waitlistId}`;
}

export function metaViewContentEventId(eventId: string): string {
  return `viewcontent_${eventId}`;
}
