// Small line icons for the quiz answers, drawn for MyTable. Decorative only
// (the answer text carries the meaning). No emojis, no brand logos.

import type { ReactNode } from "react";
import type { QuizStepId } from "@/lib/jouw-tafel/quiz-logic";

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function Svg({ className = "h-5 w-5", children }: IconProps & { children: ReactNode }) {
  return (
    <svg {...base} className={className}>
      {children}
    </svg>
  );
}

// ---------------------------------------------------------------- people

function Person({ x = 12, y = 0, s = 1 }: { x?: number; y?: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) translate(-12 0)`}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.8 19.5c.6-3.4 3.1-5.5 6.2-5.5s5.6 2.1 6.2 5.5" />
    </g>
  );
}

export const PersonIcon = (p: IconProps) => (
  <Svg {...p}>
    <Person />
  </Svg>
);

export const TwoPeopleIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="8.5" r="2.9" />
    <path d="M3.5 19.5c.5-3 2.7-4.9 5.5-4.9s5 1.9 5.5 4.9" />
    <circle cx="16.2" cy="7.6" r="2.5" />
    <path d="M15.6 13.3c2.6-.3 4.6 1.4 5 4.4" />
  </Svg>
);

export const VenusIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="9" r="5" />
    <path d="M12 14v7M9 18h6" />
  </Svg>
);

export const MarsIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="10" cy="14" r="5" />
    <path d="M13.6 10.4 19.5 4.5M15 4.5h4.5V9" />
  </Svg>
);

export const SparkleIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.5c.6 4.4 2.1 5.9 6.5 6.5-4.4.6-5.9 2.1-6.5 6.5-.6-4.4-2.1-5.9-6.5-6.5 4.4-.6 5.9-2.1 6.5-6.5Z" />
    <path d="M18.5 16v4M16.5 18h4" />
  </Svg>
);

export const LockIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5.5" y="10.5" width="13" height="9.5" rx="2" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </Svg>
);

export const TwoWomenIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="8" cy="8.5" r="2.7" />
    <path d="M5.3 9.2c-.4 2-.9 3-1.8 3.6M10.7 9.2c.4 2 .9 3 1.8 3.6" />
    <path d="M3 19.5c.5-2.9 2.5-4.6 5-4.6s4.5 1.7 5 4.6" />
    <circle cx="16" cy="8.5" r="2.7" />
    <path d="M13.3 9.2c-.4 2-.9 3-1.8 3.6M18.7 9.2c.4 2 .9 3 1.8 3.6" />
    <path d="M13.8 15.3c.6-.3 1.4-.4 2.2-.4 2.5 0 4.5 1.7 5 4.6" />
  </Svg>
);

export const SameAgeIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="7.5" cy="8.5" r="2.6" />
    <path d="M3 18.5c.4-2.7 2.1-4.3 4.5-4.3s4.1 1.6 4.5 4.3" />
    <circle cx="16.5" cy="8.5" r="2.6" />
    <path d="M12 18.5c.4-2.7 2.1-4.3 4.5-4.3s4.1 1.6 4.5 4.3" />
  </Svg>
);

export const MixedAgeIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="7" cy="7.2" r="2.9" />
    <path d="M2.4 19c.5-3.1 2.2-5 4.6-5s4.1 1.9 4.6 5" />
    <circle cx="17" cy="11" r="2.1" />
    <path d="M13.6 19c.4-2.2 1.7-3.5 3.4-3.5s3 1.3 3.4 3.5" />
  </Svg>
);

export const HeartIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 19.5s-7.5-4.4-7.5-9.7A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5c0 5.3-7.5 9.7-7.5 9.7Z" />
  </Svg>
);

export const HouseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 10.5 12 4l8 6.5" />
    <path d="M6 9v10.5h12V9" />
    <path d="M10 19.5v-4.5a2 2 0 0 1 4 0v4.5" />
  </Svg>
);

export const BriefcaseIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="7.5" width="17" height="12" rx="2.2" />
    <path d="M9 7.5V6a1.8 1.8 0 0 1 1.8-1.8h2.4A1.8 1.8 0 0 1 15 6v1.5" />
    <path d="M3.5 12.5h17M11 12.5v1.5h2v-1.5" />
  </Svg>
);

// ---------------------------------------------------------------- talk

export const BubbleIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-8l-4.5 3.5v-3.5H5A1.5 1.5 0 0 1 3.5 15V7A1.5 1.5 0 0 1 5 5.5Z" />
    <path d="M8 10h8M8 13h5" />
  </Svg>
);

export const EarIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 9.5a5.5 5.5 0 0 1 11 0c0 2.6-1.6 3.6-2.6 4.8-.9 1.1-.9 2.5-1.6 3.7a2.9 2.9 0 0 1-5.1-.7" />
    <path d="M10 9.8a2.6 2.6 0 0 1 5.1-.6c.3 1.3-.7 2-1.5 2.4" />
  </Svg>
);

export const TwoBubblesIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.2 4.5h9.3a1.2 1.2 0 0 1 1.2 1.2v5.6a1.2 1.2 0 0 1-1.2 1.2H8.4l-3 2.4v-2.4H4.2A1.2 1.2 0 0 1 3 11.3V5.7a1.2 1.2 0 0 1 1.2-1.2Z" />
    <path d="M17.4 9.5h1.4A1.2 1.2 0 0 1 20 10.7v5.6a1.2 1.2 0 0 1-1.2 1.2h-1.2v2.4l-3-2.4h-4.2a1.2 1.2 0 0 1-1.2-1.2v-.8" />
  </Svg>
);

// ---------------------------------------------------------------- wine

/** A wine glass; `fill` tints the wine in the bowl. */
export function WineGlassIcon({ className = "h-5 w-5", fill }: IconProps & { fill?: string }) {
  return (
    <Svg className={className}>
      {fill ? <path d="M7.9 8.6h8.2l-.2 1.6A3.9 3.9 0 0 1 12 13.6a3.9 3.9 0 0 1-3.9-3.4l-.2-1.6Z" fill={fill} stroke="none" /> : null}
      <path d="M7.5 3.5h9l-.6 6.7A3.9 3.9 0 0 1 12 13.8a3.9 3.9 0 0 1-3.9-3.6L7.5 3.5Z" />
      <path d="M12 13.8v6.2M8.8 20.5h6.4" />
    </Svg>
  );
}

export const RedWineIcon = (p: IconProps) => <WineGlassIcon {...p} fill="#7a1a2a" />;
export const WhiteWineIcon = (p: IconProps) => <WineGlassIcon {...p} fill="#e7cf86" />;

export const BubblesIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9.6 9.5h4.8l-.3 2.6A2.1 2.1 0 0 1 12 14a2.1 2.1 0 0 1-2.1-1.9l-.3-2.6Z" fill="#e7cf86" stroke="none" />
    <path d="M9.2 3.5h5.6l-.6 8.6A2.2 2.2 0 0 1 12 14.2a2.2 2.2 0 0 1-2.2-2.1l-.6-8.6Z" />
    <path d="M12 14.2v5.8M9.4 20.5h5.2" />
    <circle cx="17.6" cy="5" r=".9" />
    <circle cx="19" cy="8.4" r=".6" />
    <circle cx="5.8" cy="6.6" r=".7" />
  </Svg>
);

export const WaterGlassIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6.5 4h11l-1.4 14.6a1.6 1.6 0 0 1-1.6 1.4h-5a1.6 1.6 0 0 1-1.6-1.4L6.5 4Z" />
    <path d="M12 9.3c1.2 1.4 1.9 2.4 1.9 3.3a1.9 1.9 0 0 1-3.8 0c0-.9.7-1.9 1.9-3.3Z" fill="#cfe0e6" />
  </Svg>
);

export const GrapesIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 6.5V3.5M12 4.5c1.5-1.4 3.4-1.5 4.8-.6" />
    <circle cx="9.4" cy="9" r="2.1" />
    <circle cx="14.6" cy="9" r="2.1" />
    <circle cx="12" cy="12.6" r="2.1" />
    <circle cx="7.8" cy="13" r="1.9" />
    <circle cx="16.2" cy="13" r="1.9" />
    <circle cx="12" cy="16.9" r="2" />
  </Svg>
);

// ---------------------------------------------------------------- places, mood

export const CompassIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m14.9 9.1-1.8 4-4 1.8 1.8-4 4-1.8Z" />
  </Svg>
);

export const SunIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3.8" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
  </Svg>
);

export const GiftIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="9" width="16" height="11" rx="1.6" />
    <path d="M3.5 9h17M12 9v11" />
    <path d="M12 9c-1.2-2.8-4.5-4.3-5.4-2.6C5.8 8 9 9 12 9Zm0 0c1.2-2.8 4.5-4.3 5.4-2.6C18.2 8 15 9 12 9Z" />
  </Svg>
);

export const CityIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 20.5h17" />
    <path d="M5 20.5V9.5l4-2v13M9 20.5V4.5h6v16M15 20.5v-9h4v9" />
    <path d="M11.2 8h1.6M11.2 11h1.6M11.2 14h1.6M6.6 12h.8M6.6 15h.8M16.6 14.5h.8M16.6 17h.8" />
  </Svg>
);

export const PinIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
    <circle cx="12" cy="10" r="2.4" />
  </Svg>
);

export const PinPlusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
    <path d="M12 7.6v4.8M9.6 10h4.8" />
  </Svg>
);

// ---------------------------------------------------------------- food

export const LeafIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 19c0-8 5-13.5 14-14 .2 8.8-5 14-12.6 14" />
    <path d="M5 19c3-4 6-6.6 9.5-8.5" />
  </Svg>
);

export const SproutIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 20.5V11" />
    <path d="M12 11c0-3.6-2.6-6-6.5-6 0 3.7 2.6 6 6.5 6Z" />
    <path d="M12 13c0-3.3 2.4-5.6 6.5-5.6 0 3.4-2.4 5.6-6.5 5.6Z" />
    <path d="M8 20.5h8" />
  </Svg>
);

export const WheatOffIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 20.5V7" />
    <path d="M12 7c-1.6-.6-2.4-2-2.2-3.6 1.6.2 2.6 1.3 2.2 3.6Zm0 0c1.6-.6 2.4-2 2.2-3.6-1.6.2-2.6 1.3-2.2 3.6Z" />
    <path d="M12 11.5c-1.9-.2-3.2-1.5-3.4-3.3 1.9.1 3.3 1.3 3.4 3.3Zm0 0c1.9-.2 3.2-1.5 3.4-3.3-1.9.1-3.3 1.3-3.4 3.3Z" />
    <path d="M12 16c-1.9-.2-3.2-1.5-3.4-3.3 1.9.1 3.3 1.3 3.4 3.3Zm0 0c1.9-.2 3.2-1.5 3.4-3.3-1.9.1-3.3 1.3-3.4 3.3Z" />
    <path d="M4.5 4.5l15 15" />
  </Svg>
);

export const MilkOffIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 3.5h6v2.6l2 3V19a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 19V9.1l2-3V3.5Z" />
    <path d="M7 11h10" />
    <path d="M4.5 4.5l15 15" />
  </Svg>
);

export const NutIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6.2 10.2h11.6c0 5.4-2.6 9.8-5.8 9.8s-5.8-4.4-5.8-9.8Z" />
    <path d="M5.5 10.2c0-2.8 2.9-4.7 6.5-4.7s6.5 1.9 6.5 4.7" />
    <path d="M12 5.5V3.5" />
  </Svg>
);

export const PencilIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15.5 4.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L15.5 4.5Z" />
    <path d="M13.5 6.5l3 3" />
  </Svg>
);

export const PlateIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="5" />
  </Svg>
);

// ---------------------------------------------------------------- formats

export const FootstepsIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7.4 3.8c1.6 0 2.5 1.8 2.5 4s-.9 3.8-2.3 3.8S5 10.3 5 8.3s.8-4.5 2.4-4.5Z" />
    <path d="M5.5 14.2c.2 1.7 1 2.6 2.1 2.6s1.8-.8 1.9-2.4" />
    <path d="M16.6 7.8c1.6 0 2.4 2.5 2.4 4.5s-1.2 3.3-2.6 3.3-2.3-1.6-2.3-3.8.9-4 2.5-4Z" />
    <path d="M14.5 18.4c.1 1.6.8 2.4 1.9 2.4s1.9-.9 2.1-2.6" />
  </Svg>
);

export const ChefHatIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 14.5a4 4 0 0 1-.6-7.9 5.5 5.5 0 0 1 11.2 0 4 4 0 0 1-.6 7.9" />
    <path d="M7 14.5v5h10v-5" />
    <path d="M7 17h10" />
  </Svg>
);

export const CalendarSunIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    <circle cx="12" cy="15" r="2" />
  </Svg>
);

// ---------------------------------------------------------------- where from

export const CameraIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="4" width="16" height="16" rx="4.5" />
    <circle cx="12" cy="12" r="3.6" />
    <circle cx="16.6" cy="7.4" r=".5" fill="currentColor" />
  </Svg>
);

export const ThumbIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7.5 10.5v9H4.5v-9h3Z" />
    <path d="M7.5 10.5 11 4a2 2 0 0 1 2.3 2.4l-.7 3.1h5a2 2 0 0 1 2 2.4l-1.3 6.3a2 2 0 0 1-2 1.6H7.5" />
  </Svg>
);

export const SearchIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="m15 15 5 5" />
  </Svg>
);

export const DotsIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="6" cy="12" r="1.1" fill="currentColor" />
    <circle cx="12" cy="12" r="1.1" fill="currentColor" />
    <circle cx="18" cy="12" r="1.1" fill="currentColor" />
  </Svg>
);

// ---------------------------------------------------------------- misc

export const CheckCircleIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8.5 12.2 2.4 2.4 4.6-4.8" />
  </Svg>
);

export const HourglassIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 3.5h10M7 20.5h10" />
    <path d="M8 3.5c0 4 4 5.5 4 8.5s-4 4.5-4 8.5M16 3.5c0 4-4 5.5-4 8.5s4 4.5 4 8.5" />
  </Svg>
);

export const ClockIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);

export const QuoteIcon = ({ className = "h-6 w-6" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M10 6.5C6.6 7.6 4.5 10.3 4.5 13.8c0 2.2 1.3 3.7 3.2 3.7 1.6 0 2.8-1.2 2.8-2.8 0-1.5-1.1-2.6-2.5-2.7.3-1.6 1.4-2.8 2.6-3.4L10 6.5Zm9 0c-3.4 1.1-5.5 3.8-5.5 7.3 0 2.2 1.3 3.7 3.2 3.7 1.6 0 2.8-1.2 2.8-2.8 0-1.5-1.1-2.6-2.5-2.7.3-1.6 1.4-2.8 2.6-3.4L19 6.5Z" />
  </svg>
);

/** "NL" / "EN" / "NL EN" as a small typographic badge instead of a flag. */
export function LanguageBadge({ codes }: { codes: string[] }) {
  return (
    <span aria-hidden className="flex items-center gap-0.5 text-[0.62rem] font-bold leading-none tracking-[0.06em]">
      {codes.map((code) => (
        <span key={code}>{code}</span>
      ))}
    </span>
  );
}

// ---------------------------------------------------------------- lookup

type IconComponent = (props: IconProps) => ReactNode;

const STEP_ICONS: Partial<Record<QuizStepId, Record<string, IconComponent>>> = {
  leeftijd: { yes: SameAgeIcon, no: MixedAgeIcon },
  gender: { female: VenusIcon, male: MarsIcon, other: SparkleIcon, unspecified: LockIcon },
  tafeltype: { mixed: TwoPeopleIcon, girls_only: TwoWomenIcon, any: CheckCircleIcon },
  zoekt: { places: CompassIcon, cosy: SunIcon, wines: GrapesIcon, treat: GiftIcon, new_city: CityIcon },
  gesprek: { talker: BubbleIcon, listener: EarIcon, both: TwoBubblesIcon },
  wijn: { red: RedWineIcon, white: WhiteWineIcon, bubbles: BubblesIcon, none: WaterGlassIcon },
  gezelschap: { alone: PersonIcon, with: TwoPeopleIcon },
  wie: { friend: TwoPeopleIcon, partner: HeartIcon, family: HouseIcon, colleague: BriefcaseIcon },
  dieet: {
    vegetarian: LeafIcon,
    vegan: SproutIcon,
    gluten_free: WheatOffIcon,
    lactose_free: MilkOffIcon,
    nut_allergy: NutIcon,
    other: PencilIcon,
    none: PlateIcon,
  },
  formats: {
    wine_tasting: WineGlassIcon,
    wine_walk: FootstepsIcon,
    chefs_special: ChefHatIcon,
    sunday_only: CalendarSunIcon,
  },
  bron: { instagram: CameraIcon, facebook: ThumbIcon, friends: TwoPeopleIcon, google: SearchIcon, other: DotsIcon },
  klaar: { yes: CheckCircleIcon, unsure: HourglassIcon },
};

const LANGUAGE_CODES: Record<string, string[]> = { dutch: ["NL"], english: ["EN"], both: ["NL", "EN"] };

/** The icon for one answer, or null when the step has none. */
export function optionIcon(step: QuizStepId, option: string, className = "h-[1.35rem] w-[1.35rem]"): ReactNode {
  if (step === "taal") {
    const codes = LANGUAGE_CODES[option];
    return codes ? <LanguageBadge codes={codes} /> : null;
  }
  if (step === "stad") return option === "other" ? <PinPlusIcon className={className} /> : <PinIcon className={className} />;
  const Icon = STEP_ICONS[step]?.[option];
  return Icon ? <Icon className={className} /> : null;
}
