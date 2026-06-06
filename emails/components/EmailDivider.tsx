import { Hr } from "@react-email/components";
import { emailBrand, emailSpacing } from "../brand";

export function EmailDivider({ spacing = emailSpacing.divider }: { spacing?: string }) {
  return (
    <Hr
      style={{
        border: "none",
        borderTop: `1px solid ${emailBrand.divider}`,
        margin: `${spacing} 0`,
      }}
    />
  );
}
