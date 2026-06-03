import type { Event } from "@/db/schema";

export type EventListStatus = "published" | "draft" | "soldOut" | "cancelled";

export function getEventListStatus(event: Event): EventListStatus {
  if (event.workflowStatus === "cancelled") return "cancelled";
  if (event.spotsSold >= event.capacity) return "soldOut";
  if (event.workflowStatus === "published") return "published";
  return "draft";
}

const styles: Record<EventListStatus, string> = {
  published: "bg-emerald-100 text-emerald-900",
  draft: "bg-wine/10 text-wine/70",
  soldOut: "bg-red-100 text-red-900",
  cancelled: "bg-wine/5 text-wine/40 line-through",
};

const labels: Record<EventListStatus, string> = {
  published: "Published",
  draft: "Draft",
  soldOut: "Sold out",
  cancelled: "Cancelled",
};

export function StatusPill({ status }: { status: EventListStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
