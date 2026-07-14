export const BOOKING_MOBILE_ID = "booking-mobile";
export const BOOKING_DESKTOP_ID = "booking-desktop";

export function scrollToBooking(): void {
  const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
  const id = isDesktop ? BOOKING_DESKTOP_ID : BOOKING_MOBILE_ID;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function handleBookingNavClick(
  event: { preventDefault: () => void },
  onTrack?: () => void,
): void {
  event.preventDefault();
  onTrack?.();
  scrollToBooking();
}
