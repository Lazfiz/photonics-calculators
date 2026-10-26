"use client";

import { useEffect } from "react";
import { URL_STATE_ATTRIBUTE } from "@/lib/url-state-pending";

/**
 * Shows the calculator hidden by `URL_STATE_PENDING_SCRIPT`. Its effect runs after hydration, in the same
 * flush as the `useURLState` effects that re-render with the URL values; the next frame paints those.
 */
export default function UrlStateReveal() {
  useEffect(() => {
    const frame = requestAnimationFrame(() => document.documentElement.removeAttribute(URL_STATE_ATTRIBUTE));
    return () => cancelAnimationFrame(frame);
  }, []);
  return null;
}
