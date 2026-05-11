"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // PWA install still works as a web app; caching is best-effort in demo mode.
      });
    }
  }, []);

  return null;
}
