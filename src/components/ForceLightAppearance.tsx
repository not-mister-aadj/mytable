"use client";

import { useEffect } from "react";

function parseRgbLuminance(rgb: string): number | null {
  const match = rgb.match(/[\d.]+/g);
  if (!match || match.length < 3) return null;
  const [r, g, b] = match.map(Number);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * Samsung Internet can ignore `color-scheme: light` and algorithmically darken
 * pages. When that happens, counter-invert restores the designed palette.
 */
export function ForceLightAppearance() {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.colorMode = "light";

    const isSamsung = /SamsungBrowser/i.test(navigator.userAgent);
    if (!isSamsung) return;

    root.classList.add("samsung-browser");

    const applyIfForcedDark = () => {
      const bodyBg = getComputedStyle(document.body).backgroundColor;
      const htmlBg = getComputedStyle(root).backgroundColor;
      const bodyLum = parseRgbLuminance(bodyBg);
      const htmlLum = parseRgbLuminance(htmlBg);
      const forcedDark =
        (bodyLum !== null && bodyLum < 0.55) ||
        (htmlLum !== null && htmlLum < 0.55);

      root.classList.toggle("samsung-force-light", forcedDark);
    };

    applyIfForcedDark();
    requestAnimationFrame(applyIfForcedDark);
    window.setTimeout(applyIfForcedDark, 120);
    window.setTimeout(applyIfForcedDark, 500);

    const poll = window.setInterval(applyIfForcedDark, 800);
    window.setTimeout(() => window.clearInterval(poll), 5000);

    const observer = new MutationObserver(applyIfForcedDark);
    observer.observe(root, { attributes: true, attributeFilter: ["class", "style"] });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class", "style"] });

    window.addEventListener("resize", applyIfForcedDark);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", applyIfForcedDark);
      window.clearInterval(poll);
    };
  }, []);

  return null;
}
