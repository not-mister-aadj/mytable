export const CustomerActivityTypes = {
  bookingCreated: "booking_created",
  checkoutStarted: "checkout_started",
  paymentCompleted: "payment_completed",
  paymentFailed: "payment_failed",
  bookingMoved: "booking_moved",
  bookingCancelled: "booking_cancelled",
  waitlistJoined: "waitlist_joined",
  emailSent: "email_sent",
  noteAdded: "note_added",
} as const;

export type CustomerActivityType =
  (typeof CustomerActivityTypes)[keyof typeof CustomerActivityTypes];

export type CustomerStatusKey =
  | "new"
  | "paying"
  | "repeat"
  | "waitlist_only"
  | "payment_issue";

export type UpsertCustomerInput = {
  email: string;
  customerName?: string | null;
  language?: string | null;
  preferredCity?: string | null;
  phone?: string | null;
};
