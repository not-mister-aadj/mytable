import type { BookingOutcomeLabels } from "./types";

export const bookingOutcomeEn: BookingOutcomeLabels = {
  success: {
    eyebrow: "Confirmed",
    headline: "Your seat is waiting",
    subtext:
      "Your payment went through. You'll receive full details by email within a few minutes.",
    primaryCta: "View your table",
    secondaryCta: "Browse more tables",
  },
  failed: {
    eyebrow: "Not reserved",
    headline: "Payment didn't go through",
    subtext:
      "Something went wrong at checkout. Don't worry, your seat hasn't been confirmed yet.",
    primaryCta: "Try again",
    secondaryCta: "Back to agenda",
  },
  pending: {
    eyebrow: "One moment",
    headline: "Confirming your payment",
    subtext: "We're loading your booking. This usually takes just a few seconds.",
    timeoutSubtext:
      "This is taking longer than expected. Refresh the page or wait for your confirmation email. Your payment was likely already processed.",
  },
  summary: {
    title: "Your reservation",
    date: "Date & time",
    city: "City",
    guests: "Guests",
    amount: "Paid",
    code: "Reservation code",
    guestLabel: "{count} guest | {count} guests",
  },
  nextSteps: {
    title: "What happens next?",
    items: [
      {
        title: "Email confirmation",
        description:
          "Within a few minutes you'll receive an email with your booking and practical details.",
      },
      {
        title: "Dietary notes",
        description:
          "Have dietary requirements? It's always wise to mention them to the venue, even if you already shared them when booking.",
      },
      {
        title: "Until you're at the table",
        description:
          "Arrive on time, relax, and enjoy your Sunday afternoon. That's what MyTable is about.",
      },
    ],
  },
  community: {
    title: "Exceptional wines and dishes",
    body: "Your Sunday afternoon is all about culinary discovery: special restaurants, carefully chosen wines, and dishes that invite you to taste, surprise, and enjoy.",
    galleryAlt: "Atmosphere",
  },
};
