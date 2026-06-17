import type { Booking, Event } from "@/db/schema";

export type AdminPaymentStatus = Booking["paymentStatus"];
export type AdminLifecycleStatus = Booking["lifecycleStatus"];

export type AdminBookingEvent = {
  id: string;
  nameNl: string;
  nameEn: string;
  slug: string;
  city: string;
  startsAt: string;
  endsAt: string | null;
  capacity: number;
  spotsSold: number;
  femaleOnly: boolean;
  experienceType: string;
  imageUrl: string;
  workflowStatus: Event["workflowStatus"];
};

export type AdminBookingTimelineEntry = {
  id: string;
  label: string;
  at: string;
  by?: string;
  tone: "neutral" | "success" | "warning" | "danger";
};

export type AdminOperationalStatus =
  | "confirmed"
  | "completed"
  | "transferred"
  | "removed"
  | "pending"
  | "failed"
  | "refunded";

export type AdminCrmBadge = "first_time" | "repeat" | "payment_issue" | null;

export type AdminBookingRow = {
  id: string;
  reservationCode: string;
  email: string;
  customerId: string | null;
  customerFailedPayments: number;
  crmBadge: AdminCrmBadge;
  customerName: string | null;
  seats: number;
  amountCents: number;
  currency: string;
  paymentStatus: AdminPaymentStatus;
  lifecycleStatus: AdminLifecycleStatus;
  locale: string;
  dietaryNotes: string | null;
  seatingPreference: string | null;
  adminNotes: string | null;
  createdAt: string;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  event: AdminBookingEvent;
  /** Where this guest was moved to (for transferred rows on the source event). */
  transferDestination: AdminBookingEvent | null;
  transferredAt: string | null;
  transferredBy: string | null;
  guestInitials: string;
  isReturningGuest: boolean;
  previousPaidCount: number;
  isGroup: boolean;
  isSolo: boolean;
  guestInsight: string | null;
  bookingStatus: AdminOperationalStatus;
  timeline: AdminBookingTimelineEntry[];
};

export type AdminBookingsKpi = {
  upcomingGuests: number;
  revenueThisWeekCents: number;
  occupancyRatePct: number;
  upcomingTables: number;
  avgTableFillPct: number;
  returningGuestsPct: number;
  guestsArrivingTomorrow: number;
};

export type AdminBookingsPageData = {
  bookings: AdminBookingRow[];
  kpis: AdminBookingsKpi;
  cities: string[];
  experienceTypes: string[];
  stripeDashboardBase: string;
};
