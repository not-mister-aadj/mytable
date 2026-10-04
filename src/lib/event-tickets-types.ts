export type EventTicketTransferDestination = {
  eventId: string;
  nameNl: string;
  city: string;
  startsAt: string;
  slug: string;
};

export type EventTicketRow = {
  id: string;
  reservationCode: string;
  customerName: string | null;
  email: string;
  seats: number;
  dietaryNotes: string | null;
  seatingPreference: string | null;
  tableLanguagePreference: string | null;
  createdAt: string;
  lifecycleStatus: "active" | "transferred" | "removed";
  transferredAt: string | null;
  transferredBy: string | null;
  /** A member's booking (own seat included, a guest at the member price). */
  isMember: boolean;
  /** What was paid, e.g. "€ 0,00" for a member's own seat. */
  amountLabel: string;
  /** Admin "Niet gekomen". */
  noShowAt: string | null;
  /** The table has started, so "Niet gekomen" can be marked. */
  eventStarted: boolean;
  /** "Meet your table" answers (Sunday Table only). */
  intro: {
    conversationStyle: string | null;
    askMeAbout: string | null;
    favoriteSpot: string | null;
    wine: string | null;
    intoNow: string | null;
    plusOneName: string | null;
    shareConsent: boolean;
    answeredAt: string | null;
    requestSentAt: string | null;
  };
  transferDestination: EventTicketTransferDestination | null;
};

export type TransferTargetEvent = {
  id: string;
  nameNl: string;
  city: string;
  startsAt: string;
  capacity: number;
  spotsSold: number;
  spotsAvailable: number;
  workflowStatus: string;
};

export type EventTicketsData = {
  tickets: EventTicketRow[];
  transferTargets: TransferTargetEvent[];
};

export type EventGuestExportRow = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dietaryNotes: string;
  ticketType: string;
  seats: number;
  locale: string;
  tableLanguage: string;
  seatingPreference: string;
  reservationCode: string;
  amount: string;
  status: string;
  adminNotes: string;
  bookedAt: string;
  transferDestination: string;
};

export type EventGuestsExportData = {
  event: {
    id: string;
    nameNl: string;
    city: string;
    slug: string;
    startsAt: string;
  };
  rows: EventGuestExportRow[];
};
