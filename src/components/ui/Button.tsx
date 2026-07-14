import { type MouseEvent, type ReactNode } from "react";
import { FastLink } from "./FastLink";

type ButtonVariant = "primary" | "secondary" | "outline";

interface ButtonProps {
  href?: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  type?: "button" | "submit";
  onClick?: (event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-burgundy text-cream hover:bg-wine shadow-sm hover:shadow-md",
  secondary:
    "bg-beige text-wine border border-border-subtle hover:border-burgundy/30 hover:bg-cream",
  outline:
    "border border-burgundy/40 text-burgundy bg-transparent hover:bg-burgundy hover:text-cream",
};

export function Button({
  href,
  children,
  variant = "primary",
  className = "",
  type = "button",
  onClick,
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium tracking-wide transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy";

  const classes = `${base} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <FastLink href={href} className={classes} onClick={onClick}>
        {children}
      </FastLink>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
