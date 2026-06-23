import Image from "next/image";
import { LOGO_MARK, LOGO_NATURAL } from "@/i18n/logo-config";

const LOGO_MARK_SRC = "/logo-mark.png";
const LOGO_FULL_SRC = "/logo-transparent.png";

type LogoVariant = "header" | "footer";

interface LogoProps {
  variant?: LogoVariant;
  priority?: boolean;
  className?: string;
}

const HEADER_VISIBLE_HEIGHT = 36;
const FOOTER_VISIBLE_HEIGHT = 40;

function getLogoDimensions(
  natural: { width: number; height: number },
  visibleHeight: number,
) {
  const imageHeight = visibleHeight;
  const imageWidth = Math.round(visibleHeight * (natural.width / natural.height));
  return { imageWidth, imageHeight };
}

export function Logo({
  variant = "header",
  priority = false,
  className = "",
}: LogoProps) {
  const isHeader = variant === "header";
  const visibleHeight = isHeader ? HEADER_VISIBLE_HEIGHT : FOOTER_VISIBLE_HEIGHT;
  const natural = isHeader ? LOGO_MARK : LOGO_NATURAL;
  const src = isHeader ? LOGO_MARK_SRC : LOGO_FULL_SRC;
  const { imageWidth, imageHeight } = getLogoDimensions(natural, visibleHeight);

  return (
    <span className={`site-logo inline-flex shrink-0 items-center leading-none ${className}`}>
      <Image
        src={src}
        alt="MyTable"
        width={imageWidth}
        height={imageHeight}
        priority={priority}
        className="block h-auto max-w-none w-auto"
        style={{ height: visibleHeight, width: "auto" }}
      />
    </span>
  );
}
