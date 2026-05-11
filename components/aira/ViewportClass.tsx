"use client";

import { useEffect } from "react";

function classify(width: number) {
  if (width < 640) return "phone";
  if (width < 1024) return "tablet";
  return "desktop";
}

export function ViewportClass() {
  useEffect(() => {
    const sync = () => {
      document.documentElement.dataset.device = classify(window.innerWidth);
    };

    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, []);

  return null;
}
