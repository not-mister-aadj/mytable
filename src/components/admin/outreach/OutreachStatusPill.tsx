import {
  OUTREACH_STATUS_CLASSES,
  OUTREACH_STATUS_LABELS,
  type OutreachStatus,
} from "@/lib/outreach/constants";

export function OutreachStatusPill({ status }: { status: OutreachStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${OUTREACH_STATUS_CLASSES[status]}`}
    >
      {OUTREACH_STATUS_LABELS[status]}
    </span>
  );
}
