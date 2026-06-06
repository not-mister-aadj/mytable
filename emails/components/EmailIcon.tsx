import { Img } from "@react-email/components";
import { emailIcons, type EmailIconName } from "../icons";

type Props = {
  name: EmailIconName;
  size?: number;
  alt?: string;
  inline?: boolean;
};

export function EmailIcon({ name, size = 18, alt = "", inline = false }: Props) {
  return (
    <Img
      src={emailIcons[name]}
      width={size}
      height={size}
      alt={alt}
      style={{ display: "block", margin: inline ? 0 : "0 0 7px" }}
    />
  );
}

type CircleProps = Props & { circleSize?: number };

export function EmailIconCircle({
  name,
  size = 15,
  circleSize = 34,
  alt = "",
}: CircleProps) {
  return (
    <Img
      src={emailIcons[name]}
      width={size}
      height={size}
      alt={alt}
      style={{
        display: "block",
        margin: `${(circleSize - size) / 2}px auto`,
      }}
    />
  );
}
