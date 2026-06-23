interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
  compact?: boolean;
  hideSubtitleOnMobile?: boolean;
}

export function SectionHeading({
  title,
  subtitle,
  align = "left",
  className = "",
  compact = false,
  hideSubtitleOnMobile = false,
}: SectionHeadingProps) {
  return (
    <div
      className={`max-w-2xl ${align === "center" ? "mx-auto text-center" : ""} ${className}`}
    >
      <h2
        className={`font-serif font-medium tracking-tight text-wine ${
          compact
            ? "text-2xl sm:text-4xl lg:text-5xl"
            : "text-3xl sm:text-4xl lg:text-5xl"
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-3 text-sm leading-relaxed text-wine/75 sm:mt-4 sm:text-lg ${
            hideSubtitleOnMobile ? "hidden sm:block" : ""
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
