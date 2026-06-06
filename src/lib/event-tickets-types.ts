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
  createdAt: string;
  lifecycleStatus: "active" | "transferred" | "removed";
  transferredAt: string | null;
  transferredBy: string | null;
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
