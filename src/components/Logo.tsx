import Image from "next/image";
import {
  LOGO_NATURAL,
  LOGO_WORDMARK_RATIO,
} from "@/i18n/logo-config";

const LOGO_SRC = "/logo-transparent.png";
const FULL_ASPECT = LOGO_NATURAL.width / LOGO_NATURAL.height;

type LogoVariant = "header" | "footer";

interface LogoProps {
  variant?: LogoVariant;
  priority?: boolean;
  className?: string;
}

const HEADER_VISIBLE_HEIGHT = 36;
const FOOTER_VISIBLE_HEIGHT = 40;

function getLogoDimensions(visibleHeight: number) {
  const imageHeight = Math.round(visibleHeight / LOGO_WORDMARK_RATIO);
  const imageWidth = Math.round(imageHeight * FULL_ASPECT);

  return { visibleHeight, imageWidth, imageHeight };
}

export function Logo({
  variant = "header",
  priority = false,
  className = "",
}: LogoProps) {
  const visibleHeight =
    variant === "header" ? HEADER_VISIBLE_HEIGHT : FOOTER_VISIBLE_HEIGHT;
  const { imageWidth, imageHeight } = getLogoDimensions(visibleHeight);

  return (
    <span
      className={`site-logo inline-block shrink-0 overflow-hidden rounded-md bg-cream leading-none ${className}`}
      style={{ height: visibleHeight, width: imageWidth }}
    >
      <Image
        src={LOGO_SRC}
        alt="MyTable"
        width={imageWidth}
        height={imageHeight}
        priority={priority}
        className="block max-w-none bg-cream"
        style={{ width: imageWidth, height: imageHeight }}
      />
    </span>
  );
}
