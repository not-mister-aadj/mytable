type Variant = "success" | "failed";

export function BookingStatusIcon({ variant }: { variant: Variant }) {
  if (variant === "failed") {
    return (
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-rose-deep/20 bg-rose-soft/80 shadow-[0_8px_32px_rgba(157,77,111,0.12)]">
        <svg
          viewBox="0 0 24 24"
          className="h-7 w-7 text-rose-deep"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            d="M12 8.5v5M12 16.2h.01"
          />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-gold/15 blur-md" />
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-gold/30 bg-beige/90 shadow-[0_8px_32px_rgba(197,154,91,0.2)]">
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8 text-gold"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 4.5h8l1 3.5H7l1-3.5Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 8h10v9.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 17.5V8Z"
          />
          <path strokeLinecap="round" d="M9.5 11.5h5" />
        </svg>
      </div>
    </div>
  );
}
