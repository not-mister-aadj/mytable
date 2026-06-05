import type { Booking, Event } from "@/db/schema";

export type AdminPaymentStatus = Booking["paymentStatus"];

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

export type AdminBookingRow = {
  id: string;
  reservationCode: string;
  email: string;
  customerName: string | null;
  seats: number;
  amountCents: number;
  currency: string;
  paymentStatus: AdminPaymentStatus;
  locale: string;
  dietaryNotes: string | null;
  adminNotes: string | null;
  createdAt: string;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  event: AdminBookingEvent;
  guestInitials: string;
  isReturningGuest: boolean;
  previousPaidCount: number;
  isGroup: boolean;
  isSolo: boolean;
  guestInsight: string | null;
  bookingStatus: "confirmed" | "completed" | "pending" | "failed" | "refunded";
};

export type AdminBookingsKpi = {
  upcomingGuests: number;
  revenueThisWeekCents: number;
  occupancyRatePct: number;
  upcomingTables: number;
  pendingPayments: number;
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
