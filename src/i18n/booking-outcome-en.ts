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
      "Something went wrong at checkout. Don't worry — your seat hasn't been confirmed yet.",
    primaryCta: "Try again",
    secondaryCta: "Back to agenda",
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
        title: "More details later",
        description:
          "Venues and route info may unlock closer to the date — we'll keep you posted.",
      },
      {
        title: "Dietary notes",
        description:
          "If you shared dietary preferences, we'll include them and confirm in your email.",
      },
      {
        title: "Until you're at the table",
        description:
          "Arrive on time, relax, and let the evening unfold — that's what MyTable is about.",
      },
    ],
  },
  community: {
    title: "It happens naturally at the table",
    body: "Many guests come alone. Others bring friends. At the table it just flows — new conversations, good wine, and an evening that turns out differently than you expected.",
    galleryAlt: "MyTable evening atmosphere",
  },
};
