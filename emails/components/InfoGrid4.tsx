import { Column, Row, Text } from "@react-email/components";
import { emailType } from "../brand";
import type { EmailIconName } from "../icons";
import { EmailIcon } from "./EmailIcon";

export type InfoGrid4Item = {
  icon: EmailIconName;
  label: string;
  value: string;
};

function InfoGrid4Cell({
  item,
  isLast = false,
}: {
  item: InfoGrid4Item;
  isLast?: boolean;
}) {
  return (
    <Column
      className={`email-grid-4-cell${isLast ? " email-grid-4-cell-last" : ""}`}
      style={{
        width: "25%",
        verticalAlign: "top",
        paddingRight: isLast ? "0" : "6px",
      }}
    >
      <EmailIcon name={item.icon} size={17} alt={item.label} />
      <Text style={emailType.label}>{item.label}</Text>
      <Text style={emailType.value}>{item.value}</Text>
    </Column>
  );
}

export function InfoGrid4({ items }: { items: InfoGrid4Item[] }) {
  return (
    <Row>
      {items.map((item, i) => (
        <InfoGrid4Cell key={item.label} item={item} isLast={i === items.length - 1} />
      ))}
    </Row>
  );
}

export function LocationRow({
  icon,
  label,
  value,
  isLast = false,
}: {
  icon: EmailIconName;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <Row style={{ marginBottom: isLast ? "0" : "14px" }}>
      <Column style={{ width: "24px", verticalAlign: "top", paddingTop: "1px" }}>
        <EmailIcon name={icon} size={17} alt={label} inline />
      </Column>
      <Column style={{ verticalAlign: "top" }}>
        <Text style={emailType.label}>{label}</Text>
        <Text style={emailType.value}>{value}</Text>
      </Column>
    </Row>
  );
}

export function CityRow({ city }: { city: string }) {
  return (
    <Row>
      <Column style={{ width: "18px", verticalAlign: "middle" }}>
        <EmailIcon name="pin" size={13} alt="Stad" inline />
      </Column>
      <Column style={{ verticalAlign: "middle", paddingLeft: "2px" }}>
        <Text style={{ ...emailType.bodySmall, margin: 0 }}>{city}</Text>
      </Column>
    </Row>
  );
}
