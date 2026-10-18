"use client";

import { useEffect } from "react";

export default function ReloadScrollReset() {
  useEffect(() => {
    const nav = performance.getEntriesByType("navigation")[0] as
      PerformanceNavigationTiming | undefined;
    if (nav?.type === "reload") {
      history.scrollRestoration = "manual";
      window.scrollTo(0, 0);
    }
  }, []);

  return null;
}
