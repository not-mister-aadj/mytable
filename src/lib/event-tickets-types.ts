export type EventTicketRow = {
  id: string;
  reservationCode: string;
  customerName: string | null;
  email: string;
  seats: number;
  dietaryNotes: string | null;
  createdAt: string;
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
