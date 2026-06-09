import type { ConfirmationPurchaseData } from "@/lib/analytics/confirmationPurchase";
import { CONFIRMATION_PURCHASE_EMBED_ID } from "@/lib/analytics/confirmation-purchase-constants";

/** SSR-safe JSON embed for conversion tags (read by client components). */
export function ConfirmationPurchaseEmbed({
  data,
}: {
  data: ConfirmationPurchaseData;
}) {
  return (
    <script
      id={CONFIRMATION_PURCHASE_EMBED_ID}
      type="application/json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
