"use client";

import { useEffect, useState } from "react";

const PARTICLE_COUNT = 18;

function particleStyle(index: number) {
  const left = 8 + ((index * 37) % 84);
  const delay = (index % 7) * 0.35;
  const duration = 3.8 + (index % 5) * 0.4;
  const size = 3 + (index % 3);
  return { left: `${left}%`, animationDelay: `${delay}s`, animationDuration: `${duration}s`, width: size, height: size };
}

export function CelebrationSparkles() {
  const [visible, setVisible] = useState(true);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(!reduced);
    if (reduced) return;

    const timer = window.setTimeout(() => setVisible(false), 4800);
    return () => window.clearTimeout(timer);
  }, []);

  if (!enabled || !visible) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
        <span
          key={i}
          className="booking-sparkle absolute bottom-[18%] rounded-full bg-gold/70 shadow-[0_0_12px_rgba(197,154,91,0.55)]"
          style={particleStyle(i)}
        />
      ))}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-gold/10 via-transparent to-transparent opacity-60" />
    </div>
  );
}
