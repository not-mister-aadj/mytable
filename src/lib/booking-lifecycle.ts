import type { Booking } from "@/db/schema";

export type BookingLifecycleStatus = Booking["lifecycleStatus"];

/** Counts toward event capacity and active guest lists. */
export function isActiveAttendance(booking: {
  paymentStatus: Booking["paymentStatus"];
  lifecycleStatus: BookingLifecycleStatus;
}): boolean {
  return (
    booking.paymentStatus === "paid" && booking.lifecycleStatus === "active"
  );
}

export function isTransferredBooking(booking: {
  lifecycleStatus: BookingLifecycleStatus;
}): boolean {
  return booking.lifecycleStatus === "transferred";
}

export function isRemovedBooking(booking: {
  paymentStatus: Booking["paymentStatus"];
  lifecycleStatus: BookingLifecycleStatus;
}): boolean {
  return (
    booking.lifecycleStatus === "removed" || booking.paymentStatus === "refunded"
  );
}

export type AdminBookingFilterStatus =
  | "active"
  | "moved"
  | "cancelled"
  | "paid"
  | "pending";

export function matchesBookingStatusFilter(
  booking: {
    paymentStatus: Booking["paymentStatus"];
    lifecycleStatus: BookingLifecycleStatus;
  },
  filter: AdminBookingFilterStatus,
): boolean {
  switch (filter) {
    case "active":
      return isActiveAttendance(booking);
    case "moved":
      return (
        booking.lifecycleStatus === "transferred" &&
        booking.paymentStatus === "paid"
      );
    case "cancelled":
      return isRemovedBooking(booking);
    case "paid":
      return booking.paymentStatus === "paid";
    case "pending":
      return booking.paymentStatus === "pending";
    default:
      return true;
  }
}

export function resolveOperationalBookingStatus(booking: {
  paymentStatus: Booking["paymentStatus"];
  lifecycleStatus: BookingLifecycleStatus;
  eventStartsAt: Date;
  now?: Date;
}): "confirmed" | "completed" | "transferred" | "removed" | "pending" | "failed" | "refunded" {
  const now = booking.now ?? new Date();

  if (booking.lifecycleStatus === "transferred") return "transferred";
  if (booking.lifecycleStatus === "removed" || booking.paymentStatus === "refunded") {
    return "removed";
  }
  if (booking.paymentStatus === "pending") return "pending";
  if (booking.paymentStatus === "failed") return "failed";

  return booking.eventStartsAt.getTime() > now.getTime()
    ? "confirmed"
    : "completed";
}
